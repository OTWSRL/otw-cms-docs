import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DocsLayout } from '@/docs/handbook-route'
import { extensionsOf, extensionUrl, KINDS, kindByPath } from '@/docs/reference'
import { ReferenceNav, summaryOf } from '@/docs/reference-ui'
import { Breadcrumbs } from '@/docs/ui/chrome'

export const dynamicParams = false

export function generateStaticParams() {
  return KINDS.map((info) => ({ kind: info.path }))
}

export async function generateMetadata({
  params,
}: PageProps<'/reference/[kind]'>): Promise<Metadata> {
  const info = kindByPath((await params).kind)
  return info ? { title: `${info.title} – Code Reference`, description: info.summary } : {}
}

export default async function KindIndex({ params }: PageProps<'/reference/[kind]'>) {
  const info = kindByPath((await params).kind)
  if (!info) notFound()
  const points = extensionsOf(info.kind)
  return (
    <DocsLayout sidebar={<ReferenceNav current={`/reference/${info.path}`} />}>
      <article className="docs-article">
        <Breadcrumbs
          trail={[
            { title: 'Code Reference', url: '/reference' },
            { title: info.title, url: `/reference/${info.path}` },
          ]}
        />
        <header className="docs-header">
          <h1>{info.title}</h1>
          <p className="lede">{info.summary}</p>
        </header>
        <table className="reference-table">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Declared by</th>
              <th scope="col">Description</th>
            </tr>
          </thead>
          <tbody>
            {points.map((point) => (
              <tr key={point.name}>
                <td>
                  <Link href={extensionUrl(point)}>
                    <code>{point.name}</code>
                  </Link>
                </td>
                <td>{point.source.package}</td>
                <td>{summaryOf(point.description)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </DocsLayout>
  )
}
