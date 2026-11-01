import { mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'
import ts from 'typescript'
import { afterAll, describe, expect, it } from 'vitest'
import { loadHandbooks } from '@/docs/content'
import { renderMarkdown } from '@/docs/markdown'

const ROOT = join(import.meta.dirname, '..')
const SAMPLES = join(ROOT, '.samples')

// As a plugin or site package compiles: strict, JSX, bundler resolution, Node's types.
const OPTIONS: ts.CompilerOptions = {
  target: ts.ScriptTarget.ES2023,
  lib: ['lib.es2023.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'],
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  jsx: ts.JsxEmit.ReactJSX,
  strict: true,
  noEmit: true,
  skipLibCheck: true,
  esModuleInterop: true,
  resolveJsonModule: true,
  isolatedModules: true,
  types: ['node'],
  // A site's CSS and its generated site module exist only in a real site.
  noUncheckedSideEffectImports: false,
  // Installed from npm, the CMS's packages share the site's drizzle-orm through their peer
  // dependency. Linked to a checkout, they'd find the checkout's copy, whose types don't match.
  paths: {
    'drizzle-orm': [join(ROOT, 'node_modules', 'drizzle-orm')],
    'drizzle-orm/*': [join(ROOT, 'node_modules', 'drizzle-orm', '*')],
  },
}

/** One host for every page, so the packages' and libraries' types are parsed once. */
function cachingHost(): ts.CompilerHost {
  const host = ts.createCompilerHost(OPTIONS)
  const cache = new Map<string, ts.SourceFile | undefined>()
  const getSourceFile = host.getSourceFile
  host.getSourceFile = (fileName, languageVersion, ...rest) => {
    if (fileName.startsWith(SAMPLES)) return getSourceFile(fileName, languageVersion, ...rest)
    if (!cache.has(fileName)) cache.set(fileName, getSourceFile(fileName, languageVersion, ...rest))
    return cache.get(fileName)
  }
  return host
}

/**
 * Code blocks with a `filename="…"` are whole files. Each page's files compile together, against
 * the packages this site has installed, so a sample that drifts from the API fails here.
 */
describe('code samples in the handbooks', () => {
  afterAll(() => rm(SAMPLES, { recursive: true, force: true }))

  it('compile against the installed packages, and JSON samples parse', async () => {
    const host = cachingHost()
    const problems: string[] = []
    let compiled = 0
    for (const handbook of await loadHandbooks()) {
      for (const page of handbook.pages) {
        const { files } = await renderMarkdown(page.body)
        const dir = join(SAMPLES, page.url)
        const roots: string[] = []
        for (const file of files) {
          if (file.lang === 'json') {
            try {
              JSON.parse(file.code)
            } catch (error) {
              problems.push(`${page.file} ${file.filename}: ${(error as Error).message}`)
            }
          }
          if (!['ts', 'tsx'].includes(file.lang)) continue
          const path = join(dir, file.filename)
          await mkdir(dirname(path), { recursive: true })
          await writeFile(path, file.code)
          roots.push(path)
        }
        if (roots.length === 0) continue
        compiled += roots.length
        const program = ts.createProgram(roots, OPTIONS, host)
        // The samples' own errors: the packages' source is checked by their own builds.
        const diagnostics = [
          ...program.getOptionsDiagnostics(),
          ...program.getGlobalDiagnostics(),
          ...roots.flatMap((root) =>
            ts.getPreEmitDiagnostics(program, program.getSourceFile(root)),
          ),
        ]
        for (const diagnostic of diagnostics) {
          const where = diagnostic.file
            ? `${relative(dir, diagnostic.file.fileName)}:${diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start ?? 0).line + 1}`
            : ''
          problems.push(
            `${page.file} ${where}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')}`,
          )
        }
      }
    }
    expect(problems).toEqual([])
    expect(compiled).toBeGreaterThan(0)
  })
})
