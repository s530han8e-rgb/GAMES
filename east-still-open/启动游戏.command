#!/bin/zsh
setopt NO_BG_NICE
cd "${0:A:h}"
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"
if /usr/bin/curl --silent --fail http://127.0.0.1:5174/ >/dev/null; then
  open http://127.0.0.1:5174/
  exit 0
fi
npm run dev -- --port 5174 --strictPort &
game_service_pid=$!
trap 'kill "$game_service_pid" 2>/dev/null' EXIT INT TERM
for game_ready_attempt in {1..50}; do
  if /usr/bin/curl --silent --fail http://127.0.0.1:5174/ >/dev/null; then
    open http://127.0.0.1:5174/
    break
  fi
  sleep .1
done
wait "$game_service_pid"
