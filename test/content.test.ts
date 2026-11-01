import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { HANDBOOK_IDS, loadHandbooks, parsePage, trail } from '@/docs/content'

const page = (title: string, order?: number) =>
  `---\ntitle: ${title}\ndescription: About ${title}.\n${order === undefined ? '' : `order: ${order}\n`}---\n\n# ${title}\n`

describe('parsePage', () => {
  it('reads the front matter and keeps the rest as Markdown', () => {
    expect(
      parsePage(
        '---\ntitle: Hooks\ndescription: Actions and filters.\norder: 2\n---\n\nBody',
        'a.md',
      ),
    ).toEqual({
      title: 'Hooks',
      description: 'Actions and filters.',
      order: 2,
      body: '\nBody',
    })
  })

  it.each([
    ['No front matter', 'starts without front matter'],
    ['---\ndescription: x\n---\n', 'needs a title'],
    ['---\ntitle: x\n---\n', 'needs a description'],
    ['---\ntitle: x\ndescription: y\norder: first\n---\n', 'order must be a number'],
  ])('refuses %j', (source, message) => {
    expect(() => parsePage(source, 'a.md')).toThrow(`a.md: ${message}`)
  })
})

describe('loadHandbooks', () => {
  let dir: string
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'docs-content-'))
    for (const id of HANDBOOK_IDS) {
      await mkdir(join(dir, id), { recursive: true })
      await writeFile(join(dir, id, 'index.md'), page(`${id} handbook`))
    }
  })
  afterEach(() => rm(dir, { recursive: true, force: true }))

  it('orders chapters and their pages, the front page first', async () => {
    const root = join(dir, 'plugins')
    await mkdir(join(root, 'hooks'))
    await writeFile(join(root, 'hooks', 'index.md'), page('Hooks', 2))
    await writeFile(join(root, 'hooks', 'filters.md'), page('Filters', 2))
    await writeFile(join(root, 'hooks', 'actions.md'), page('Actions', 1))
    await writeFile(join(root, 'testing.md'), page('Testing', 3))
    await writeFile(join(root, 'basics.md'), page('Basics', 1))

    const plugins = (await loadHandbooks(dir)).find((handbook) => handbook.id === 'plugins')!
    expect(plugins.title).toBe('plugins handbook')
    expect(plugins.pages.map((p) => p.url)).toEqual([
      '/plugins',
      '/plugins/basics',
      '/plugins/hooks',
      '/plugins/hooks/actions',
      '/plugins/hooks/filters',
      '/plugins/testing',
    ])
    expect(
      plugins.nav.map((item) => [item.title, item.children.map((child) => child.title)]),
    ).toEqual([
      ['Basics', []],
      ['Hooks', ['Actions', 'Filters']],
      ['Testing', []],
    ])
    const filters = plugins.pages.find((p) => p.title === 'Filters')!
    expect(trail(plugins, filters).map((p) => p.title)).toEqual([
      'plugins handbook',
      'Hooks',
      'Filters',
    ])
  })

  it('needs a front page, and an index.md for every chapter', async () => {
    await mkdir(join(dir, 'themes', 'orphans'))
    await writeFile(join(dir, 'themes', 'orphans', 'lost.md'), page('Lost'))
    await expect(loadHandbooks(dir)).rejects.toThrow(
      'themes/orphans/lost.md: its folder has no index.md',
    )
    await rm(join(dir, 'hosting', 'index.md'))
    await expect(loadHandbooks(dir)).rejects.toThrow('content/hosting: needs an index.md')
  })
})
