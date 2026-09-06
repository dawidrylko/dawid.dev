import { nextAnalyticsAction } from "./consentModel"
import {
  disableAnalytics,
  enableAnalytics,
  readConsent,
  trackPageView,
  writeConsent,
} from "./consentBrowser"

type Layer = "summary" | "settings"

let appliedGrant: boolean | null = null
let opener: HTMLElement | null = null

function focusableIn(root: HTMLElement): HTMLElement[] {
  const nodes = root.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )
  return Array.from(nodes).filter((node) => !node.hidden && node.offsetParent !== null)
}

function setLayer(banner: HTMLElement, layer: Layer) {
  banner.dataset.layer = layer

  for (const section of banner.querySelectorAll<HTMLElement>("[data-consent-layer]")) {
    section.hidden = section.dataset.consentLayer !== layer
  }
}

function dialogOf(banner: HTMLElement): HTMLElement {
  return banner.querySelector<HTMLElement>(".cookie-consent-dialog") ?? banner
}

function openBanner(banner: HTMLElement, layer: Layer) {
  banner.hidden = false
  setLayer(banner, layer)
  dialogOf(banner).focus()
}

function closeBanner(banner: HTMLElement) {
  banner.hidden = true
  opener?.focus()
  opener = null
}

function analyticsToggle(banner: HTMLElement): HTMLInputElement | null {
  return banner.querySelector<HTMLInputElement>("#cookie-consent-analytics")
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

  const toggle = analyticsToggle(banner)
  if (toggle) toggle.checked = granted

  closeBanner(banner)
}

document.addEventListener("nav", () => {
  const banner = document.querySelector<HTMLElement>("#cookie-consent")
  const measurementId = banner?.dataset.measurementId
  if (!banner || !measurementId) return

  const record = readConsent(Date.now())
  applyGrant(measurementId, record?.analytics ?? false)

  const toggle = analyticsToggle(banner)
  if (toggle) toggle.checked = record?.analytics ?? false

  if (record) {
    banner.hidden = true
  } else {
    openBanner(banner, "summary")
  }

  const onKeydown = (event: KeyboardEvent) => {
    if (banner.hidden) return

    if (event.key === "Escape") {
      event.preventDefault()

      if (banner.dataset.layer === "settings" && !readConsent(Date.now())) {
        setLayer(banner, "summary")
        dialogOf(banner).focus()
      } else {
        closeBanner(banner)
      }

      return
    }

    if (event.key !== "Tab") return

    const focusable = focusableIn(banner)
    if (focusable.length === 0) return

    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    const active = document.activeElement as HTMLElement | null
    const inside = active !== null && focusable.includes(active)

    if (!inside) {
      event.preventDefault()
      ;(event.shiftKey ? last : first).focus()
    } else if (event.shiftKey && active === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && active === last) {
      event.preventDefault()
      first.focus()
    }
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
          openBanner(banner, "settings")
          break
        case "customise":
          setLayer(banner, "settings")
          dialogOf(banner).focus()
          break
        case "back":
          setLayer(banner, "summary")
          dialogOf(banner).focus()
          break
        case "accept":
          decide(banner, measurementId, true)
          break
        case "reject":
          decide(banner, measurementId, false)
          break
        case "save":
          decide(banner, measurementId, analyticsToggle(banner)?.checked ?? false)
          break
      }
    }

    control.addEventListener("click", onClick)
    window.addCleanup(() => control.removeEventListener("click", onClick))
  }
})
