import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, realpathSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import ts from 'typescript'
import type {
  ApiMember,
  ApiSymbol,
  CliCommand,
  EnvVar,
  ExtensionKind,
  ExtensionPoint,
  PackageApi,
  Reference,
  SourceLocation,
  SymbolKind,
  TypeDefinition,
} from '../../src/docs/reference-types.ts'

const SCOPE = '@otw/'
const SDK = '@otw/sdk'
/** Read for their extension points and the types others refer to, but not an API to document. */
const INTERNAL = new Set(['@otw/core', '@otw/cli'])

/** The interfaces on `@otw/sdk` that plugins extend, and the kind of entry each declares. */
const EXTENSION_INTERFACES: Readonly<Record<string, ExtensionKind>> = {
  Actions: 'action',
  Filters: 'filter',
  Slots: 'slot',
  Registries: 'registry',
  Services: 'service',
  Settings: 'setting',
  Capabilities: 'capability',
  MetaCapabilities: 'meta-capability',
}

/** Calls that name an extension point: hooking it, firing it, filling it, defining it. */
const USAGE_CALLS = new Set([
  'addAction',
  'doAction',
  'addFilter',
  'applyFilters',
  'fill',
  'define',
  'provide',
  'get',
  'service',
  'registry',
  'slot',
  'setting',
  'can',
  'capability',
  'metaCapability',
  'extendCapability',
  'grant',
  'revoke',
])

/** Variables Node.js and Next.js define, which the CMS reads but doesn't own. */
const PLATFORM_ENV = new Set(['NODE_ENV', 'NEXT_RUNTIME', 'NEXT_PHASE'])

const UPPER_SNAKE = /^[A-Z][A-Z0-9_]*$/

interface InstalledPackage {
  name: string
  version: string
  description: string
  dir: string
  /** Import path to the file its types come from, such as `@otw/next/site` → src/site/index.ts. */
  entries: Map<string, string>
  bin?: string
}

interface Manifest {
  version: string
  description?: string
  exports?: string | Record<string, string | Record<string, string>>
  types?: string
  main?: string
  bin?: string | Record<string, string>
  dependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

function readManifest(dir: string): Manifest {
  return JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as Manifest
}

const TYPED_SOURCE = /\.(d\.ts|tsx?)$/

function entriesOf(name: string, dir: string, manifest: Manifest): Map<string, string> {
  const entries = new Map<string, string>()
  const exports =
    typeof manifest.exports === 'string'
      ? { '.': manifest.exports }
      : (manifest.exports ?? { '.': manifest.types ?? manifest.main ?? 'index.ts' })
  for (const [subpath, target] of Object.entries(exports)) {
    const file =
      typeof target === 'string' ? target : (target.types ?? target.import ?? target.default)
    if (!file || !TYPED_SOURCE.test(file)) continue
    entries.set(subpath === '.' ? name : `${name}/${subpath.replace(/^\.\//, '')}`, join(dir, file))
  }
  return entries
}

/**
 * The `@otw/*` packages the site depends on, and theirs, wherever the package manager put them.
 * Published packages ship their TypeScript source, so linked and installed ones read the same.
 */
export function findPackages(siteRoot: string): InstalledPackage[] {
  const found = new Map<string, InstalledPackage>()
  const visit = (name: string, from: string) => {
    if (found.has(name)) return
    const link = join(from, 'node_modules', ...name.split('/'))
    if (!existsSync(link)) return
    const dir = realpathSync(link)
    const manifest = readManifest(dir)
    const bin =
      typeof manifest.bin === 'string' ? manifest.bin : Object.values(manifest.bin ?? {})[0]
    found.set(name, {
      name,
      version: manifest.version,
      description: manifest.description ?? '',
      dir,
      entries: entriesOf(name, dir, manifest),
      ...(bin ? { bin: join(dir, bin) } : {}),
    })
    const deps = { ...manifest.dependencies, ...manifest.peerDependencies }
    for (const dep of Object.keys(deps)) if (dep.startsWith(SCOPE)) visit(dep, dir)
  }
  const site = readManifest(siteRoot)
  for (const dep of Object.keys({ ...site.dependencies, ...site.devDependencies })) {
    if (dep.startsWith(SCOPE)) visit(dep, siteRoot)
  }
  return [...found.values()].sort((a, b) => a.name.localeCompare(b.name))
}

function sourceFiles(dir: string): string[] {
  const files: string[] = []
  const walk = (current: string) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const path = join(current, entry.name)
      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules' && entry.name !== 'test') walk(path)
      } else if (/\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) {
        files.push(path)
      }
    }
  }
  if (existsSync(join(dir, 'src'))) walk(join(dir, 'src'))
  return files
}

