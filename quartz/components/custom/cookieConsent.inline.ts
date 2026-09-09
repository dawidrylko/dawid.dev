import { nextAnalyticsAction } from "./consentModel"
import {
  disableAnalytics,
  enableAnalytics,
  readConsent,
  trackPageView,
  writeConsent,
} from "./consentBrowser"

// Behaviour mirrors the banner on dawidrylko.com: a bottom bar that is not
// modal. It does not trap focus and does not lock scrolling, so the page stays
// usable while the question is open, and the two answers cost the same single
// click.

let appliedGrant: boolean | null = null
let opener: HTMLElement | null = null

function stateLine(banner: HTMLElement): HTMLElement | null {
  return banner.querySelector<HTMLElement>(".cookie-consent-state")
}

/** The "your current choice" line, shown only over a decision already on record. */
function showState(banner: HTMLElement, decided: boolean | null) {
  const line = stateLine(banner)
  if (!line) return

  if (decided === null) {
    line.textContent = ""
    line.hidden = true
    return
  }

  line.textContent = (decided ? line.dataset.allowed : line.dataset.refused) ?? ""
  line.hidden = false
}

function openBanner(banner: HTMLElement, decided: boolean | null) {
  showState(banner, decided)
  banner.hidden = false
  banner.focus()
}

function closeBanner(banner: HTMLElement) {
  banner.hidden = true
  opener?.focus()
  opener = null
}

function applyGrant(measurementId: string, granted: boolean) {
  const action = nextAnalyticsAction(appliedGrant, granted)
  appliedGrant = granted

  switch (action) {
    case "enable":
      enableAnalytics(measurementId)
      break
    case "disable":
      disableAnalytics(measurementId)
      break
    case "track":
      trackPageView(measurementId)
      break
  }
}

function decide(banner: HTMLElement, measurementId: string, granted: boolean) {
  writeConsent(granted, Date.now())

  if (appliedGrant !== granted) {
    applyGrant(measurementId, granted)
  }

  showState(banner, granted)
  closeBanner(banner)
}

document.addEventListener("nav", () => {
  const banner = document.querySelector<HTMLElement>("#cookie-consent")
  const measurementId = banner?.dataset.measurementId
  if (!banner || !measurementId) return

  const record = readConsent(Date.now())
  applyGrant(measurementId, record?.analytics ?? false)

  if (record) {
    showState(banner, record.analytics)
    banner.hidden = true
  } else {
    openBanner(banner, null)
  }

  // Escape only dismisses a banner reopened over an existing decision. On a
  // first visit there is nothing to fall back to, so the question stays until
  // it is answered one way or the other.
  const onKeydown = (event: KeyboardEvent) => {
    if (banner.hidden || event.key !== "Escape") return
    if (!readConsent(Date.now())) return

    event.preventDefault()
    closeBanner(banner)
  }

  document.addEventListener("keydown", onKeydown)
  window.addCleanup(() => document.removeEventListener("keydown", onKeydown))

  for (const control of document.querySelectorAll<HTMLElement>("[data-consent-action]")) {
    const action = control.dataset.consentAction

    const onClick = (event: MouseEvent) => {
      event.preventDefault()

      switch (action) {
        case "open":
          opener = control
          openBanner(banner, readConsent(Date.now())?.analytics ?? null)
          break
        case "accept":
          decide(banner, measurementId, true)
          break
        case "reject":
          decide(banner, measurementId, false)
          break
      }
    }

    control.addEventListener("click", onClick)
    window.addCleanup(() => control.removeEventListener("click", onClick))
  }
})
