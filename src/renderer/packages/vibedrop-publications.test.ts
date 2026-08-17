import { beforeEach, describe, expect, test, vi } from 'vitest'

type TestPublication = {
  slug: string
  url: string
  visibility: 'unlisted' | 'public'
  uniqueId?: string
  updatedAt: number
}

type TestSettings = {
  vibedropSessionPublications?: Record<string, TestPublication[]>
}

const mocks = vi.hoisted(() => {
  const state: TestSettings = {}
  return {
    state,
    setState: vi.fn((update: Partial<TestSettings> | ((current: TestSettings) => Partial<TestSettings>)) => {
      Object.assign(state, typeof update === 'function' ? update(state) : update)
    }),
  }
})

vi.mock('@/stores/settingsStore', () => ({
  settingsStore: {
    getState: () => mocks.state,
    setState: mocks.setState,
  },
}))

vi.mock('@/platform', () => ({
  default: { type: 'desktop' },
}))

import { getSessionVibedropPublications, recordSessionVibedropPublication } from './vibedrop'

describe('VibeDrop session publication history', () => {
  beforeEach(() => {
    mocks.state.vibedropSessionPublications = undefined
    mocks.setState.mockClear()
  })

  test('records published sites under their session', () => {
    recordSessionVibedropPublication('session-1', 'artifact-1', {
      slug: 'site-1',
      url: 'https://site-1.vibedrop.site',
      visibility: 'unlisted',
    })

    expect(getSessionVibedropPublications('session-1')).toEqual([
      expect.objectContaining({
        slug: 'site-1',
        uniqueId: 'artifact-1',
        visibility: 'unlisted',
      }),
    ])
    expect(getSessionVibedropPublications('session-2')).toEqual([])
  })

  test('moves an updated site to the front without duplicating it', () => {
    recordSessionVibedropPublication('session-1', 'artifact-1', {
      slug: 'site-1',
      url: 'https://site-1.vibedrop.site',
      visibility: 'unlisted',
    })
    recordSessionVibedropPublication('session-1', 'artifact-2', {
      slug: 'site-2',
      url: 'https://site-2.vibedrop.site',
      visibility: 'public',
    })
    recordSessionVibedropPublication('session-1', 'artifact-3', {
      slug: 'site-1',
      url: 'https://site-1.vibedrop.site',
      visibility: 'public',
    })

    expect(getSessionVibedropPublications('session-1').map((publication) => publication.slug)).toEqual([
      'site-1',
      'site-2',
    ])
    expect(getSessionVibedropPublications('session-1')[0]).toEqual(
      expect.objectContaining({
        uniqueId: 'artifact-3',
        visibility: 'public',
      })
    )
  })

  test('does not record publications without a persisted session', () => {
    recordSessionVibedropPublication(undefined, 'artifact-1', {
      slug: 'site-1',
      url: 'https://site-1.vibedrop.site',
      visibility: 'unlisted',
    })
    recordSessionVibedropPublication('new', 'artifact-1', {
      slug: 'site-1',
      url: 'https://site-1.vibedrop.site',
      visibility: 'unlisted',
    })

    expect(mocks.setState).not.toHaveBeenCalled()
  })

  test('keeps only the 20 most recently published sites per session', () => {
    for (let index = 0; index <= 20; index += 1) {
      recordSessionVibedropPublication('session-1', `artifact-${index}`, {
        slug: `site-${index}`,
        url: `https://site-${index}.vibedrop.site`,
        visibility: 'unlisted',
      })
    }

    const publications = getSessionVibedropPublications('session-1')
    expect(publications).toHaveLength(20)
    expect(publications[0].slug).toBe('site-20')
    expect(publications.some((publication) => publication.slug === 'site-0')).toBe(false)
  })
})
