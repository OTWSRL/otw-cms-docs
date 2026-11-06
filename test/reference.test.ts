import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, relative } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Reference } from '@/docs/reference-types'
import { extractReference, findPackages, parseCliUsage } from '../scripts/reference/extract.ts'

const ROOT = join(import.meta.dirname, '..')

describe('parseCliUsage', () => {
  it('splits the help into commands, their arguments, descriptions and flags', () => {
    const usage = `Usage: cms <command> [options]

Commands:
  generate   Write the route files
  update [packages...]
             Update core and plugins; name plugins
             to update only those
               --check          report what would change
               --port <n>       public port (default: PORT,
                                or 3000)

Options:
  --root <dir>   The site's directory`
    expect(parseCliUsage(usage)).toEqual([
      { name: 'generate', args: '', description: 'Write the route files', flags: [] },
      {
        name: 'update',
        args: '[packages...]',
        description: 'Update core and plugins; name plugins to update only those',
        flags: [
          { flag: '--check', description: 'report what would change' },
          { flag: '--port <n>', description: 'public port (default: PORT, or 3000)' },
        ],
      },
    ])
  })
})

describe('findPackages', () => {
  const work = mkdtempSync(join(tmpdir(), 'docs-find-packages-'))
  afterAll(() => rmSync(work, { recursive: true, force: true }))

  const manifest = (dir: string, name: string, dependencies: Record<string, string> = {}) => {
    mkdirSync(dir, { recursive: true })
    writeFileSync(
      join(dir, 'package.json'),
      JSON.stringify({ name, version: '1.0.0', dependencies }),
    )
  }
  const link = (target: string, path: string) => {
    mkdirSync(dirname(path), { recursive: true })
    symlinkSync(relative(dirname(path), target), path)
  }
  const PLUGIN = '@otwdesign/plugin-x'
  const CORE = '@otwdesign/x-core'

  // A plugin installed from npm that depends on another of our packages, as plugin-db does on
  // db-core. Its dependency isn't inside it: the package manager puts it where Node finds it by
  // walking up.
  it('finds an installed package’s own dependencies in pnpm’s store', () => {
    const site = join(work, 'pnpm')
    manifest(site, 'site', { [PLUGIN]: '1.0.0' })
    const store = join(site, 'node_modules/.pnpm')
    const plugin = join(store, '@otwdesign+plugin-x@1.0.0/node_modules', PLUGIN)
    const core = join(store, '@otwdesign+x-core@1.0.0/node_modules', CORE)
    manifest(plugin, PLUGIN, { [CORE]: '1.0.0' })
    manifest(core, CORE)
    link(core, join(store, '@otwdesign+plugin-x@1.0.0/node_modules', CORE))
    link(plugin, join(site, 'node_modules', PLUGIN))
    expect(findPackages(site).map((pkg) => pkg.name)).toEqual([PLUGIN, CORE])
  })

  it('finds them hoisted to the site’s node_modules, as npm installs them', () => {
    const site = join(work, 'npm')
    manifest(site, 'site', { [PLUGIN]: '1.0.0' })
    manifest(join(site, 'node_modules', PLUGIN), PLUGIN, { [CORE]: '1.0.0' })
    manifest(join(site, 'node_modules', CORE), CORE)
    expect(findPackages(site).map((pkg) => pkg.name)).toEqual([PLUGIN, CORE])
  })
})

// A plugin installed from npm lives under node_modules, in pnpm's store or npm's tree; a linked one
// doesn't. Its exports and extension points are read either way.
describe('extractReference on a plugin installed from npm', () => {
  const site = mkdtempSync(join(tmpdir(), 'docs-npm-plugin-'))
  afterAll(() => rmSync(site, { recursive: true, force: true }))

  it('reads its exports and the extension points it declares', () => {
    const write = (path: string, content: string) => {
      mkdirSync(dirname(join(site, path)), { recursive: true })
      writeFileSync(join(site, path), content)
    }
    const PLUGIN = '@otwdesign/plugin-x'
    write(
      'package.json',
      JSON.stringify({ dependencies: { '@otwdesign/sdk': '*', [PLUGIN]: '1.0.0' } }),
    )
    mkdirSync(join(site, 'node_modules/@otwdesign'), { recursive: true })
    symlinkSync(
      realpathSync(join(ROOT, 'node_modules/@otwdesign/sdk')),
      join(site, 'node_modules/@otwdesign/sdk'),
    )
    write(
      `node_modules/${PLUGIN}/package.json`,
      JSON.stringify({
        name: PLUGIN,
        version: '1.0.0',
        exports: { '.': './src/index.ts' },
        peerDependencies: { '@otwdesign/sdk': '*' },
      }),
    )
    write(
      `node_modules/${PLUGIN}/src/index.ts`,
      `/** Says hello. */
export function hello(): string {
  return 'hello'
}

declare module '@otwdesign/sdk' {
  interface Capabilities {
    /** Use X. */
    'x.manage': true
  }
}
`,
    )
    const reference = extractReference(site)
    const plugin = reference.packages.find((pkg) => pkg.name === PLUGIN)
    expect(plugin?.symbols.map((symbol) => [symbol.name, symbol.description])).toEqual([
      ['hello', 'Says hello.'],
    ])
    const capability = reference.extensions.find((point) => point.name === 'x.manage')
    expect(capability).toMatchObject({ kind: 'capability', description: 'Use X.' })
    expect(capability?.source.package).toBe(PLUGIN)
  }, 60_000)
})

