#!/bin/bash
set -e
cd "$(dirname "$0")/app"
npm install
npm run build
