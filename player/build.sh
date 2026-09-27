#!/usr/bin/env bash
# Rebuild index.html from the film source: bundle the film, then wrap it in the page and player.
set -euo pipefail
cd "$(dirname "$0")/.."
(cd film && npx esbuild src/hosts/artifact.ts --bundle --format=iife --minify --target=es2019 --outfile=../player/wind.js)
{ printf '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
  cat player/page.html; cat player/wind.js; printf '\n</script>\n<script>\n'; cat player/player.js; printf '</script>\n'; } > index.html
rm player/wind.js
echo "built index.html"
