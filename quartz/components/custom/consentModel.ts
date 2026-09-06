export const CONSENT_STORAGE_KEY = "cookie-consent"
export const CONSENT_VERSION = 1
export const ANALYTICS_COOKIE_MAX_AGE_SECONDS = 34128000
export const CONSENT_GRACE_SECONDS = 86400
export const CONSENT_MAX_AGE_MS = (ANALYTICS_COOKIE_MAX_AGE_SECONDS + CONSENT_GRACE_SECONDS) * 1000

export type ConsentSignal = "granted" | "denied"

export interface ConsentSignals {
  ad_storage: ConsentSignal
  ad_user_data: ConsentSignal
  ad_personalization: ConsentSignal
  analytics_storage: ConsentSignal
  functionality_storage: ConsentSignal
  personalization_storage: ConsentSignal
  security_storage: ConsentSignal
}

export interface ConsentRecord {
  version: number
  analytics: boolean
  decidedAt: string
}

export function defaultConsentSignals(): ConsentSignals {
  return {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    functionality_storage: "granted",
    personalization_storage: "denied",
    security_storage: "granted",
  }
}

export function consentSignals(analyticsGranted: boolean): ConsentSignals {
  return {
    ...defaultConsentSignals(),
    analytics_storage: analyticsGranted ? "granted" : "denied",
  }
}

export function createConsentRecord(analyticsGranted: boolean, now: number): ConsentRecord {
  return {
    version: CONSENT_VERSION,
    analytics: analyticsGranted,
    decidedAt: new Date(now).toISOString(),
  }
}

export function parseConsentRecord(raw: string | null, now: number): ConsentRecord | null {
  if (!raw) return null

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }

  if (typeof parsed !== "object" || parsed === null) return null

  const record = parsed as Partial<ConsentRecord>
  if (record.version !== CONSENT_VERSION) return null
  if (typeof record.analytics !== "boolean") return null
  if (typeof record.decidedAt !== "string") return null

  const decidedAt = Date.parse(record.decidedAt)
  if (Number.isNaN(decidedAt)) return null
  if (decidedAt > now) return null
  if (now - decidedAt >= CONSENT_MAX_AGE_MS) return null

  return { version: record.version, analytics: record.analytics, decidedAt: record.decidedAt }
}

export type AnalyticsAction = "enable" | "disable" | "track" | "none"

export function nextAnalyticsAction(applied: boolean | null, granted: boolean): AnalyticsAction {
  if (applied !== granted) {
    return granted ? "enable" : "disable"
  }

  return granted ? "track" : "none"
}

export function isAnalyticsCookie(name: string): boolean {
  return /^_ga(_.+)?$/.test(name)
}

export function analyticsCookieNames(cookieHeader: string): string[] {
  return cookieHeader
    .split(";")
    .map((entry) => entry.split("=")[0].trim())
    .filter((name) => name.length > 0 && isAnalyticsCookie(name))
}

export function cookieClearDomains(hostname: string): (string | undefined)[] {
  const labels = hostname.split(".")
  const domains: (string | undefined)[] = [undefined]

  for (let index = 0; index <= labels.length - 2; index++) {
    const domain = labels.slice(index).join(".")
    domains.push(domain, `.${domain}`)
  }

  return domains
}

export function expiredCookieValue(name: string, domain: string | undefined): string {
  return [
    `${name}=`,
    "expires=Thu, 01 Jan 1970 00:00:00 GMT",
    "path=/",
    domain ? `domain=${domain}` : "",
  ]
    .filter(Boolean)
    .join("; ")
}
