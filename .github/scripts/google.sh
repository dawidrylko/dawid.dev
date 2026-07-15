#!/usr/bin/env bash
set -o errexit
set -o nounset

BASE_URL="https://dawid.dev"
PUBLIC_DIR="../../../public"
TMP_DIR="$(pwd)/tmp"
TMP_FILE="$TMP_DIR/google.csv"

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

# Download https://github.com/usk81/easyindex-cli
download_easyindex_cli() {
  EASYINDEX_CLI="./easyindex-cli"
  if [ ! -f "$EASYINDEX_CLI" ]; then
    echo "Fetching easyindex-cli binary..."
    curl -s -L "https://github.com/usk81/easyindex-cli/releases/download/v1.0.6/easyindex-cli_1.0.6_linux_amd64.tar.gz" | tar xz || log_error "Failed to download and extract easyindex-cli binary."
    echo
  fi
}

# Copy credentials file
copy_credentials_file() {
  echo "Using the GOOGLE_JSON_KEY_FILE environment variable..."
  if [ -z "${GOOGLE_JSON_KEY_FILE:-}" ]; then
    log_error "GOOGLE_JSON_KEY_FILE is not set or is empty. Exiting."
  fi

  echo "$GOOGLE_JSON_KEY_FILE" > "$TMP_DIR/credentials.json" || log_error "Failed to write to credentials file $TMP_DIR/credentials.json"
}

# Construct submission payload
construct_submission_payload() {
  if [ ! -d "$PUBLIC_DIR" ]; then
    log_error "Public directory '$PUBLIC_DIR' does not exist. Was the site built correctly?"
  fi

  echo "Finding HTML files in $PUBLIC_DIR..."
  ls -la "$PUBLIC_DIR"

  # Initialize the CSV file with header
  echo "\"notification_type\",\"url\"" > "$TMP_FILE"

  # Always add the home page
  echo "\"URL_UPDATED\",\"${BASE_URL}\"" >> "$TMP_FILE"

  # Find all HTML files and construct URLs
  find "$PUBLIC_DIR" -type f -name "*.html" | while read -r file; do
    # Get relative path from public directory
    relative_path="${file#$PUBLIC_DIR/}"

    # Convert path to URL format
    url_path="${relative_path%.html}"

    # If it's an index.html file, adjust the path
    if [[ "$relative_path" == *"/index.html" ]]; then
      url_path="${relative_path%/index.html}"
    elif [[ "$relative_path" == "index.html" ]]; then
      # Skip the root index.html as we've already added the homepage
      continue
    fi

    # Add URL to CSV
    echo "\"URL_UPDATED\",\"${BASE_URL}/${url_path}\"" >> "$TMP_FILE"
  done
  
  echo "Constructed CSV file contents:"
  cat "$TMP_FILE"
  echo
}

# Submit URLs to Google search engine
submit_to_search_engine() {
  echo "Submitting to Google via Indexing API..."
  "$EASYINDEX_CLI" google publish --csv "$TMP_FILE" -C "$TMP_DIR/credentials.json" || log_error "An error returned by easyindex-cli. Exiting."
  echo
}

# Main execution
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
