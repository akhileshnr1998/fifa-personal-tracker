#!/usr/bin/env bash
# Run once after cloning to install the project's git hooks.
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
HOOKS_DIR="$ROOT/.git/hooks"
SCRIPTS_DIR="$ROOT/scripts"

install_hook() {
  local name="$1"
  local src="$SCRIPTS_DIR/$name.sh"
  local dest="$HOOKS_DIR/$name"

  if [ ! -f "$src" ]; then
    echo "Hook script not found: $src"
    exit 1
  fi

  ln -sf "$src" "$dest"
  chmod +x "$src"
  echo "✔ Installed $name -> $dest"
}

install_hook "pre-commit"

echo ""
echo "Git hooks installed. Run 'git commit' to verify."
