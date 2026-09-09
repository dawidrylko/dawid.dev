// @ts-ignore
import consentDefaultScript from "./consentDefault.inline"
// @ts-ignore
import cookieConsentScript from "./cookieConsent.inline"
import styles from "../styles/cookieConsent.scss"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"
import { classNames } from "../../util/lang"
import { joinSegments, pathToRoot } from "../../util/path"

// Consent gate for GA4. Art. 399 of the Prawo komunikacji elektronicznej
// requires prior consent for anything written to the device, and Poland grants
// analytics no exemption, so the measurement loader is injected only once this
// banner has been answered.
//
// The banner is deliberately not modal: it neither locks scrolling nor traps
// focus, so the site stays fully usable while the question is open. Refusing is
// one click, exactly like accepting. The wording, the layout and the two
// answers are shared verbatim with dawidrylko.com, so the same question reads
// the same way on both sites.

interface Options {
  measurementId: string
  privacySlug: string
  cookiesSlug: string
}

export default ((opts?: Options) => {
  const CookieConsent: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
    if (!opts?.measurementId) return null

    const baseDir = pathToRoot(fileData.slug!)

    return (
      <div
        id="cookie-consent"
        class={classNames(displayClass, "cookie-consent")}
        data-measurement-id={opts.measurementId}
        role="dialog"
        tabindex={-1}
        aria-labelledby="cookie-consent-title"
        aria-describedby="cookie-consent-description"
        hidden
      >
        <div class="cookie-consent-text">
          <h2 id="cookie-consent-title">Analytics cookies</h2>
          <p id="cookie-consent-description">
            This site measures traffic with Google Analytics 4, which stores two cookies on your
            device. Nothing is loaded and nothing is stored until you agree. Refusing keeps the site
            fully usable.
          </p>
          <p
            class="cookie-consent-state"
            data-allowed="Your current choice: analytics allowed."
            data-refused="Your current choice: analytics refused."
            hidden
          ></p>
          <p class="cookie-consent-links">
            <a href={joinSegments(baseDir, opts.cookiesSlug)}>Cookie policy</a>
            <span class="separator" aria-hidden="true">
              •
            </span>
            <a href={joinSegments(baseDir, opts.privacySlug)}>Privacy policy</a>
          </p>
        </div>
        <div class="cookie-consent-actions">
          <button type="button" data-consent-action="reject">
            Refuse
          </button>
          <button type="button" data-consent-action="accept">
            Accept
          </button>
        </div>
      </div>
    )
  }

  CookieConsent.beforeDOMLoaded = consentDefaultScript
  CookieConsent.afterDOMLoaded = cookieConsentScript
  CookieConsent.css = styles

  return CookieConsent
}) satisfies QuartzComponentConstructor