const COMPILER_OPTIONS: ts.CompilerOptions = {
  target: ts.ScriptTarget.ES2023,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  jsx: ts.JsxEmit.ReactJSX,
  strict: true,
  skipLibCheck: true,
  noEmit: true,
  allowImportingTsExtensions: true,
  types: [],
}

/** Removes the indentation every line shares, so nested declarations read as written. */
function dedent(text: string): string {
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  const indents = lines
    .slice(1)
    .filter((line) => line.trim())
    .map((line) => line.length - line.trimStart().length)
  const shared = indents.length ? Math.min(...indents) : 0
  return [lines[0], ...lines.slice(1).map((line) => line.slice(shared))].join('\n').trim()
}

class Extractor {
  private readonly program: ts.Program
  private readonly checker: ts.TypeChecker
  private readonly packages: InstalledPackage[]

  constructor(packages: InstalledPackage[]) {
    this.packages = packages
    const files = packages.flatMap((pkg) => [...sourceFiles(pkg.dir), ...pkg.entries.values()])
    this.program = ts.createProgram([...new Set(files)], COMPILER_OPTIONS)
    this.checker = this.program.getTypeChecker()
  }

  /** The package a file belongs to, or undefined for TypeScript's lib and third-party types. */
  private packageOf(fileName: string): InstalledPackage | undefined {
    return this.packages.find(
      (pkg) => fileName.startsWith(pkg.dir + sep) && !fileName.includes(`${sep}node_modules${sep}`),
    )
  }

  private files(pkg: InstalledPackage): ts.SourceFile[] {
    return this.program
      .getSourceFiles()
      .filter((file) => this.packageOf(file.fileName) === pkg && !file.fileName.endsWith('.d.ts'))
  }

  private location(node: ts.Node): SourceLocation {
    const file = node.getSourceFile()
    const pkg = this.packageOf(file.fileName)
    return {
      package: pkg?.name ?? '',
      file: relative(pkg?.dir ?? '', file.fileName)
        .split(sep)
        .join('/'),
      line: file.getLineAndCharacterOfPosition(node.getStart()).line + 1,
    }
  }

  private doc(node: ts.Node): { description: string; deprecated?: string } {
    const description = ts
      .getJSDocCommentsAndTags(node)
      .filter(ts.isJSDoc)
      .map((doc) => ts.getTextOfJSDocComment(doc.comment)?.trim() ?? '')
      .filter(Boolean)
      .join('\n\n')
    const tag = ts.getJSDocDeprecatedTag(node)
    if (!tag) return { description }
    return {
      description,
      deprecated: ts.getTextOfJSDocComment(tag.comment)?.trim() || 'Deprecated.',
    }
  }

  /** Source text with the declaration's doc comment, not the comments that happen to sit above it. */
  private textWithDoc(node: ts.Node): string {
    const docs = ts.getJSDocCommentsAndTags(node).filter(ts.isJSDoc)
    const start = docs[0]?.getStart() ?? node.getStart()
    return dedent(node.getSourceFile().text.slice(start, node.getEnd()))
  }

  private resolve(symbol: ts.Symbol): ts.Symbol {
    return symbol.flags & ts.SymbolFlags.Alias ? this.checker.getAliasedSymbol(symbol) : symbol
  }

  /**
   * The packages' own types a declaration refers to, two levels deep, so a payload's `Order`
   * shows with its lines and their product.
   */
  private relatedTypes(
    nodes: (ts.Node | undefined)[],
    skip: Set<string> = new Set(),
  ): TypeDefinition[] {
    const found = new Map<string, TypeDefinition>()
    const collect = (node: ts.Node, depth: number) => {
      const visit = (child: ts.Node) => {
        if (ts.isTypeReferenceNode(child) || ts.isExpressionWithTypeArguments(child)) {
          const name = ts.isTypeReferenceNode(child) ? child.typeName : child.expression
          const symbol = this.checker.getSymbolAtLocation(name)
          const target = symbol && this.resolve(symbol)
          const declaration = target?.declarations?.find(
            (d) =>
              ts.isInterfaceDeclaration(d) ||
              ts.isTypeAliasDeclaration(d) ||
              ts.isClassDeclaration(d),
          )
          const pkg = declaration && this.packageOf(declaration.getSourceFile().fileName)
          if (
            declaration &&
            pkg &&
            target &&
            !skip.has(target.name) &&
            !(target.name in EXTENSION_INTERFACES)
          ) {
            const key = `${pkg.name}:${target.name}`
            if (!found.has(key)) {
              found.set(key, {
                name: target.name,
                package: pkg.name,
                text: this.textWithDoc(declaration),
              })
              if (depth < 2) collect(declaration, depth + 1)
            }
          }
        }
        ts.forEachChild(child, visit)
      }
      visit(node)
    }
    for (const node of nodes) if (node) collect(node, 1)
    return [...found.values()]
  }

