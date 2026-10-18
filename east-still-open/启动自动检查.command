#!/bin/zsh
cd "${0:A:h}"
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"
open "checks/latest.html" 2>/dev/null
node scripts/watch-checks.mjs
