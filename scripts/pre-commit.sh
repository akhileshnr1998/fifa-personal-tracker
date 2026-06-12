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

run_checks() {
  local pkg="$1"   # "api" or "web"
  local dir="$ROOT/$pkg"

  info "[$pkg] Checking staged changes..."

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
