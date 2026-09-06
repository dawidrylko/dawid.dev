import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"
import { joinSegments, pathToRoot } from "../../util/path"
import style from "../styles/footer.scss"

interface Options {
  links: Record<string, string>
  privacySlug: string
  cookiesSlug: string
}

export default ((opts?: Options) => {
  const Footer: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
    const year = new Date().getFullYear()
    const links = opts?.links ?? []
    const baseDir = pathToRoot(fileData.slug!)

    return (
      <footer class={`${displayClass ?? ""}`}>
        <p>Copyright © {year} Dawid Ryłko</p>
        <ul>
          {Object.entries(links).map(([text, link]) => (
            <li>
              <a href={link}>{text}</a>
            </li>
          ))}
          <li>
            <a href={joinSegments(baseDir, opts?.privacySlug ?? "privacy")}>Privacy</a>
          </li>
          <li>
            <a href={joinSegments(baseDir, opts?.cookiesSlug ?? "cookies")}>Cookies</a>
          </li>
          <li>
            <button type="button" class="cookie-consent-open" data-consent-action="open">
              Cookie settings
            </button>
          </li>
        </ul>
      </footer>
    )
  }

  Footer.css = style
  return Footer
}) satisfies QuartzComponentConstructor
