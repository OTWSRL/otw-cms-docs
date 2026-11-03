import type { Metadata } from 'next'
import Link from 'next/link'
import { DocsLayout } from '@/docs/handbook-route'
import { reference } from '@/docs/reference'
import { Code, ReferenceNav } from '@/docs/reference-ui'
import { Breadcrumbs } from '@/docs/ui/chrome'

export const metadata: Metadata = {
  title: 'The cms command – Code Reference',
  description: 'The commands and options of the cms command line tool, from its own help.',
}

export default function CliPage() {
  return (
    <DocsLayout sidebar={<ReferenceNav current="/reference/cli" />}>
      <article className="docs-article">
        <Breadcrumbs
          trail={[
            { title: 'Code Reference', url: '/reference' },
            { title: 'Command line', url: '/reference/cli' },
          ]}
        />
        <header className="docs-header">
          <p className="kind-badge">@otwdesign/cli</p>
          <h1>
            The <code>cms</code> command
          </h1>
          <p className="lede">
            Installed with every site as a development dependency. Run it from the site’s directory
            with <code>npx cms</code>, <code>pnpm cms</code> or a package script; the help below is
            its own.
          </p>
        </header>
        {reference.cli.commands.map((command) => (
          <section key={command.name} aria-labelledby={command.name}>
            <h2 id={command.name}>
              <code>
                cms {command.name}
                {command.args && ` ${command.args}`}
              </code>
            </h2>
            <p>{command.description}</p>
            {command.flags.length > 0 && (
              <dl className="members">
                {command.flags.map((flag) => (
                  <div key={flag.flag}>
                    <dt>
                      <code>{flag.flag}</code>
                    </dt>
                    <dd>{flag.description}</dd>
                  </div>
                ))}
              </dl>
            )}
          </section>
        ))}
        <h2 id="help">Full help</h2>
        <Code code={reference.cli.usage} lang="txt" />
        <p>
          How these fit together is in <Link href="/hosting/updates">Updating</Link> and{' '}
          <Link href="/hosting/migrations">Database migrations</Link>.
        </p>
      </article>
    </DocsLayout>
  )
}
