import { describe, expect, it } from 'vitest'
import { plainText, search, searchDocs, terms, type SearchDoc } from '@/docs/search'

const doc = (title: string, text: string, extra: Partial<SearchDoc> = {}): SearchDoc => ({
  title,
  url: `/${title.toLowerCase().replace(/\W+/g, '-')}`,
  section: 'Plugin Handbook',
  description: '',
  headings: [],
  text,
  ...extra,
})

describe('search', () => {
  const docs = [
    doc('Filters', 'A filter changes a value. Filters run in priority order.'),
    doc('Actions', 'An action runs code when something happens, such as an order being paid.'),
    doc('Settings', 'Settings can be changed with filters too.', { headings: ['Environment'] }),
    doc('commerce.order.paid', 'Fired when an order is paid.', {
      section: 'Code Reference · Action',
    }),
  ]

  it('ranks a title match above a mention in the text', () => {
    expect(search('filters', docs).map((r) => r.title)).toEqual(['Filters', 'Settings'])
  })

  it('needs every word to appear', () => {
    expect(search('order paid', docs).map((r) => r.title)).toEqual([
      'commerce.order.paid',
      'Actions',
    ])
    expect(search('order banana', docs)).toEqual([])
  })

  it('puts an entry named exactly what was typed first', () => {
    expect(search('commerce.order.paid', docs)[0]!.title).toBe('commerce.order.paid')
  })

  it('matches headings, and ignores words too short to mean anything', () => {
    expect(search('environment', docs).map((r) => r.title)).toEqual(['Settings'])
    expect(terms('a I hooks  hooks')).toEqual(['hooks'])
    expect(search('a', docs)).toEqual([])
  })

  it('shows the text around the match', () => {
    const long = doc(
      'Long',
      `${'Lorem ipsum dolor sit amet. '.repeat(20)}The needle is here. ${'More text. '.repeat(20)}`,
    )
    const [result] = search('needle', [long])
    expect(result!.snippet).toMatch(/^….*The needle is here.*…$/)
  })
})

describe('plainText', () => {
  it('strips Markdown syntax but keeps the words and code', () => {
    expect(
      plainText('## Hooks\n\n> [!NOTE]\n> Use `addAction` [here](/x).\n\n```ts\ncms.hooks\n```'),
    ).toBe('Hooks Use addAction here. cms.hooks')
  })
})

describe('searchDocs', () => {
  it('covers the handbooks and the Code Reference', async () => {
    const docs = await searchDocs()
    const sections = new Set(docs.map((d) => d.section))
    expect(sections).toContain('Plugin Handbook')
    expect(sections).toContain('Code Reference · Action')
    expect(docs.find((d) => d.title === 'definePlugin')?.url).toBe(
      '/reference/packages/sdk/definePlugin',
    )
    expect(docs.find((d) => d.title === 'cms update')?.url).toBe('/reference/cli#update')
  })
})