describe('extractReference', () => {
  let reference: Reference
  beforeAll(() => {
    reference = extractReference(ROOT)
  })

  it('reads every @otw package the site depends on, and theirs', () => {
    const names = reference.packages.map((pkg) => pkg.name)
    expect(names).toEqual(
      expect.arrayContaining([
        '@otwdesign/sdk',
        '@otwdesign/next',
        '@otwdesign/core',
        '@otwdesign/plugin-commerce',
      ]),
    )
    expect(reference.packages.find((pkg) => pkg.name === '@otwdesign/core')?.documented).toBe(false)
  })

  it('finds plugins’ extension points, where they’re fired, and the types they carry', () => {
    const paid = reference.extensions.find((point) => point.name === 'commerce.order.paid')!
    expect(paid).toMatchObject({
      kind: 'action',
      type: '{ order: Order }',
      source: { package: '@otwdesign/plugin-commerce' },
    })
    expect(paid.usages.map((usage) => usage.call)).toContain('doAction')
    expect(paid.types.map((type) => type.name)).toContain('Order')
    expect(paid.types.find((type) => type.name === 'Order')!.text).toMatch(
      /^(\/\*\*[\s\S]*\*\/\n)?export interface Order/,
    )
  })

  it('records where a setting is declared and a capability required', () => {
    const currency = reference.extensions.find((point) => point.name === 'commerce.currency')!
    expect(currency.definition).toMatch(/^'commerce\.currency': \{\s+type: 'text'/)
    const products = reference.extensions.find(
      (point) => point.name === 'commerce.manage_products',
    )!
    expect(products.usages.map((usage) => usage.call)).toContain('requires')
  })

  it('documents exported functions with their signatures and members', () => {
    const sdk = reference.packages.find((pkg) => pkg.name === '@otwdesign/sdk')!
    const definePlugin = sdk.symbols.find((symbol) => symbol.name === 'definePlugin')!
    expect(definePlugin).toMatchObject({
      kind: 'function',
      entry: '@otwdesign/sdk',
      signature: 'function definePlugin(definition: PluginDefinition): PluginDefinition',
    })
    const plugin = sdk.symbols.find((symbol) => symbol.name === 'PluginDefinition')!
    expect(plugin.members.map((member) => member.name)).toEqual(
      expect.arrayContaining(['id', 'version', 'setup']),
    )
    const slot = reference.packages
      .find((pkg) => pkg.name === '@otwdesign/next')!
      .symbols.find((s) => s.name === 'Slot')!
    expect(slot).toMatchObject({ kind: 'component', entry: '@otwdesign/next/site' })
  })

  it('takes the commands from the CLI’s own help, and the variables the code reads', () => {
    expect(reference.cli.commands.map((command) => command.name)).toEqual([
      'generate',
      'migrate',
      'serve',
      'update',
    ])
    const names = reference.env.map((variable) => variable.name)
    expect(names).toEqual(
      expect.arrayContaining(['DATABASE_URL', 'CMS_SECRET', 'STRIPE_SECRET_KEY']),
    )
    expect(names).not.toContain('NODE_ENV')
  })

  // What keeps the reference whole as the CMS grows: anything public without a doc comment fails.
  it('has a description for every extension point', () => {
    const missing = reference.extensions.filter((point) => !point.description)
    expect(
      missing.map(
        (point) =>
          `${point.kind} ${point.name} (${point.source.package} ${point.source.file}:${point.source.line})`,
      ),
    ).toEqual([])
  })

  it('has a description for everything the documented packages export', () => {
    const missing = reference.packages.flatMap((pkg) =>
      pkg.symbols
        .filter((symbol) => !symbol.description)
        .map(
          (symbol) =>
            `${symbol.entry} ${symbol.name} (${symbol.source.file}:${symbol.source.line})`,
        ),
    )
    expect(missing).toEqual([])
  })

  it('documents every environment variable the code reads in the hosting handbook', async () => {
    const page = await readFile(
      join(ROOT, 'content', 'hosting', 'environment-variables.md'),
      'utf8',
    )
    const missing = reference.env.filter((variable) => !page.includes(`\`${variable.name}\``))
    expect(
      missing.map(
        (variable) =>
          `${variable.name} (read in ${variable.readBy[0]!.package} ${variable.readBy[0]!.file})`,
      ),
    ).toEqual([])
  })
})
