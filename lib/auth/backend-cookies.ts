const SET_COOKIE_SEPARATOR = /,(?=\s*[^;,=\s]+=[^;,]+)/

export type BackendAuthCookies = {
  cookieHeader?: string
  cookieNames: string[]
}

export function extractBackendAuthCookies(setCookieHeader: string | null): BackendAuthCookies {
  if (!setCookieHeader) {
    return {
      cookieNames: [],
    }
  }

  const cookiePairs = setCookieHeader
    .split(SET_COOKIE_SEPARATOR)
    .map((cookie) => cookie.split(";")[0]?.trim())
    .filter((cookie): cookie is string => Boolean(cookie && cookie.includes("=")))

  return {
    cookieHeader: cookiePairs.join("; "),
    cookieNames: cookiePairs.map((cookie) => cookie.slice(0, cookie.indexOf("="))),
  }
}

export function getBackendAuthCookieHeader(
  requestCookieHeader: string | null,
  cookieNames: string[] = [],
  fallbackCookieHeader?: string,
) {
  if (!requestCookieHeader || cookieNames.length === 0) {
    return fallbackCookieHeader
  }

  const allowedNames = new Set(cookieNames)
  const cookies = requestCookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .filter((cookie) => {
      const separatorIndex = cookie.indexOf("=")

      if (separatorIndex === -1) {
        return false
      }

      return allowedNames.has(cookie.slice(0, separatorIndex))
    })

  return cookies.length > 0 ? cookies.join("; ") : fallbackCookieHeader
}
