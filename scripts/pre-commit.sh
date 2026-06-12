#!/usr/bin/env bash
# Pre-commit hook: runs build + tests for api and web.
# Only checks a package when staged files touch it.
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
STAGED=$(git diff --cached --name-only --diff-filter=ACMRT)

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() { echo -e "${GREEN}✔ $1${NC}"; }
fail() { echo -e "${RED}✖ $1${NC}"; }
info() { echo -e "${YELLOW}▸ $1${NC}"; }

check_types_placement() {
  local pkg="$1"
  local dir="$ROOT/$pkg"
  local pkg_json="$dir/package.json"

  # @types/* packages that are legitimately dev-only (never needed by tsc for src/)
  local DEV_ONLY='["@types/jest","@types/node","@types/mocha","@types/chai","@types/supertest"]'

  local dev_types
  dev_types=$(node -e "
    const p = require('$pkg_json');
    const devOnly = new Set($DEV_ONLY);
    const flagged = Object.keys(p.devDependencies || {})
      .filter(d => d.startsWith('@types/') && !devOnly.has(d));
    if (flagged.length) process.stdout.write(flagged.join('\n') + '\n');
  " 2>/dev/null)

  if [ -n "$dev_types" ]; then
    fail "[$pkg] These @types/* packages are in devDependencies but may be needed at build time:"
    while IFS= read -r t; do
      echo "       - $t"
    done <<< "$dev_types"
    echo "  Move them to 'dependencies' so production builds (NODE_ENV=production) can find them."
    return 1
  fi

  pass "[$pkg] @types placement OK."
}

run_checks() {
  local pkg="$1"   # "api" or "web"
  local dir="$ROOT/$pkg"

  info "[$pkg] Checking staged changes..."

  info "[$pkg] Checking @types/* placement..."
  if ! check_types_placement "$pkg"; then
    return 1
  fi

  info "[$pkg] Building..."
  if ! npm run build --prefix "$dir" 2>&1; then
    fail "[$pkg] Build failed. Fix errors before committing."
    return 1
  fi
  pass "[$pkg] Build passed."

  info "[$pkg] Running tests..."
  if ! npm test --prefix "$dir" 2>&1; then
    fail "[$pkg] Tests failed. Fix failing tests before committing."
    return 1
  fi
  pass "[$pkg] Tests passed."
}

ERRORS=0

if echo "$STAGED" | grep -q "^api/"; then
  run_checks "api" || ERRORS=$((ERRORS + 1))
fi

if echo "$STAGED" | grep -q "^web/"; then
  run_checks "web" || ERRORS=$((ERRORS + 1))
fi

if [ "$ERRORS" -gt 0 ]; then
  echo ""
  fail "Pre-commit checks failed. Commit aborted."
  echo "  To skip (not recommended): git commit --no-verify"
  exit 1
fi

echo ""
pass "All pre-commit checks passed."
exit 0
