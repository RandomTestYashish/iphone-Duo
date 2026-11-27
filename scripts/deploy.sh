#!/bin/bash
# Build the single-file prototype and publish it to GitHub Pages (gh-pages branch).
set -e
cd "$(dirname "$0")/.."
npx tsc -b && npx vite build --mode single
T=$(mktemp -d)
cp dist-single/index.html "$T/index.html" && touch "$T/.nojekyll"
cd "$T" && git init -q -b gh-pages && git add -A && git commit -qm "Deploy prototype" && git push -f https://github.com/RandomTestYashish/iphone-Duo.git gh-pages
echo "Live: https://randomtestyashish.github.io/iphone-Duo/"
