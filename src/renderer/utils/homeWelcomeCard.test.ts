import { describe, expect, it } from 'vitest'

import { getHomeWelcomeCardMode } from './homeWelcomeCard'

describe('getHomeWelcomeCardMode', () => {
  it('returns "none" when providerCount > 0', () => {
    expect(getHomeWelcomeCardMode({ providerCount: 1 })).toBe('none')
  })

  it('returns "setup" when no providers are configured', () => {
    expect(getHomeWelcomeCardMode({ providerCount: 0 })).toBe('setup')
  })

  it('returns "none" during store review even when setup would otherwise show', () => {
    expect(getHomeWelcomeCardMode({ providerCount: 0, hideForStoreReview: true })).toBe('none')
  })
})
