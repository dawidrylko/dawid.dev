import {
  ANALYTICS_COOKIE_MAX_AGE_SECONDS,
  CONSENT_STORAGE_KEY,
  ConsentRecord,
  analyticsCookieNames,
  consentSignals,
  cookieClearDomains,
  createConsentRecord,
  defaultConsentSignals,
  expiredCookieValue,
  parseConsentRecord,
} from "./consentModel"

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

let injected = false
let configured = false

export function installGtag() {
  window.dataLayer = window.dataLayer ?? []
  if (window.gtag) return

  function shim() {
    window.dataLayer!.push(arguments)
  }

  window.gtag = shim as unknown as Window["gtag"]
}

export function declareConsentDefault() {
  installGtag()
  window.gtag!("consent", "default", { ...defaultConsentSignals(), ads_data_redaction: true })
}

export function updateConsent(analyticsGranted: boolean) {
  installGtag()
  window.gtag!("consent", "update", consentSignals(analyticsGranted))
}

export function readConsent(now: number): ConsentRecord | null {
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY)
    const record = parseConsentRecord(raw, now)

    if (!record && raw !== null) {
      localStorage.removeItem(CONSENT_STORAGE_KEY)
    }

    return record
  } catch {
    return null
  }
}

export function writeConsent(analyticsGranted: boolean, now: number): ConsentRecord {
  const record = createConsentRecord(analyticsGranted, now)

  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record))
  } catch {}

  return record
}

export function clearAnalyticsCookies() {
  const domains = cookieClearDomains(location.hostname)

  for (const name of analyticsCookieNames(document.cookie)) {
    for (const domain of domains) {
      document.cookie = expiredCookieValue(name, domain)
    }
  }
}

export function trackPageView(measurementId: string) {
  if (!configured || !window.gtag) return

  window.gtag("event", "page_view", {
    page_title: document.title,
    page_location: location.href,
    send_to: measurementId,
  })
}

function configureAnalytics(measurementId: string) {
  window.gtag!("js", new Date())
  window.gtag!("config", measurementId, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    cookie_domain: location.hostname,
    cookie_expires: ANALYTICS_COOKIE_MAX_AGE_SECONDS,
    cookie_flags: "SameSite=Lax;Secure",
    cookie_update: false,
    send_page_view: false,
  })

  configured = true
  trackPageView(measurementId)
}

export function enableAnalytics(measurementId: string) {
  installGtag()
  ;(window as unknown as Record<string, unknown>)[`ga-disable-${measurementId}`] = false
  updateConsent(true)

  if (injected) {
    trackPageView(measurementId)
    return
  }

  injected = true
  const script = document.createElement("script")
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
  script.onload = () => configureAnalytics(measurementId)
  document.head.appendChild(script)
}

export function disableAnalytics(measurementId: string) {
  installGtag()
  ;(window as unknown as Record<string, unknown>)[`ga-disable-${measurementId}`] = true
  updateConsent(false)
  clearAnalyticsCookies()
}
