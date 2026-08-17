const FORCE_SHOW_NEW_USER_SCENARIO_CARDS_KEY = 'dev-tools:force-show-new-user-scenario-cards'

export function getForceShowNewUserScenarioCardsFlag() {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(FORCE_SHOW_NEW_USER_SCENARIO_CARDS_KEY) === 'true'
}

export function setForceShowNewUserScenarioCardsFlag(show: boolean) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(FORCE_SHOW_NEW_USER_SCENARIO_CARDS_KEY, show ? 'true' : 'false')
}
