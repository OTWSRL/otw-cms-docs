import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import type { Reference } from '@/docs/reference-types'
import { extractReference, parseCliUsage } from '../scripts/reference/extract.ts'

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
