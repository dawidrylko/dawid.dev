---
date: 2024-04-22
description: "Notify Bing about new and updated pages straight from GitHub Actions using the Bing URL Submission API: build the JSON payload, pass the key, submit the URLs."
tags:
  - dev
  - ops
  - GitHub
---

> [!tldr]
> Script to automate the notification process for submitting URLs to the Bing search engine using the Bing URL Submission API and GitHub Actions.

## 🌐 Overview

This script automates the process of notifying #Bing about new and updated pages on your website using the [Microsoft Bing URL Submission API](https://www.bing.com/webmasters/url-submission-api). It constructs a JSON payload containing the site URL, a list of static pages, and a list of post URLs. The script then submits this payload to the Bing API using a provided API key.

I use this script in my [CD](./CD%20with%20GitHub%20and%20Gatsby.md) pipeline to notify Bing about new or updated content on my website.

## 🚀 Script

```bash title=".github/scripts/bing.sh"
#!/usr/bin/env bash
set -o errexit
set -o nounset

BASE_URL="https://dawidrylko.com"
STATIC_PAGES=("bio")
POSTS_DIR="../../../content/pl/"
TMP_DIR="$(pwd)/tmp"
TMP_FILE="$TMP_DIR/bing.json"

start_time=$(date +%s.%3N)

log_error() {
  echo "Error: $1"
  exit 1
}

# Create a temporary working directory
create_tmp_directory() {
  if [ ! -d "$TMP_DIR" ]; then
    echo "Creating temporary working directory: $TMP_DIR"
    mkdir "$TMP_DIR" || log_error "Failed to create directory $TMP_DIR"
  fi
}

# Construct submission payload
construct_submission_payload() {
  local json_content="{\"siteUrl\": \"$BASE_URL\", \"urlList\": [\"$BASE_URL/\","

  for page in "${STATIC_PAGES[@]}"; do
    json_content+="\"$BASE_URL/$page/\","
  done

  if [ -d "$POSTS_DIR" ]; then
    POSTS=("$POSTS_DIR"*/)
    for ((i=0; i<${#POSTS[@]}; i++)); do
      POST_DIR="${POSTS[i]}"
      POST_NAME=$(basename "$POST_DIR")
      POST_SLUG="${POST_NAME:12}"
      json_content+="\"$BASE_URL/$POST_SLUG/\","
    done
  fi

  if [ -z "$json_content" ]; then
    log_error "JSON content is empty."
  fi

  json_content="${json_content%,}]}"

  echo "Constructed JSON Body:"
  echo "$json_content" | jq '.' > "$TMP_FILE" || log_error "Failed writing to $TMP_FILE"
  cat "$TMP_FILE"
  echo
}

# Check if Bing API key is set
check_api_key() {
  if [ -z "${BING_API_KEY:-}" ]; then
    log_error "BING_API_KEY is not set or is empty. Please set the API key and run the script again."
  fi
}

# Submit URLs to Bing search engine
submit_to_search_engine() {
  local bing_api_url="https://ssl.bing.com/webmaster/api.svc/json/SubmitUrlbatch?apikey=${BING_API_KEY}"

  echo "Submitting to Bing via URL Submission API..."
  response=$(curl -s -w "%{http_code}" "$bing_api_url" \
    -H "Content-Type: application/json; charset=utf-8" \
    -d "@$TMP_FILE" || log_error "Failed submitting to Bing API.")

  http_code=${response: -3}
  body=${response::-3}

  echo "HTTP Response Code: $http_code"
  echo "API Response Body:"
  echo "$body" | jq '.'
  echo
}

# Main execution
create_tmp_directory

cd "$TMP_DIR" || log_error "Failed to change to temporary directory $TMP_DIR"

check_api_key
construct_submission_payload
submit_to_search_engine

end_time=$(date +%s.%3N)
duration=$(echo "scale=0; ($end_time - $start_time) * 1000 / 1" | bc)
echo "---------------------------------"
echo "Script completed in $duration milliseconds."
```

After creating the script file, make sure to make it executable:

```bash
chmod +x .github/scripts/bing.sh
```

When setting up GitHub Actions secrets, add a new repository secret named `BING_API_KEY` and paste your Bing API key.

## 🔗 Quick Links

- [Submitting URLs to Bing using Microsoft Bing URL Submission API and GitHub Actions](https://dawidrylko.com/przesylanie-adresow-do-bing-za-pomoca-microsoft-bing-url-submission-api-i-github-actions/)
