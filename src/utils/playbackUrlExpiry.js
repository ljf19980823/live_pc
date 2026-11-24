function getAuthKey(url) {
  if (!url) return ''
  try {
    const parsed = new URL(url, typeof window !== 'undefined' ? window.location.href : 'https://localhost/')
    for (const [key, value] of parsed.searchParams.entries()) {
      if (key.toLowerCase() === 'auth_key') return value
    }
  } catch (e) {}
  return ''
}

/** CDN auth_key uses an expiry timestamp as its first hyphen-separated value. */
export function getAuthKeyExpireAt(url) {
  const authKey = getAuthKey(url)
  const match = authKey.match(/^(\d{10,13})(?:[-_.]|$)/)
  if (!match) return null
  const timestamp = Number(match[1])
  if (!Number.isFinite(timestamp)) return null
  return timestamp < 1000000000000 ? timestamp * 1000 : timestamp
}

export function hasAuthKey(url) {
  return Boolean(getAuthKey(url))
}

/** Use the earlier expiry when API metadata and the signed URL disagree. */
export function getPlaybackUrlExpireAt(url, urlExpireAt) {
  const expirations = []
  if (urlExpireAt !== undefined && urlExpireAt !== null && urlExpireAt !== '') {
    let value = Number(urlExpireAt)
    if (Number.isFinite(value)) {
      if (value > 0 && value < 1000000000000) value *= 1000
      expirations.push(value)
    }
  }
  const authKeyExpireAt = getAuthKeyExpireAt(url)
  if (authKeyExpireAt !== null) expirations.push(authKeyExpireAt)
  return expirations.length ? Math.min(...expirations) : null
}
