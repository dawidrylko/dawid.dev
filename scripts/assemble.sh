#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

tag=$(sed -n 's/^tag=//p' .quartz-version)
sha=$(sed -n 's/^sha=//p' .quartz-version)
if [[ -z "$tag" || -z "$sha" ]]; then
  echo "error: .quartz-version must define tag=<quartz tag> and sha=<commit sha>" >&2
  exit 1
fi

dist=".quartz-dist"
cache="$dist/$sha"
manifest="$dist/materialized.txt"
tracked="$dist/tracked.txt"

if [[ ! -d "$cache" ]]; then
  mkdir -p "$dist"
  echo "downloading quartz $tag ($sha)"
  curl -fsSL "https://github.com/jackyzha0/quartz/archive/$sha.tar.gz" -o "$dist/quartz.tar.gz"
  tar -xzf "$dist/quartz.tar.gz" -C "$dist"
  mv "$dist/quartz-$sha" "$cache"
  rm -f "$dist/quartz.tar.gz"
fi

git ls-files > "$tracked"
if [[ ! -s "$tracked" ]]; then
  echo "error: no tracked files found — run from the site repo (stage files before the first assemble)" >&2
  exit 1
fi

# remove files materialized by a previous assemble; handles version bumps and upstream deletions
if [[ -f "$manifest" ]]; then
  while IFS= read -r f; do
    [[ -f "$f" ]] && rm -f "$f"
  done < "$manifest"
fi

# copy upstream files into the working tree; paths owned by this repo (tracked) always win
: > "$manifest"
(cd "$cache" && find . -type f \
  ! -path "./.github/*" \
  ! -path "./docs/*" \
  ! -path "./content/*" \
  ! -name ".gitignore" \
  ! -name ".gitattributes" \
  ! -name "README.md" \
  ! -name "LICENSE.txt" \
  ! -name "CODE_OF_CONDUCT.md" \
  ! -name "Dockerfile" \
  ! -name ".dockerignore" \
  | sed 's|^\./||' | sort) | while IFS= read -r f; do
  if ! grep -qxF "$f" "$tracked"; then
    mkdir -p "$(dirname "$f")"
    cp "$cache/$f" "$f"
    echo "$f" >> "$manifest"
  fi
done

# keep git status clean without polluting .gitignore (quartz's build globs honor .gitignore)
exclude_file=$(git rev-parse --git-path info/exclude)
{
  echo "# managed by scripts/assemble.sh — materialized upstream quartz files"
  sed 's|^|/|' "$manifest"
} > "$exclude_file"

echo "assembled quartz $tag ($(wc -l < "$manifest" | tr -d ' ') files materialized)"
