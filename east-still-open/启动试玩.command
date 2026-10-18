#!/bin/zsh
cd "${0:A:h}"
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"
game_machine_arch="$(uname -m)"
game_runtime="$PWD/runtime/darwin-$game_machine_arch/node"
if [[ "$game_machine_arch" == "x86_64" ]]; then
  game_runtime="$PWD/runtime/darwin-x64/node"
fi
if [[ -x "$game_runtime" ]]; then
  exec "$game_runtime" scripts/serve-demo.mjs
fi
if ! command -v node >/dev/null; then
  print '此电脑缺少本地启动所需的 Node.js。请把这条提示发给制作方，不需要写代码。'
  read '?按回车关闭。'
  exit 1
fi
node scripts/serve-demo.mjs
