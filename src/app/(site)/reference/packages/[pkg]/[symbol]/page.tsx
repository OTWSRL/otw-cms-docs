import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { DocsLayout } from '@/docs/handbook-route'
import {
  documentedPackages,
  findPackage,
  packageSlug,
  packageUrl,
  symbolUrl,
} from '@/docs/reference'
import {
  Code,
  Description,
  ReferenceNav,
  Source,
  summaryOf,
  TypeDefinitions,
} from '@/docs/reference-ui'
import { Breadcrumbs, Prose } from '@/docs/ui/chrome'
import { renderMarkdown } from '@/docs/markdown'
import { referenceLinker } from '@/docs/reference'

export const dynamicParams = false

export function generateStaticParams() {
  return documentedPackages().flatMap((pkg) =>
    pkg.symbols.map((symbol) => ({ pkg: packageSlug(pkg.name), symbol: symbol.name })),
  )
}

async function find(params: PageProps<'/reference/packages/[pkg]/[symbol]'>['params']) {
  const { pkg: slug, symbol: name } = await params
  const pkg = findPackage(slug)
  const symbol = pkg?.symbols.find((candidate) => candidate.name === name)
  return pkg && symbol ? { pkg, symbol } : null
}

export async function generateMetadata({
  params,
}: PageProps<'/reference/packages/[pkg]/[symbol]'>): Promise<Metadata> {
  const found = await find(params)
  if (!found) return {}
  return {
    title: `${found.symbol.name} – ${found.pkg.name}`,
    description:
      summaryOf(found.symbol.description) || `${found.symbol.kind} from ${found.symbol.entry}`,
  }
}

const KIND_LABELS = {
  function: 'Function',
  component: 'Component',
  interface: 'Interface',
  type: 'Type',
  class: 'Class',
  constant: 'Constant',
}

export default async function SymbolPage({
  params,
}: PageProps<'/reference/packages/[pkg]/[symbol]'>) {
  const found = await find(params)
  if (!found) notFound()
  const { pkg, symbol } = found
  const link = referenceLinker()
  const members = await Promise.all(
    symbol.members.map(async (member) => ({
      ...member,
      html: member.description ? (await renderMarkdown(member.description, { link })).html : '',
    })),
  )
  return (
    <DocsLayout sidebar={<ReferenceNav current={packageUrl(pkg)} />}>
      <article className="docs-article">
        <Breadcrumbs
          trail={[
            { title: 'Code Reference', url: '/reference' },
            { title: pkg.name, url: packageUrl(pkg) },
            { title: symbol.name, url: symbolUrl(pkg, symbol) },
          ]}
        />
        <header className="docs-header">
          <p className="kind-badge">{KIND_LABELS[symbol.kind]}</p>
          <h1>
            <code>{symbol.name}</code>
          </h1>
        </header>
        {symbol.deprecated && (
          <aside className="callout callout-warning">
            <p className="callout-title">Deprecated</p>
            <p>{symbol.deprecated}</p>
          </aside>
        )}
        <Description text={symbol.description} fallback="No description yet." />
        <Code code={`import { ${symbol.name} } from '${symbol.entry}'`} />
        <Source source={symbol.source} version={pkg.version} />

        <h2>Signature</h2>
        <Code code={symbol.signature} lang={symbol.kind === 'component' ? 'tsx' : 'ts'} />

        {members.length > 0 && (
          <section aria-labelledby="members">
            <h2 id="members">{symbol.kind === 'component' ? 'Props' : 'Members'}</h2>
            <dl className="members">
              {members.map((member) => (
                <div key={member.name}>
                  <dt>
                    <code>{member.name}</code>
                    {member.optional && <span className="optional">optional</span>}
                  </dt>
                  <dd>
                    <code className="member-type">{member.type}</code>
                    {member.html && <Prose html={member.html} />}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <TypeDefinitions types={symbol.types} />
      </article>
    </DocsLayout>
  )
}
