#!/usr/bin/env bash
set -euo pipefail

echo "=== frozen install ==="
pnpm install --frozen-lockfile

echo "=== audit ==="
node --run audit

echo "=== clean ==="
node --run clean

echo "=== lint:commit ==="
node --run lint:commit

echo "=== lint:style ==="
node --run lint:style

echo "=== format ==="
node --run format

echo "=== knip ==="
# node --run knip

echo "=== sherif ==="
node --run sherif

echo "=== build:libs ==="
node --run build:libs

echo "=== lint:es ==="
node --run lint:es

echo "=== build ==="
node --run build

echo "=== test:unit ==="
node --run test:unit

echo "=== test:types ==="
node --run test:types

echo "=== test:e2e ==="
node --run test:e2e

echo "=== All checks passed ==="