  extensionPoints(): ExtensionPoint[] {
    const points: ExtensionPoint[] = []
    const add = (declaration: ts.InterfaceDeclaration, kind: ExtensionKind) => {
      for (const member of declaration.members) {
        if (
          !ts.isPropertySignature(member) ||
          !(ts.isStringLiteral(member.name) || ts.isIdentifier(member.name))
        )
          continue
        points.push({
          kind,
          name: member.name.text,
          type: member.type ? dedent(member.type.getText()) : 'unknown',
          ...this.doc(member),
          source: this.location(member),
          usages: [],
          types: this.relatedTypes([member.type]),
        })
      }
    }
    for (const pkg of this.packages) {
      for (const file of this.files(pkg)) {
        for (const statement of file.statements) {
          if (ts.isInterfaceDeclaration(statement) && pkg.name === SDK) {
            const kind = EXTENSION_INTERFACES[statement.name.text]
            if (kind) add(statement, kind)
          }
          // declare module '@otw/sdk' { interface Actions { … } }
          if (
            ts.isModuleDeclaration(statement) &&
            ts.isStringLiteral(statement.name) &&
            statement.name.text === SDK &&
            statement.body &&
            ts.isModuleBlock(statement.body)
          ) {
            for (const inner of statement.body.statements) {
              const kind = ts.isInterfaceDeclaration(inner) && EXTENSION_INTERFACES[inner.name.text]
              if (kind && ts.isInterfaceDeclaration(inner)) add(inner, kind)
            }
          }
        }
      }
    }
    const byName = new Map(points.map((point) => [point.name, point]))
    this.attachUsages(byName)
    return points.sort((a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name))
  }

  /** Records each call that names an extension point, and each setting's and capability's definition. */
  private attachUsages(points: Map<string, ExtensionPoint>): void {
    const record = (name: string, call: string, node: ts.Node) => {
      const point = points.get(name)
      if (point) point.usages.push({ ...this.location(node), call })
    }
    for (const pkg of this.packages) {
      for (const file of this.files(pkg)) {
        const visit = (node: ts.Node) => {
          if (ts.isCallExpression(node)) {
            const callee = node.expression
            const method = ts.isPropertyAccessExpression(callee)
              ? callee.name.text
              : ts.isIdentifier(callee)
                ? callee.text
                : ''
            if (USAGE_CALLS.has(method)) {
              for (const argument of node.arguments.slice(0, 2)) {
                const names = ts.isStringLiteral(argument)
                  ? [argument.text]
                  : ts.isArrayLiteralExpression(argument)
                    ? argument.elements.filter(ts.isStringLiteral).map((element) => element.text)
                    : []
                for (const name of names) record(name, method, node)
              }
              const [first, second] = node.arguments
              const point = first && ts.isStringLiteral(first) ? points.get(first.text) : undefined
              if (point && second && (method === 'capability' || method === 'metaCapability')) {
                point.definition ??= dedent(node.getText())
              }
            }
          }
          // <Slot name="header.nav" />
          if (
            (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) &&
            node.tagName.getText() === 'Slot'
          ) {
            for (const attribute of node.attributes.properties) {
              if (
                ts.isJsxAttribute(attribute) &&
                attribute.name.getText() === 'name' &&
                attribute.initializer &&
                ts.isStringLiteral(attribute.initializer)
              ) {
                record(attribute.initializer.text, 'Slot', node)
              }
            }
          }
          if (
            ts.isPropertyAssignment(node) &&
            (ts.isStringLiteral(node.name) || ts.isIdentifier(node.name))
          ) {
            const key = node.name.text
            // A setting's field: 'commerce.currency': { type: 'text', label: … }
            const point = points.get(key)
            if (point?.kind === 'setting' && ts.isObjectLiteralExpression(node.initializer)) {
              const fields = node.initializer.properties.map((p) => p.name?.getText())
              if (fields.includes('type') && fields.includes('label')) {
                point.definition ??= dedent(node.getText())
              }
            }
            // An admin page or action that requires a capability.
            if (key === 'capability' && ts.isStringLiteral(node.initializer)) {
              record(node.initializer.text, 'requires', node)
            }
          }
          ts.forEachChild(node, visit)
        }
        visit(file)
      }
    }
  }

