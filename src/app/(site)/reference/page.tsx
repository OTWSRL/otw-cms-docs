import type { Metadata } from 'next'
import Link from 'next/link'
import { DocsLayout } from '@/docs/handbook-route'
import { documentedPackages, extensionsOf, KINDS, packageUrl, reference } from '@/docs/reference'
import { ReferenceNav } from '@/docs/reference-ui'
import { Breadcrumbs } from '@/docs/ui/chrome'

export const metadata: Metadata = {
  title: 'Code Reference',
  description:
    'Every extension point, exported function, component and type, and CLI command in OTW CMS, read from its source.',
}

export default function ReferenceIndex() {
  return (
    <DocsLayout sidebar={<ReferenceNav current="/reference" />}>
      <article className="docs-article">
        <Breadcrumbs trail={[{ title: 'Code Reference', url: '/reference' }]} />
        <header className="docs-header">
          <h1>Code Reference</h1>
          <p className="lede">
            Read from the source of the installed packages each time this site is built, so it
            describes exactly the versions below. The handbooks explain how the pieces fit.
          </p>
        </header>

        <h2>Extension points</h2>
        <p>
          Plugins declare these on <code>@otwdesign/sdk</code> with TypeScript declaration merging,
          so every name and payload is typed. See <Link href="/plugins/hooks">Hooks</Link> in the
          Plugin Handbook.
        </p>
        <table className="reference-table">
          <thead>
            <tr>
              <th scope="col">Kind</th>
              <th scope="col">What it is</th>
              <th scope="col">Count</th>
            </tr>
          </thead>
          <tbody>
            {KINDS.map((info) => (
              <tr key={info.kind}>
                <td>
                  <Link href={`/reference/${info.path}`}>{info.title}</Link>
                </td>
                <td>{info.summary}</td>
                <td>{extensionsOf(info.kind).length}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2>Packages</h2>
        <table className="reference-table">
          <thead>
            <tr>
              <th scope="col">Package</th>
              <th scope="col">Version</th>
              <th scope="col">Exports</th>
            </tr>
          </thead>
          <tbody>
            {documentedPackages().map((pkg) => (
              <tr key={pkg.name}>
                <td>
                  <Link href={packageUrl(pkg)}>{pkg.name}</Link>
                  {pkg.description && <span className="cell-note">{pkg.description}</span>}
                </td>
                <td>{pkg.version}</td>
                <td>{pkg.symbols.length}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2>Tools</h2>
        <ul>
          <li>
            <Link href="/reference/cli">The cms command</Link>:{' '}
            {reference.cli.commands.map((command) => command.name).join(', ')}
          </li>
          <li>
            <Link href="/hosting/environment-variables">Environment variables</Link>:{' '}
            {reference.env.length} read by the CMS and its plugins
          </li>
        </ul>
      </article>
    </DocsLayout>
  )
}
