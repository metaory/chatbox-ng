export type HomeWelcomeCardMode = 'none' | 'setup'

export function getHomeWelcomeCardMode(params: {
  providerCount: number
  hideForStoreReview?: boolean
}): HomeWelcomeCardMode {
  if (params.hideForStoreReview) return 'none'
  if (params.providerCount > 0) return 'none'
  return 'setup'
}