  private symbolKind(name: string, declaration: ts.Declaration): SymbolKind {
    const isComponent = /^[A-Z]/.test(name) && declaration.getSourceFile().fileName.endsWith('.tsx')
    if (ts.isFunctionDeclaration(declaration)) return isComponent ? 'component' : 'function'
    if (ts.isVariableDeclaration(declaration)) {
      // Anything callable, such as a function wrapped in React's cache().
      const callable = this.checker.getTypeAtLocation(declaration).getCallSignatures().length > 0
      if (callable) return isComponent ? 'component' : 'function'
      return 'constant'
    }
    if (ts.isInterfaceDeclaration(declaration)) return 'interface'
    if (ts.isTypeAliasDeclaration(declaration)) return 'type'
    if (ts.isClassDeclaration(declaration)) return 'class'
    return 'constant'
  }

  private signature(name: string, kind: SymbolKind, declarations: ts.Declaration[]): string {
    const [first] = declarations
    if (!first) return name
    if (ts.isFunctionDeclaration(first)) {
      return declarations
        .filter(ts.isFunctionDeclaration)
        .map((d) => {
          const end = d.body ? d.body.getStart() : d.getEnd()
          const text = d.getSourceFile().text.slice(d.getStart(), end).trim().replace(/;$/, '')
          return dedent(text.replace(/^export\s+(default\s+)?(declare\s+)?/, ''))
        })
        .join('\n')
    }
    if (ts.isVariableDeclaration(first)) {
      const type = this.checker.getTypeAtLocation(first)
      const [call] = type.getCallSignatures()
      if (kind !== 'constant' && call) {
        return `function ${name}${this.checker.signatureToString(call, first, ts.TypeFormatFlags.NoTruncation)}`
      }
      return `const ${name}: ${this.checker.typeToString(type, first, ts.TypeFormatFlags.NoTruncation)}`
    }
    return dedent(first.getText().replace(/^export\s+(declare\s+)?/, ''))
  }

  private members(kind: SymbolKind, declaration: ts.Declaration): ApiMember[] {
    if (ts.isInterfaceDeclaration(declaration)) {
      return declaration.members.flatMap((member) => {
        if (!member.name) return []
        const type = ts.isPropertySignature(member)
          ? (member.type?.getText() ?? 'unknown')
          : ts.isMethodSignature(member)
            ? member
                .getText()
                .slice(member.name.getEnd() - member.getStart())
                .trim()
                .replace(/;$/, '')
            : ''
        return [
          {
            name: member.name.getText(),
            type: dedent(type),
            optional: Boolean(member.questionToken),
            description: this.doc(member).description,
          },
        ]
      })
    }
    // A component's props, as the checker resolves them.
    if (kind === 'component') {
      const fn = ts.isVariableDeclaration(declaration) ? declaration.initializer : declaration
      const param = fn && ts.isFunctionLike(fn) ? fn.parameters[0] : undefined
      if (!param) return []
      const props = this.checker.getTypeAtLocation(param)
      return props.getProperties().map((prop) => {
        const propDeclaration = prop.valueDeclaration ?? prop.declarations?.[0]
        return {
          name: prop.name,
          type: this.checker.typeToString(
            this.checker.getTypeOfSymbolAtLocation(prop, param),
            param,
            ts.TypeFormatFlags.NoTruncation,
          ),
          optional: Boolean(prop.flags & ts.SymbolFlags.Optional),
          description: propDeclaration ? this.doc(propDeclaration).description : '',
        }
      })
    }
    return []
  }

