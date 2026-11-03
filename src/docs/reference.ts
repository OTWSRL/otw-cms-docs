import type { ReferenceLinker } from './markdown'
import generated from './reference.generated.json'
import type {
  ApiSymbol,
  ExtensionKind,
  ExtensionPoint,
  PackageApi,
  Reference,
  Usage,
} from './reference-types'

export const reference = generated as unknown as Reference

export interface KindInfo {
  kind: ExtensionKind
  /** The URL segment, such as `actions`. */
  path: string
  title: string
  singular: string
  /** What one is, for the index pages. */
  summary: string
}

export const KINDS: readonly KindInfo[] = [
  {
    kind: 'action',
    path: 'actions',
    title: 'Actions',
    singular: 'Action',
    summary: 'Events a plugin announces; others run code when they happen.',
  },
  {
    kind: 'filter',
    path: 'filters',
    title: 'Filters',
    singular: 'Filter',
    summary: 'Values a plugin lets others change before it uses them.',
  },
  {
    kind: 'slot',
    path: 'slots',
    title: 'Slots',
    singular: 'Slot',
    summary: 'Places on a page or admin screen where other plugins render components.',
  },
  {
    kind: 'registry',
    path: 'registries',
    title: 'Registries',
    singular: 'Registry',
    summary: 'Lists a plugin owns that others add items to, such as payment gateways.',
  },
  {
    kind: 'service',
    path: 'services',
    title: 'Services',
    singular: 'Service',
    summary: 'APIs a plugin offers to the plugins that depend on it.',
  },
  {
    kind: 'setting',
    path: 'settings',
    title: 'Settings',
    singular: 'Setting',
    summary: 'Typed options, stored in the database or set by environment variables.',
  },
  {
    kind: 'capability',
    path: 'capabilities',
    title: 'Capabilities',
    singular: 'Capability',
    summary: 'Permissions roles grant, which admin pages and actions require.',
  },
  {
    kind: 'meta-capability',
    path: 'meta-capabilities',
    title: 'Meta capabilities',
    singular: 'Meta capability',
    summary: 'Permissions checked against an object, mapped to the capabilities they need.',
  },
]

export function kindInfo(kind: ExtensionKind): KindInfo {
  return KINDS.find((info) => info.kind === kind)!
}

export function kindByPath(path: string): KindInfo | undefined {
  return KINDS.find((info) => info.path === path)
}

export function extensionUrl(point: Pick<ExtensionPoint, 'kind' | 'name'>): string {
  return `/reference/${kindInfo(point.kind).path}/${point.name}`
}

export function extensionsOf(kind: ExtensionKind): ExtensionPoint[] {
  return reference.extensions.filter((point) => point.kind === kind)
}

export function findExtension(kind: ExtensionKind, name: string): ExtensionPoint | undefined {
  return reference.extensions.find((point) => point.kind === kind && point.name === name)
}

/** `@otwdesign/next` → `next`, for URLs. */
export function packageSlug(name: string): string {
  return name.replace(/^@otwdesign\//, '')
}

export function documentedPackages(): PackageApi[] {
  return reference.packages.filter((pkg) => pkg.documented)
}

export function findPackage(slug: string): PackageApi | undefined {
  return documentedPackages().find((pkg) => packageSlug(pkg.name) === slug)
}

export function packageUrl(pkg: Pick<PackageApi, 'name'>): string {
  return `/reference/packages/${packageSlug(pkg.name)}`
}

export function symbolUrl(pkg: Pick<PackageApi, 'name'>, symbol: Pick<ApiSymbol, 'name'>): string {
  return `${packageUrl(pkg)}/${symbol.name}`
}

/** The version every page cites: the CMS's own, from the SDK. */
export function cmsVersion(): string {
  return reference.packages.find((pkg) => pkg.name === '@otwdesign/sdk')?.version ?? ''
}

/** How a call reads on a reference page: "Fired in", "Hooked in" and so on. */
export function usageLabel(kind: ExtensionKind, usage: Usage): string {
  switch (usage.call) {
    case 'doAction':
      return 'Fired in'
    case 'applyFilters':
      return 'Applied in'
    case 'addAction':
    case 'addFilter':
      return 'Hooked in'
    case 'fill':
      return 'Filled in'
    case 'Slot':
    case 'slot':
      return 'Rendered in'
    case 'define':
      return 'Defined in'
    case 'provide':
      return 'Provided in'
    case 'capability':
    case 'metaCapability':
      return 'Declared in'
    case 'extendCapability':
      return 'Extended in'
    case 'grant':
      return 'Granted in'
    case 'revoke':
      return 'Revoked in'
    case 'can':
      return 'Checked in'
    case 'requires':
      return 'Required by'
    case 'setting':
      return 'Read in'
    case 'get':
      return kind === 'slot' ? 'Rendered in' : kind === 'setting' ? 'Read in' : 'Used in'
    default:
      return 'Used in'
  }
}

/** A short example of using an extension point, for the top of its page. */
export function exampleFor(point: ExtensionPoint): string {
  const name = `'${point.name}'`
  switch (point.kind) {
    case 'action':
      return `cms.hooks.addAction(${name}, async (payload) => {\n  // payload: ${point.type}\n})`
    case 'filter':
      return `cms.hooks.addFilter(${name}, async (value, context) => {\n  // [value, context]: ${point.type}\n  return value\n})`
    case 'slot':
      return `cms.slots.fill(${name}, {\n  // props: ${point.type}\n  component: (props) => <p>…</p>,\n})`
    case 'registry':
      return `cms.registries.get(${name}).add({\n  id: 'my-plugin',\n  // …the rest of ${point.type}\n})`
    case 'service':
      return `const ${point.name.replace(/\W(\w)/g, (_, c: string) => c.toUpperCase())} = cms.services.get(${name})`
    case 'setting':
      return `const value = cms.settings.get(${name}) // ${point.type} | undefined`
    case 'capability':
      return `if (cms.auth.can(user, ${name})) {\n  // …\n}`
    case 'meta-capability':
      return `if (cms.auth.can(user, ${name}, ${point.type.replace(/^\[|\]$/g, '').replace(/(\w+): \w+/g, '$1')})) {\n  // …\n}`
  }
}

/**
 * Inline code that names an extension point (`commerce.order.paid`), an exported symbol
 * (`definePlugin`) or a CLI command (`cms update`) links to its page.
 */
export function referenceLinker(): ReferenceLinker {
  const links = new Map<string, string>()
  for (const pkg of documentedPackages()) {
    for (const symbol of pkg.symbols) {
      // The SDK's names win where two packages export the same one.
      if (!links.has(symbol.name) || pkg.name === '@otwdesign/sdk')
        links.set(symbol.name, symbolUrl(pkg, symbol))
    }
  }
  // Dotted names only: a bare one such as the `commerce` service reads as the plugin's id.
  for (const point of reference.extensions) {
    if (point.name.includes('.')) links.set(point.name, extensionUrl(point))
  }
  for (const command of reference.cli.commands) {
    links.set(`cms ${command.name}`, `/reference/cli#${command.name}`)
  }
  return (name) => links.get(name)
}
