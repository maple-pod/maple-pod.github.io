#!/usr/bin/env sh

set -e

cd dist

git init
git add -A
git commit -m 'deploy'

git push -f https://github.com/maple-pod/maple-pod.github.io.git master:gh-pages

cd -
