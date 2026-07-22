#!/usr/bin/env bash
set -euo pipefail
shopt -s dotglob nullglob
for path in /app/* /app/.[!.]* /app/..?*; do
  rm -rf -- "$path"
done
cp -a /solution/app/. /app/
