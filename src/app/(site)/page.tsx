import Link from 'next/link'
import { loadHandbooks } from '@/docs/content'
import { highlight } from '@/docs/markdown'
import { cmsVersion, documentedPackages, extensionsOf, KINDS, reference } from '@/docs/reference'
import { Prose, SearchForm } from '@/docs/ui/chrome'

// The site's own home page, so `cms generate` leaves it alone.

const QUICK_START = `npm create otw-cms@latest my-site
cd my-site
npm run dev     # http://localhost:3000, the admin at /admin`

export default async function Home() {
  const handbooks = await loadHandbooks()
  const quickStart = await highlight(QUICK_START, 'bash')
  const symbols = documentedPackages().reduce((sum, pkg) => sum + pkg.symbols.length, 0)
  const hooks = extensionsOf('action').length + extensionsOf('filter').length
  return (
    <main id="main">
      <section className="hero">
        <div className="hero-inner">
          <p className="hero-kicker">OTW CMS {cmsVersion()}</p>
          <h1>Documentation</h1>
          <p className="hero-lede">
            OTW CMS is a WordPress-style CMS on Next.js: plugins that extend each other, roles and
            capabilities, settings, and an admin you already know. Learn to run a site, build
            plugins and themes, and host it.
          </p>
          <SearchForm id="hero-search" />
        </div>
      </section>

      <section className="home-section" aria-labelledby="handbooks">
        <h2 id="handbooks">Handbooks</h2>
        <ul className="cards">
          {handbooks.map((handbook) => (
            <li key={handbook.id}>
              <Link href={handbook.url} className="card">
                <h3>{handbook.title}</h3>
                <p>{handbook.description}</p>
                <span className="card-meta">
                  {handbook.pages.length} {handbook.pages.length === 1 ? 'page' : 'pages'}
                </span>
              </Link>
            </li>
          ))}
          <li>
            <Link href="/reference" className="card">
              <h3>Code Reference</h3>
              <p>
                Every hook, slot, registry, service, setting and capability, every exported function
                and type, and the command line, read from the source.
              </p>
              <span className="card-meta">
                {hooks} hooks · {reference.extensions.length} extension points · {symbols} symbols
              </span>
            </Link>
          </li>
        </ul>
      </section>

      <section className="home-section home-split" aria-labelledby="quick-start">
        <div>
          <h2 id="quick-start">Start a site</h2>
          <p>
            A site is a small Next.js app that depends on the CMS’s packages. The first visit to{' '}
            <code>/admin</code> creates the administrator account.
          </p>
          <Prose html={quickStart} className="code-block" />
          <p>
            <Link href="/documentation/getting-started/installing">Installing OTW CMS</Link> covers
            the options, and <Link href="/plugins/getting-started">your first plugin</Link> takes
            ten minutes.
          </p>
        </div>
        <div>
          <h2>Extension points</h2>
          <ul className="kind-list">
            {KINDS.map((info) => (
              <li key={info.kind}>
                <Link href={`/reference/${info.path}`}>{info.title}</Link>
                <span>{info.summary}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  )
}
