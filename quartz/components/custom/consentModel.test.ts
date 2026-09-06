import test, { describe } from "node:test"
import assert from "node:assert"
import {
  ANALYTICS_COOKIE_MAX_AGE_SECONDS,
  CONSENT_GRACE_SECONDS,
  CONSENT_MAX_AGE_MS,
  CONSENT_VERSION,
  analyticsCookieNames,
  consentSignals,
  cookieClearDomains,
  createConsentRecord,
  defaultConsentSignals,
  expiredCookieValue,
  isAnalyticsCookie,
  nextAnalyticsAction,
  parseConsentRecord,
} from "./consentModel"

const now = Date.parse("2026-09-06T12:00:00.000Z")

describe("consent signals", () => {
  test("the default denies every optional purpose", () => {
    const signals = defaultConsentSignals()
    assert.equal(signals.analytics_storage, "denied")
    assert.equal(signals.ad_storage, "denied")
    assert.equal(signals.ad_user_data, "denied")
    assert.equal(signals.ad_personalization, "denied")
    assert.equal(signals.personalization_storage, "denied")
  })

  test("an update answers every purpose named in the default", () => {
    const declared = Object.keys(defaultConsentSignals()).sort()

    for (const granted of [true, false]) {
      const answered = Object.keys(consentSignals(granted)).sort()
      assert.deepEqual(answered, declared)
    }
  })

  test("granting analytics moves only analytics_storage", () => {
    const granted = consentSignals(true)
    assert.equal(granted.analytics_storage, "granted")
    assert.equal(granted.ad_storage, "denied")
    assert.equal(granted.ad_user_data, "denied")
    assert.equal(granted.ad_personalization, "denied")
    assert.equal(consentSignals(false).analytics_storage, "denied")
  })
})

describe("consent record", () => {
  test("round-trips a decision", () => {
    const record = createConsentRecord(true, now)
    const parsed = parseConsentRecord(JSON.stringify(record), now)
    assert.deepEqual(parsed, record)
    assert.equal(parsed?.version, CONSENT_VERSION)
  })

  test("the record outlives the analytics cookie by a full day", () => {
    const cookieLifetimeMs = ANALYTICS_COOKIE_MAX_AGE_SECONDS * 1000
    const margin = CONSENT_MAX_AGE_MS - cookieLifetimeMs

    assert.ok(margin > 0, "a record that expires with the cookie leaves no room for load delay")
    assert.equal(margin, CONSENT_GRACE_SECONDS * 1000)
    assert.ok(margin >= 60_000, "the margin must cover a slow gtag.js load, not a fast one")
  })

  test("expires one tick after the analytics cookie", () => {
    const record = JSON.stringify(createConsentRecord(true, now))
    assert.ok(parseConsentRecord(record, now + CONSENT_MAX_AGE_MS - 1))
    assert.equal(parseConsentRecord(record, now + CONSENT_MAX_AGE_MS), null)
  })

  test("rejects a record from another version", () => {
    const record = { ...createConsentRecord(true, now), version: CONSENT_VERSION + 1 }
    assert.equal(parseConsentRecord(JSON.stringify(record), now), null)
  })

  test("rejects malformed, absent and future records", () => {
    assert.equal(parseConsentRecord(null, now), null)
    assert.equal(parseConsentRecord("", now), null)
    assert.equal(parseConsentRecord("not json", now), null)
    assert.equal(parseConsentRecord("null", now), null)
    assert.equal(parseConsentRecord(JSON.stringify({ version: CONSENT_VERSION }), now), null)
    assert.equal(
      parseConsentRecord(
        JSON.stringify({ version: CONSENT_VERSION, analytics: true, decidedAt: "yesterday" }),
        now,
      ),
      null,
    )
    assert.equal(parseConsentRecord(JSON.stringify(createConsentRecord(true, now + 1000)), now), null)
  })

  test("a refusal is a decision, not an absent record", () => {
    const parsed = parseConsentRecord(JSON.stringify(createConsentRecord(false, now)), now)
    assert.equal(parsed?.analytics, false)
  })
})

describe("analytics action", () => {
  test("the first decision of a page load is always applied", () => {
    assert.equal(nextAnalyticsAction(null, true), "enable")
    assert.equal(nextAnalyticsAction(null, false), "disable")
  })

  test("a grant that disappears mid-session is turned off, not merely untracked", () => {
    assert.equal(nextAnalyticsAction(true, false), "disable")
  })

  test("a grant given mid-session is turned on", () => {
    assert.equal(nextAnalyticsAction(false, true), "enable")
  })

  test("an unchanged state only measures, and only when granted", () => {
    assert.equal(nextAnalyticsAction(true, true), "track")
    assert.equal(nextAnalyticsAction(false, false), "none")
  })
})

describe("analytics cookies", () => {
  test("matches the names google actually writes", () => {
    assert.ok(isAnalyticsCookie("_ga"))
    assert.ok(isAnalyticsCookie("_ga_D2GF97WSHZ"))
    assert.ok(!isAnalyticsCookie("_gat"))
    assert.ok(!isAnalyticsCookie("saved-theme"))
  })

  test("reads names out of a cookie header", () => {
    const header = "saved-theme=dark; _ga=GA1.1.1; _ga_D2GF97WSHZ=GS2.1.1"
    assert.deepEqual(analyticsCookieNames(header), ["_ga", "_ga_D2GF97WSHZ"])
    assert.deepEqual(analyticsCookieNames(""), [])
  })

  test("covers every domain a cookie may have been written on", () => {
    assert.deepEqual(cookieClearDomains("dawid.dev"), [undefined, "dawid.dev", ".dawid.dev"])
    assert.deepEqual(cookieClearDomains("localhost"), [undefined])
    assert.deepEqual(cookieClearDomains("notes.dawid.dev"), [
      undefined,
      "notes.dawid.dev",
      ".notes.dawid.dev",
      "dawid.dev",
      ".dawid.dev",
    ])
  })

  test("builds an expiry in the past", () => {
    assert.equal(
      expiredCookieValue("_ga", "dawid.dev"),
      "_ga=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=dawid.dev",
    )
    assert.equal(
      expiredCookieValue("_ga", undefined),
      "_ga=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/",
    )
  })
})
