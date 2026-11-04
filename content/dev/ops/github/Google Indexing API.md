---
title: "Google Indexing API: why it is not for blog posts"
date: 2024-04-22
modified: 2026-11-04
description: "An archived script that sent blog URLs to the Google Indexing API from GitHub Actions, why that was outside its scope, and what to use instead."
tags:
  - dev
  - ops
  - GitHub
---

> [!tldr]
> The Google Indexing API accepts only pages with `JobPosting` or `BroadcastEvent` (embedded in a `VideoObject`) structured data. From November 2023 to July 2026 I ran a script that sent every blog post of dawidrylko.com to it. That was outside the API's scope, so I removed it. For ordinary pages the supported route is a sitemap, URL Inspection in Search Console and good internal links.

## What the API is for

Google's quickstart is explicit: the Indexing API "can only be used to crawl pages with either `JobPosting` or `BroadcastEvent` embedded in a `VideoObject`". It lets Google schedule a fresh crawl of such a page, which is a request to fetch it, not a promise to index it. Every submission goes through spam detection, and Google warns that abuse, including spreading requests over several accounts, may get access revoked.

A blog post, a landing page or a documentation page is none of those types. A successful response code does not make sending them a supported use.

## What I did, and why I stopped

On 28 November 2023 I added a step to the deployment of dawidrylko.com, my Polish blog. It used [easyindex-cli](https://github.com/usk81/easyindex-cli) to send the home page, one static page and every post to the Indexing API. I described the setup in a Polish post, [Przesyłanie adresów do Google za pomocą Indexing API i GitHub Actions](https://dawidrylko.com/przesylanie-adresow-do-google-za-pomoca-indexing-api-i-github-actions/) (in Polish), and in the first version of this note.

On 7 July 2026 I removed the step while aligning the site with Google's guidance. The Polish post and this note now both describe the script as an archive. Four months after I removed the step, URL Inspection in Search Console lists 14 of the 57 sitemap URLs on that site as crawled or discovered but not indexed. A crawl request only asks Google to fetch a page again. Whether the page is then indexed is a separate decision.

## What to use instead

| Need | Supported route |
| --- | --- |
| Tell Google which URLs exist and when they changed | A sitemap with an honest `lastmod`, declared in `robots.txt` and submitted in Search Console |
| Ask for a recrawl of one changed page | URL Inspection, then "Request indexing", in Search Console |
| Notify Bing and other IndexNow engines automatically | [[Bing URL Submission API]] or IndexNow, both meant for any page |
| Get a page indexed at all | Content worth indexing, internal links from indexed pages, links from other sites |

A `lastmod` helps only when it is true. Google's sitemap documentation says it uses the value only when it is consistently and verifiably accurate. A deploy that rewrites every date teaches Google to ignore the field.

## The archived script

This is the first version, from November 2023, kept for reference and for sites that do publish `JobPosting` or `BroadcastEvent` pages. On such a site, replace the post loop with a list of the qualifying URLs. Do not run it against ordinary posts. It downloads easyindex-cli without verifying a checksum. The [last version before removal](https://github.com/dawidrylko/dawidrylko.com/blob/fead8a7a0d403faebb75ecbb3fd34f0a1687a60d/scripts/notify/google.sh) pins the release by SHA-256 and retries failed calls, so start from that one.

```bash title="google.sh (first version, November 2023)"
#!/usr/bin/env bash
set -o errexit
set -o nounset

BASE_URL="https://dawidrylko.com"
STATIC_PAGES=("about")
POSTS_DIR="../../../content/pl/"
TMP_DIR="$(pwd)/tmp"
TMP_FILE="$TMP_DIR/google.csv"

start_time=$(date +%s.%3N)

log_error() {
  echo "Error: $1"
  exit 1
}

create_tmp_directory() {
  if [ ! -d "$TMP_DIR" ]; then
    echo "Creating temporary working directory: $TMP_DIR"
    mkdir "$TMP_DIR" || log_error "Failed to create directory $TMP_DIR"
  fi
}

download_easyindex_cli() {
  EASYINDEX_CLI="./easyindex-cli"
  if [ ! -f "$EASYINDEX_CLI" ]; then
    echo "Fetching easyindex-cli binary..."
    curl -s -L "https://github.com/usk81/easyindex-cli/releases/download/v1.0.6/easyindex-cli_1.0.6_linux_amd64.tar.gz" | tar xz || log_error "Failed to download and extract easyindex-cli binary."
    echo
  fi
}

copy_credentials_file() {
  echo "Using the GOOGLE_JSON_KEY_FILE environment variable..."
  if [ -z "${GOOGLE_JSON_KEY_FILE:-}" ]; then
    log_error "GOOGLE_JSON_KEY_FILE is not set or is empty. Exiting."
  fi

  echo "$GOOGLE_JSON_KEY_FILE" > "$TMP_DIR/credentials.json" || log_error "Failed to write to credentials file $TMP_DIR/credentials.json"
}

construct_submission_payload() {
  echo "\"notification_type\",\"url\"" >> "$TMP_FILE"
  echo "\"URL_UPDATED\",\"${BASE_URL}/\"" >> "$TMP_FILE"

  for page in "${STATIC_PAGES[@]}"; do
    echo "\"URL_UPDATED\",\"${BASE_URL}/${page}/\"" >> "$TMP_FILE"
  done

  if [ -d "$POSTS_DIR" ]; then
    POSTS=("$POSTS_DIR"*/)
    for ((i=0; i<${#POSTS[@]}; i++)); do
      POST_DIR="${POSTS[i]}"
      POST_NAME=$(basename "$POST_DIR")
      POST_SLUG="${POST_NAME:12}"
      echo "\"URL_UPDATED\",\"${BASE_URL}/${POST_SLUG}/\"" >> "$TMP_FILE"
    done
  fi

  echo "Constructed CSV file contents:"
  cat "$TMP_FILE"
  echo
}

submit_to_search_engine() {
  echo "Submitting to Google via Indexing API..."
  "$EASYINDEX_CLI" google publish --csv "$TMP_FILE" -C "$TMP_DIR/credentials.json" || log_error "An error returned by easyindex-cli. Exiting."
  echo
}

create_tmp_directory

cd "$TMP_DIR" || log_error "Failed to change to temporary directory $TMP_DIR"

download_easyindex_cli
copy_credentials_file
construct_submission_payload
submit_to_search_engine

end_time=$(date +%s.%3N)
duration=$(echo "scale=0; ($end_time - $start_time) * 1000 / 1" | bc)
echo "---------------------------------"
echo "Script completed in $duration milliseconds."
```

The service account key goes into a repository secret named `GOOGLE_JSON_KEY_FILE`, pasted whole. The script writes it to a temporary file on the runner and never into the repository.

## Sources

1. Google Search Central, [Indexing API quickstart](https://developers.google.com/search/apis/indexing-api/v3/quickstart): supported page types, spam detection, revoked access for abuse.
2. Google Search Central, [Build and submit a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap): when Google uses `lastmod`.
3. Google Search Console Help, [URL Inspection tool](https://support.google.com/webmasters/answer/9012289): requesting a recrawl of a single URL.
4. usk81, [easyindex-cli](https://github.com/usk81/easyindex-cli): the CLI the archived script calls.
