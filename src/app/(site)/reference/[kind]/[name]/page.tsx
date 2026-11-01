import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DocsLayout } from '@/docs/handbook-route'
import {
  exampleFor,
  findExtension,
  kindByPath,
  KINDS,
  extensionsOf,
  reference,
  usageLabel,
} from '@/docs/reference'
import {
  Code,
  Description,
  ReferenceNav,
  Source,
  summaryOf,
  TypeDefinitions,
} from '@/docs/reference-ui'
import { Breadcrumbs } from '@/docs/ui/chrome'

export const dynamicParams = false

export function generateStaticParams() {
  return KINDS.flatMap((info) =>
    extensionsOf(info.kind).map((point) => ({ kind: info.path, name: point.name })),
  )
}

async function find(params: PageProps<'/reference/[kind]/[name]'>['params']) {
  const { kind, name } = await params
  const info = kindByPath(kind)
  const point = info && findExtension(info.kind, decodeURIComponent(name))
  return info && point ? { info, point } : null
}

export async function generateMetadata({
  params,
}: PageProps<'/reference/[kind]/[name]'>): Promise<Metadata> {
  const found = await find(params)
  if (!found) return {}
  return {
    title: `${found.point.name} – ${found.info.singular}`,
    description: summaryOf(found.point.description) || found.info.summary,
  }
}

const TYPE_LABELS: Record<string, string> = {
  action: 'Payload',
  filter: '[value, context]',
  slot: 'Props',
  registry: 'Item',
  service: 'Service',
  setting: 'Value',
  capability: 'Declared as',
  'meta-capability': 'Checked against',
}

export default async function ExtensionPage({ params }: PageProps<'/reference/[kind]/[name]'>) {
  const found = await find(params)
  if (!found) notFound()
  const { info, point } = found
  const version = reference.packages.find((pkg) => pkg.name === point.source.package)?.version
  const groups = new Map<string, typeof point.usages>()
  for (const usage of point.usages) {
    const label = usageLabel(point.kind, usage)
    groups.set(label, [...(groups.get(label) ?? []), usage])
  }
  return (
    <DocsLayout sidebar={<ReferenceNav current={`/reference/${info.path}`} />}>
      <article className="docs-article">
        <Breadcrumbs
          trail={[
            { title: 'Code Reference', url: '/reference' },
            { title: info.title, url: `/reference/${info.path}` },
            { title: point.name, url: `/reference/${info.path}/${point.name}` },
          ]}
        />
        <header className="docs-header">
          <p className="kind-badge">{info.singular}</p>
          <h1>
            <code>{point.name}</code>
          </h1>
        </header>
        {point.deprecated && (
          <aside className="callout callout-warning">
            <p className="callout-title">Deprecated</p>
            <p>{point.deprecated}</p>
          </aside>
        )}
        <Description text={point.description} fallback="No description yet." />
        <Source source={point.source} version={version} />

        <h2>{TYPE_LABELS[point.kind]}</h2>
        <Code code={point.type} />

        <h2>Usage</h2>
        <Code code={exampleFor(point)} lang="tsx" />
        {point.source.package !== '@otw/sdk' && (
          <p>
            Declared by <code>{point.source.package}</code>: import its types with{' '}
            <code>{`import type {} from '${point.source.package}'`}</code>, and list the plugin in{' '}
            <Link href="/plugins/getting-started/dependencies">
              <code>requires</code> or <code>optional</code>
            </Link>
            .
          </p>
        )}

        {point.definition && (
          <>
            <h2>Definition</h2>
            <Code code={point.definition} />
          </>
        )}

        <TypeDefinitions types={point.types} />

        {groups.size > 0 && (
          <section aria-labelledby="used-by">
            <h2 id="used-by">Where it’s used</h2>
            <dl className="usages">
              {[...groups].map(([label, usages]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  {usages.map((usage) => (
                    <dd key={`${usage.package}:${usage.file}:${usage.line}`}>
                      {usage.package} · <code>{`${usage.file}:${usage.line}`}</code>
                    </dd>
                  ))}
                </div>
              ))}
            </dl>
          </section>
        )}
      </article>
    </DocsLayout>
  )
}
