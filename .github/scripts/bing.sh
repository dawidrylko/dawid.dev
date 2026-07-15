#!/usr/bin/env bash
set -o errexit
set -o nounset

BASE_URL="https://dawid.dev"
PUBLIC_DIR="../../../public"
TMP_DIR="$(pwd)/tmp"
TMP_FILE="$TMP_DIR/bing.json"
MAX_URLS_PER_BATCH=100

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
  if [ ! -d "$PUBLIC_DIR" ]; then
    log_error "Public directory '$PUBLIC_DIR' does not exist. Was the site built correctly?"
  fi
  echo "Finding HTML files in $PUBLIC_DIR..."
  ls -la "$PUBLIC_DIR"

  # Initialize URL array with homepage
  url_array=("\"$BASE_URL/\"")

  # Find all HTML files and construct URLs
  for file in $(find "$PUBLIC_DIR" -type f -name "*.html"); do
    # Get relative path from public directory
    relative_path="${file#$PUBLIC_DIR/}"
    # Skip the root index.html as we've already added the homepage
    if [[ "$relative_path" == "index.html" ]]; then
      continue
    fi
    # Convert path to URL format and add to list
    url_path="${relative_path%.html}"
    # If it's an index.html file, adjust the path
    if [[ "$relative_path" == *"/index.html" ]]; then
      url_path="${relative_path%/index.html}"
    fi
    url_array+=("\"$BASE_URL/$url_path\"")
  done

  echo "Found ${#url_array[@]} URLs to submit"

  # Split URLs into batches of MAX_URLS_PER_BATCH
  total_urls=${#url_array[@]}
  batch_count=$(((total_urls + MAX_URLS_PER_BATCH - 1) / MAX_URLS_PER_BATCH))

  # Create batches directory
  BATCHES_DIR="$TMP_DIR/batches"
  mkdir -p "$BATCHES_DIR"

  for ((i = 0; i < batch_count; i++)); do
    start_idx=$((i * MAX_URLS_PER_BATCH))
    end_idx=$(((i + 1) * MAX_URLS_PER_BATCH))
    if [ $end_idx -gt $total_urls ]; then
      end_idx=$total_urls
    fi

    # Join URLs for this batch
    batch_urls=$(printf ",%s" "${url_array[@]:start_idx:$((end_idx - start_idx))}")
    batch_urls=${batch_urls:1} # Remove leading comma

    # Create JSON payload for this batch
    batch_file="$BATCHES_DIR/batch_$i.json"
    json_content="{\"siteUrl\": \"$BASE_URL\", \"urlList\": [$batch_urls]}"
    echo "$json_content" | jq '.' >"$batch_file" || log_error "Failed writing to $batch_file"

    echo "Created batch $((i + 1))/$batch_count with $((end_idx - start_idx)) URLs"
  done
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

  BATCHES_DIR="$TMP_DIR/batches"
  batch_files=("$BATCHES_DIR"/*.json)
  total_batches=${#batch_files[@]}

  echo "Submitting $total_batches batches to Bing via URL Submission API..."

  for ((i = 0; i < total_batches; i++)); do
    batch_file="${batch_files[i]}"
    echo "Submitting batch $((i + 1))/$total_batches: $(basename "$batch_file")"

    echo "Request Body:"
    cat "$batch_file"

    response=$(curl -s -w "%{http_code}" "$bing_api_url" \
      -H "Content-Type: application/json; charset=utf-8" \
      -d "@$batch_file" || log_error "Failed submitting to Bing API.")

    http_code=${response: -3}
    body=${response::-3}

    echo "HTTP Response Code: $http_code"
    echo "API Response Body:"
    echo "$body" | jq '.'

    # Add a small delay between batch submissions to avoid rate limiting
    if [ $((i + 1)) -lt $total_batches ]; then
      echo "Waiting 1 second before next batch..."
      sleep 1
    fi
  done
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
