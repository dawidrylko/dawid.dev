// @ts-ignore
import consentDefaultScript from "./consentDefault.inline"
// @ts-ignore
import cookieConsentScript from "./cookieConsent.inline"
import styles from "../styles/cookieConsent.scss"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"
import { classNames } from "../../util/lang"
import { joinSegments, pathToRoot } from "../../util/path"

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
        data-layer="summary"
        hidden
      >
        <div
          class="cookie-consent-dialog"
          role="dialog"
          tabindex={-1}
          aria-modal="true"
          aria-labelledby="cookie-consent-title"
          aria-describedby="cookie-consent-description"
        >
          <h2 id="cookie-consent-title">Cookies and analytics</h2>
          <p id="cookie-consent-description">
            This site measures traffic with Google Analytics, which stores cookies on your device
            and sends your IP address to Google in the United States. It runs only if you allow it,
            and you can change your answer at any time from the link in the footer.
          </p>
          <p class="cookie-consent-links">
            <a href={joinSegments(baseDir, opts.privacySlug)}>Privacy policy</a>
            <a href={joinSegments(baseDir, opts.cookiesSlug)}>Cookie policy</a>
          </p>

          <div class="cookie-consent-categories" data-consent-layer="settings" hidden>
            <div class="cookie-consent-category">
              <label for="cookie-consent-necessary">Strictly necessary</label>
              <input id="cookie-consent-necessary" type="checkbox" checked disabled />
              <p>
                Your theme choice and the notes you have already opened, both kept in your browser
                and never sent anywhere. These cannot be switched off.
              </p>
            </div>
            <div class="cookie-consent-category">
              <label for="cookie-consent-analytics">Analytics</label>
              <input id="cookie-consent-analytics" type="checkbox" />
              <p>
                Google Analytics 4, to count visits and see which notes people read. Off unless you
                turn it on.
              </p>
            </div>
          </div>

          <div class="cookie-consent-actions" data-consent-layer="summary">
            <button type="button" class="cookie-consent-secondary" data-consent-action="customise">
              Customise
            </button>
            <button type="button" data-consent-action="reject">
              Reject analytics
            </button>
            <button type="button" data-consent-action="accept">
              Accept analytics
            </button>
          </div>

          <div class="cookie-consent-actions" data-consent-layer="settings" hidden>
            <button type="button" class="cookie-consent-secondary" data-consent-action="back">
              Back
            </button>
            <button type="button" data-consent-action="save">
              Save choice
            </button>
          </div>
        </div>
      </div>
    )
  }

  CookieConsent.beforeDOMLoaded = consentDefaultScript
  CookieConsent.afterDOMLoaded = cookieConsentScript
  CookieConsent.css = styles

  return CookieConsent
}) satisfies QuartzComponentConstructor
