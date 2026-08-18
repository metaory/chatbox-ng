import { describe, expect, it } from 'vitest'
import { COPILOT_CATALOG, listCopilotTags, listCopilotsByCursor } from './catalog'

describe('copilot catalog', () => {
  it('ships a unified catalog', () => {
    expect(COPILOT_CATALOG.length).toBeGreaterThanOrEqual(40)
  })

  it('lists unique sorted tags', () => {
    const tags = listCopilotTags()
    expect(tags).toContain('Professional Skills')
    expect(tags).not.toContain('专业技能')
    expect([...tags].sort()).toEqual(tags)
  })

  it('paginates with cursor', () => {
    const first = listCopilotsByCursor({ limit: 3 })
    expect(first.data).toHaveLength(3)
    expect(first.next_cursor).toBe('3')

    const second = listCopilotsByCursor({ limit: 3, cursor: first.next_cursor! })
    expect(second.data).toHaveLength(3)
    expect(second.next_cursor).toBe('6')
  })

  it('filters by tag and search', () => {
    const tagged = listCopilotsByCursor({ tag: 'Professional Skills' })
    expect(tagged.data.every((c) => c.tags?.includes('Professional Skills'))).toBe(true)

    const searched = listCopilotsByCursor({ search: 'shell command' })
    expect(searched.data.some((c) => c.name === 'Shell Command Expert')).toBe(true)

    const email = listCopilotsByCursor({ search: 'email' })
    expect(email.data.some((c) => c.id.includes('email-drafter'))).toBe(true)
  })

  it('includes featured copilots with ids and metadata', () => {
    const shell = COPILOT_CATALOG.find((c) => c.name === 'Shell Command Expert')
    expect(shell?.id).toBe('019cd6a8-64cf-7eb5-952f-add64a638979')
    expect(shell?.usedCount).toBeGreaterThan(0)
    expect(shell?.avatar?.type).toBe('url')
  })
})
