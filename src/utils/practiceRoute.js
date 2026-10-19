const PRACTICE_ROUTE_CONFIG_KEY = 'teacherone_practice_route_config'

export function savePracticeRouteConfig(config) {
  localStorage.setItem(PRACTICE_ROUTE_CONFIG_KEY, JSON.stringify(config || {}))
}

export function getPracticeRouteConfig() {
  const rawConfig = localStorage.getItem(PRACTICE_ROUTE_CONFIG_KEY)
  if (!rawConfig) return {}

  try {
    return JSON.parse(rawConfig) || {}
  } catch (error) {
    localStorage.removeItem(PRACTICE_ROUTE_CONFIG_KEY)
    return {}
  }
}

export function clearPracticeRouteConfig() {
  localStorage.removeItem(PRACTICE_ROUTE_CONFIG_KEY)
}
