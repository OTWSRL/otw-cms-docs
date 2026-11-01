/**
 * The Code Reference: what scripts/build-reference.ts reads from the installed `@otw/*` packages'
 * source, the way developer.wordpress.org's reference is parsed from WordPress's.
 */
export interface Reference {
  /** The packages it was read from, with the versions installed when it was built. */
  packages: PackageApi[]
  extensions: ExtensionPoint[]
  cli: { usage: string; commands: CliCommand[] }
  env: EnvVar[]
}

/** The typed extension points plugins declare on `@otw/sdk`, one kind per interface. */
export type ExtensionKind =
  | 'action'
  | 'filter'
  | 'slot'
  | 'registry'
  | 'service'
  | 'setting'
  | 'capability'
  | 'meta-capability'

export interface SourceLocation {
  package: string
  /** Relative to the package's directory. */
  file: string
  line: number
}

/** A call that names an extension point, such as `cms.hooks.doAction('commerce.order.paid', …)`. */
export interface Usage extends SourceLocation {
  call: string
}

/** A type an entry refers to, declared in one of the packages, shown with its source. */
export interface TypeDefinition {
  name: string
  package: string
  text: string
}

export interface ExtensionPoint {
  kind: ExtensionKind
  name: string
  /** The payload, `[value, context]`, props, item, service, value or arguments, as declared. */
  type: string
  description: string
  deprecated?: string
  source: SourceLocation
  /** For settings, the field the plugin declares; for capabilities, how it's defined. */
  definition?: string
  usages: Usage[]
  types: TypeDefinition[]
}

export type SymbolKind = 'function' | 'component' | 'interface' | 'type' | 'class' | 'constant'

export interface ApiMember {
  name: string
  type: string
  optional: boolean
  description: string
}

export interface ApiSymbol {
  name: string
  kind: SymbolKind
  /** The import path it's exported from, such as `@otw/next/site`. */
  entry: string
  signature: string
  description: string
  deprecated?: string
  /** An interface's members, or a component's props. */
  members: ApiMember[]
  source: SourceLocation
  types: TypeDefinition[]
}

export interface PackageApi {
  name: string
  version: string
  description: string
  /** False for packages that are only read for their types and extension points (core, the CLI). */
  documented: boolean
  symbols: ApiSymbol[]
}

export interface CliFlag {
  flag: string
  description: string
}

export interface CliCommand {
  name: string
  args: string
  description: string
  flags: CliFlag[]
}

export interface EnvVar {
  name: string
  readBy: SourceLocation[]
}
