import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import {
  findPage,
  getHandbook,
  trail,
  type Handbook,
  type HandbookId,
  type NavItem,
} from './content'
import { renderMarkdown, type Heading } from './markdown'
import { referenceLinker } from './reference'
import { Breadcrumbs, Prose } from './ui/chrome'

interface HandbookRouteProps {
  params: Promise<{ slug?: string[] }>
}

function NavList({ items, current }: { items: readonly NavItem[]; current: string }) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item.url}>
          <Link href={item.url} aria-current={item.url === current ? 'page' : undefined}>
            {item.title}
          </Link>
          {item.children.length > 0 && <NavList items={item.children} current={current} />}
        </li>
      ))}
    </ul>
  )
}

/** The handbook's chapters, as on developer.wordpress.org's handbook pages. */
export function HandbookNav({ handbook, current }: { handbook: Handbook; current: string }) {
  return (
    <div className="handbook-nav">
      <p className="handbook-nav-title">
        <Link href={handbook.url} aria-current={handbook.url === current ? 'page' : undefined}>
          {handbook.title}
        </Link>
      </p>
      <NavList items={handbook.nav} current={current} />
    </div>
  )
}

export function TableOfContents({ headings }: { headings: readonly Heading[] }) {
  if (headings.length < 2) return null
  return (
    <nav className="toc" aria-label="On this page">
      <p className="toc-title">On this page</p>
      <ul>
        {headings.map((heading) => (
          <li key={heading.id} className={`toc-depth-${heading.depth}`}>
            <a href={`#${heading.id}`}>{heading.text}</a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/** A page with the handbook's chapters on the left and its own contents on the right. */
export function DocsLayout({
  sidebar,
  toc,
  children,
}: {
  sidebar: ReactNode
  toc?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="docs-layout">
      <aside className="docs-sidebar">{sidebar}</aside>
      <main className="docs-main" id="main">
        <details className="docs-sidebar-toggle">
          <summary>Browse this section</summary>
          {sidebar}
        </details>
        {children}
      </main>
      {toc && <div className="docs-toc">{toc}</div>}
    </div>
  )
}

/**
 * The route module for one handbook: every page prerendered at build, anything else a 404.
 * Each handbook's `[[...slug]]/page.tsx` re-exports these.
 */
export function handbookRoute(id: HandbookId) {
  async function generateStaticParams(): Promise<{ slug: string[] }[]> {
    const handbook = await getHandbook(id)
    return handbook.pages.map((page) => ({ slug: page.slug }))
  }

  async function generateMetadata({ params }: HandbookRouteProps): Promise<Metadata> {
    const found = await findPage(id, (await params).slug)
    if (!found) return {}
    const { handbook, page } = found
    return {
      title: page.slug.length > 0 ? `${page.title} – ${handbook.title}` : page.title,
      description: page.description,
    }
  }

  async function HandbookPage({ params }: HandbookRouteProps) {
    const found = await findPage(id, (await params).slug)
    if (!found) notFound()
    const { handbook, page, previous, next } = found
    const rendered = await renderMarkdown(page.body, { link: referenceLinker() })
    return (
      <DocsLayout
        sidebar={<HandbookNav handbook={handbook} current={page.url} />}
        toc={<TableOfContents headings={rendered.headings} />}
      >
        <article className="docs-article">
          <Breadcrumbs trail={trail(handbook, page)} />
          <header className="docs-header">
            <h1>{page.title}</h1>
            <p className="lede">{page.description}</p>
          </header>
          <Prose html={rendered.html} />
          <nav className="pager" aria-label="Previous and next">
            {previous && (
              <Link className="pager-previous" href={previous.url} rel="prev">
                <span>Previous</span>
                {previous.title}
              </Link>
            )}
            {next && (
              <Link className="pager-next" href={next.url} rel="next">
                <span>Next</span>
                {next.title}
              </Link>
            )}
          </nav>
        </article>
      </DocsLayout>
    )
  }

  return { HandbookPage, generateMetadata, generateStaticParams }
}
