import Link from 'next/link'
import { HeaderNav } from './header-nav'
import { SECTIONS } from './sections'
import { Mark } from './logo'

export function SearchForm({ query = '', id = 'site-search' }: { query?: string; id?: string }) {
  return (
    <form className="search-form" action="/search" role="search">
      <label htmlFor={id} className="screen-reader-text">
        Search the documentation
      </label>
      <input id={id} type="search" name="q" defaultValue={query} placeholder="Search docs" />
      <button type="submit">Search</button>
    </form>
  )
}

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="site-brand">
          <Mark />
          <span>
            OTW CMS <span className="site-brand-sub">Documentation</span>
          </span>
        </Link>
        <HeaderNav />
        <SearchForm id="header-search" />
      </div>
    </header>
  )
}

export function SiteFooter({ version }: { version: string }) {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <nav aria-label="Footer">
          <ul>
            {SECTIONS.map((section) => (
              <li key={section.url}>
                <Link href={section.url}>{section.label}</Link>
              </li>
            ))}
            <li>
              <Link href="/search">Search</Link>
            </li>
          </ul>
        </nav>
        <p>
          Documents OTW CMS {version}. This site runs on OTW CMS; its Code Reference is read from
          the source of the packages it runs.
        </p>
      </div>
    </footer>
  )
}

/** HTML from the Markdown renderer, which escapes text and drops raw HTML from the source. */
export function Prose({ html, className = 'prose' }: { html: string; className?: string }) {
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />
}

export interface Crumb {
  title: string
  url: string
}

export function Breadcrumbs({ trail }: { trail: readonly Crumb[] }) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumbs">
      <ol>
        <li>
          <Link href="/">Home</Link>
        </li>
        {trail.map((crumb, index) => (
          <li key={crumb.url}>
            {index === trail.length - 1 ? (
              <span aria-current="page">{crumb.title}</span>
            ) : (
              <Link href={crumb.url}>{crumb.title}</Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
