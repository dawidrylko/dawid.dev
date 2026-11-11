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

mermaid_version=$(sed -n 's/^version=//p' .mermaid-version)
mermaid_integrity=$(sed -n 's/^integrity=//p' .mermaid-version)
if [[ -z "$mermaid_version" || -z "$mermaid_integrity" ]]; then
  echo "error: .mermaid-version must define version=<mermaid version> and integrity=<npm sha512 integrity>" >&2
  exit 1
fi

mermaid_cache="$dist/mermaid-$mermaid_version"
if [[ ! -f "$mermaid_cache/.integrity" || "$(cat "$mermaid_cache/.integrity")" != "$mermaid_integrity" ]]; then
  rm -rf "$mermaid_cache" "$dist/mermaid-unpack" "$dist/mermaid-staging"
  mkdir -p "$dist"
  echo "downloading mermaid $mermaid_version"
  curl -fsSL "https://registry.npmjs.org/mermaid/-/mermaid-$mermaid_version.tgz" -o "$dist/mermaid.tgz"
  actual="sha512-$(openssl dgst -sha512 -binary "$dist/mermaid.tgz" | base64 | tr -d '\n')"
  if [[ "$actual" != "$mermaid_integrity" ]]; then
    rm -f "$dist/mermaid.tgz"
    echo "error: mermaid $mermaid_version integrity mismatch: expected $mermaid_integrity, got $actual" >&2
    exit 1
  fi
  mkdir -p "$dist/mermaid-unpack" "$dist/mermaid-staging/chunks/mermaid.esm.min"
  tar -xzf "$dist/mermaid.tgz" -C "$dist/mermaid-unpack"
  cp "$dist/mermaid-unpack/package/dist/mermaid.esm.min.mjs" "$dist/mermaid-staging/"
  cp "$dist/mermaid-unpack/package/dist/chunks/mermaid.esm.min/"*.mjs "$dist/mermaid-staging/chunks/mermaid.esm.min/"
  printf '%s' "$mermaid_integrity" > "$dist/mermaid-staging/.integrity"
  mv "$dist/mermaid-staging" "$mermaid_cache"
  rm -rf "$dist/mermaid-unpack" "$dist/mermaid.tgz"
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

mermaid_static="quartz/static/mermaid"
(cd "$mermaid_cache" && find . -type f -name '*.mjs' | sed 's|^\./||' | sort) | while IFS= read -r f; do
  mkdir -p "$(dirname "$mermaid_static/$f")"
  cp "$mermaid_cache/$f" "$mermaid_static/$f"
  echo "$mermaid_static/$f" >> "$manifest"
done

# keep git status clean without polluting .gitignore (quartz's build globs honor .gitignore)
exclude_file=$(git rev-parse --git-path info/exclude)
{
  echo "# managed by scripts/assemble.sh — materialized upstream quartz files"
  sed 's|^|/|' "$manifest"
} > "$exclude_file"

echo "assembled quartz $tag ($(wc -l < "$manifest" | tr -d ' ') files materialized)"
