import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"
import ContentMeta from "./quartz/components/custom/ContentMeta"
import CookieConsent from "./quartz/components/custom/CookieConsent"
import Footer from "./quartz/components/custom/Footer"
import Head from "./quartz/components/custom/Head"

const measurementId = "G-D2GF97WSHZ"
const privacySlug = "privacy"
const cookiesSlug = "cookies"

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Head(),
  header: [],
  afterBody: [CookieConsent({ measurementId, privacySlug, cookiesSlug })],
  footer: Footer({
    privacySlug,
    cookiesSlug,
    links: {
      Home: "https://dawid.dev",
      Website: "https://dawidrylko.com/",
      GitHub: "https://github.com/dawidrylko",
      Twitter: "https://twitter.com/dawidrylko",
      LinkedIn: "https://www.linkedin.com/in/dawidrylko/",
    },
  }),
}

// components for pages that display a single page (e.g. a single note)
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.ConditionalRender({
      component: Component.Breadcrumbs(),
      condition: (page) => page.fileData.slug !== "index",
    }),
    Component.ArticleTitle(),
    ContentMeta({ showBothDates: true }),
    Component.TagList(),
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
        { Component: Component.ReaderMode() },
      ],
    }),
    Component.Explorer(),
  ],
  right: [
    Component.Graph(),
    Component.DesktopOnly(Component.TableOfContents()),
    Component.DesktopOnly(Component.Backlinks()),
  ],
}

// components for pages that display lists of pages  (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [
    Component.Breadcrumbs(),
    Component.ArticleTitle(),
    ContentMeta({ showBothDates: true }),
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
      ],
    }),
    Component.Explorer(),
  ],
  right: [],
}
