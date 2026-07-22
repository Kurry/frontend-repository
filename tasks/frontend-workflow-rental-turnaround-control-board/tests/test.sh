#!/bin/bash
set -e
cd "$(dirname "$0")/../solution/app"
npm run test:e2e
