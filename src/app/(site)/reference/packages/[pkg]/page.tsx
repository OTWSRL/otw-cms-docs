import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DocsLayout } from '@/docs/handbook-route'
import {
  documentedPackages,
  findPackage,
  packageSlug,
  packageUrl,
  symbolUrl,
} from '@/docs/reference'
import type { SymbolKind } from '@/docs/reference-types'
import { ReferenceNav, summaryOf } from '@/docs/reference-ui'
import { Breadcrumbs } from '@/docs/ui/chrome'

export const dynamicParams = false

export function generateStaticParams() {
  return documentedPackages().map((pkg) => ({ pkg: packageSlug(pkg.name) }))
}

export async function generateMetadata({
  params,
}: PageProps<'/reference/packages/[pkg]'>): Promise<Metadata> {
  const pkg = findPackage((await params).pkg)
  return pkg ? { title: `${pkg.name} – Code Reference`, description: pkg.description } : {}
}

const GROUPS: { kind: SymbolKind; title: string }[] = [
  { kind: 'function', title: 'Functions' },
  { kind: 'component', title: 'Components' },
  { kind: 'class', title: 'Classes' },
  { kind: 'constant', title: 'Constants' },
  { kind: 'interface', title: 'Interfaces' },
  { kind: 'type', title: 'Types' },
]

export default async function PackagePage({ params }: PageProps<'/reference/packages/[pkg]'>) {
  const pkg = findPackage((await params).pkg)
  if (!pkg) notFound()
  const entries = [...new Set(pkg.symbols.map((symbol) => symbol.entry))]
  return (
    <DocsLayout sidebar={<ReferenceNav current={packageUrl(pkg)} />}>
      <article className="docs-article">
        <Breadcrumbs
          trail={[
            { title: 'Code Reference', url: '/reference' },
            { title: pkg.name, url: packageUrl(pkg) },
          ]}
        />
        <header className="docs-header">
          <p className="kind-badge">Package {pkg.version}</p>
          <h1>
            <code>{pkg.name}</code>
          </h1>
          {pkg.description && <p className="lede">{pkg.description}</p>}
        </header>
        {entries.length > 1 && (
          <p>
            Imported from{' '}
            {entries.map((entry, index) => (
              <span key={entry}>
                {index > 0 && ', '}
                <code>{entry}</code>
              </span>
            ))}
            .
          </p>
        )}
        {GROUPS.map(({ kind, title }) => {
          const symbols = pkg.symbols.filter((symbol) => symbol.kind === kind)
          if (symbols.length === 0) return null
          return (
            <section key={kind} aria-labelledby={kind}>
              <h2 id={kind}>{title}</h2>
              <table className="reference-table">
                <tbody>
                  {symbols.map((symbol) => (
                    <tr key={symbol.name}>
                      <td>
                        <Link href={symbolUrl(pkg, symbol)}>
                          <code>{symbol.name}</code>
                        </Link>
                        {entries.length > 1 && <span className="cell-note">{symbol.entry}</span>}
                      </td>
                      <td>{summaryOf(symbol.description)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )
        })}
      </article>
    </DocsLayout>
  )
}