  packageApi(pkg: InstalledPackage): PackageApi {
    const symbols: ApiSymbol[] = []
    const seen = new Set<string>()
    if (!INTERNAL.has(pkg.name)) {
      for (const [entry, fileName] of pkg.entries) {
        const file = this.program.getSourceFile(fileName)
        const module = file && this.checker.getSymbolAtLocation(file)
        if (!module) continue
        for (const exported of this.checker.getExportsOfModule(module)) {
          // A plugin package's default export is the plugin itself, documented by its extension points.
          if (exported.name === 'default' || seen.has(exported.name)) continue
          const target = this.resolve(exported)
          const declarations = target.declarations ?? []
          const [declaration] = declarations
          if (!declaration || !this.packageOf(declaration.getSourceFile().fileName)) continue
          seen.add(exported.name)
          const kind = this.symbolKind(exported.name, declaration)
          const isExtension = pkg.name === SDK && exported.name in EXTENSION_INTERFACES
          symbols.push({
            name: exported.name,
            kind,
            entry,
            signature: isExtension
              ? `interface ${exported.name} { … }`
              : this.signature(exported.name, kind, declarations),
            ...this.doc(
              ts.isVariableDeclaration(declaration) ? declaration.parent.parent : declaration,
            ),
            members: isExtension ? [] : this.members(kind, declaration),
            source: this.location(declaration),
            types: isExtension
              ? []
              : this.relatedTypes(
                  ts.isFunctionLike(declaration)
                    ? [...declaration.parameters.map((p) => p.type), declaration.type]
                    : ts.isVariableDeclaration(declaration)
                      ? [declaration.type, declaration.initializer]
                      : [declaration],
                  new Set([exported.name]),
                ),
          })
        }
      }
    }
    return {
      name: pkg.name,
      version: pkg.version,
      description: pkg.description,
      documented: !INTERNAL.has(pkg.name),
      symbols: symbols.sort((a, b) => a.name.localeCompare(b.name)),
    }
  }

  /** Environment variables the packages read, from `env.X`, `env['X']` and settings' `env: 'X'`. */
  envVars(): EnvVar[] {
    const vars = new Map<string, SourceLocation[]>()
    const record = (name: string, node: ts.Node) => {
      if (!UPPER_SNAKE.test(name) || PLATFORM_ENV.has(name)) return
      vars.set(name, [...(vars.get(name) ?? []), this.location(node)])
    }
    const isEnv = (expression: ts.Expression) => /(^|\.)env$/.test(expression.getText())
    for (const pkg of this.packages) {
      for (const file of this.files(pkg)) {
        const visit = (node: ts.Node) => {
          if (ts.isPropertyAccessExpression(node) && isEnv(node.expression))
            record(node.name.text, node)
          if (
            ts.isElementAccessExpression(node) &&
            isEnv(node.expression) &&
            ts.isStringLiteral(node.argumentExpression)
          ) {
            record(node.argumentExpression.text, node)
          }
          if (
            ts.isPropertyAssignment(node) &&
            node.name.getText() === 'env' &&
            ts.isStringLiteral(node.initializer)
          ) {
            record(node.initializer.text, node)
          }
          ts.forEachChild(node, visit)
        }
        visit(file)
      }
    }
    return [...vars]
      .map(([name, readBy]) => ({ name, readBy }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }
}

/** Splits `cms --help` into commands and their flags. */
export function parseCliUsage(usage: string): CliCommand[] {
  const commands: CliCommand[] = []
  const section = usage.split(/^Commands:$/m)[1]?.split(/^\S/m)[0] ?? ''
  let last: { description: string } | undefined
  for (const line of section.split('\n')) {
    const command = /^ {2}([a-z][\w-]*)(?: (\[[^\]]+\]))?(?:\s{2,}(.*))?$/.exec(line)
    const flag = /^\s{4,}(--[\w-]+(?: <[^>]+>)?)\s{2,}(.*)$/.exec(line)
    if (command) {
      const next: CliCommand = {
        name: command[1]!,
        args: command[2] ?? '',
        description: command[3] ?? '',
        flags: [],
      }
      commands.push(next)
      last = next
    } else if (flag && commands.length) {
      const next = { flag: flag[1]!, description: flag[2]! }
      commands.at(-1)!.flags.push(next)
      last = next
    } else if (line.trim() && last) {
      last.description = `${last.description} ${line.trim()}`.trim()
    }
  }
  return commands
}

function cliUsage(packages: InstalledPackage[]): string {
  const cli = packages.find((pkg) => pkg.name === '@otw/cli')
  if (!cli?.bin) return ''
  return execFileSync(process.execPath, [cli.bin, '--help'], { encoding: 'utf8' }).trim()
}

export function extractReference(siteRoot: string): Reference {
  const packages = findPackages(siteRoot)
  const extractor = new Extractor(packages)
  const usage = cliUsage(packages)
  return {
    packages: packages.map((pkg) => extractor.packageApi(pkg)),
    extensions: extractor.extensionPoints(),
    cli: { usage, commands: parseCliUsage(usage) },
    env: extractor.envVars(),
  }
}
