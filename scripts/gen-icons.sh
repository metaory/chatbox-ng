#!/bin/bash
# Usage: scripts/gen-icons.sh backup | <image>
set -euo pipefail

usage="usage: $0 backup | <image>"
arg=${1:?$usage}

slots=$(
  cat <<'MAP'
assets/icon.png|1024
assets/icon-raw.png|1024
assets/icons/16x16.png|16
assets/icons/24x24.png|24
assets/icons/32x32.png|32
assets/icons/48x48.png|48
assets/icons/64x64.png|64
assets/icons/96x96.png|96
assets/icons/128x128.png|128
assets/icons/256x256.png|256
assets/icons/512x512.png|512
assets/icons/1024x1024.png|1024
assets/iconTemplate.png|16|gray
assets/iconTemplate@2x.png|64|gray
assets/iconTemplateRaw.png|512
assets/iconTemplateRawPreview.png|512|gray
src/renderer/static/icon.png|1024
src/renderer/static/favicon.png|32
src/renderer/logo192.png|192
icons/512x512.png|512
icons/icon-48.webp|48
icons/icon-72.webp|72
icons/icon-96.webp|96
icons/icon-128.webp|128
icons/icon-192.webp|192
icons/icon-256.webp|256
icons/icon-512.webp|512
resources/icon-only.png|1024
resources/icon-foreground.png|1024
resources/icon-background.png|1024
resources/splash.png|2732
resources/splash-dark.png|2732
doc/statics/icon.png|256
assets/icon.ico|256,128,64,48,32,16|ico
src/renderer/favicon.ico|48,32,16|ico
assets/icon.icns|16,32,48,128,256,512,1024|icns
assets/icon.svg||svg
MAP
)

root=$(cd "$(dirname "$0")/.." && pwd)

[[ $arg == backup ]] && {
  cd "$root"
  bak=tmp/icons/$(date +%Y%m%d-%H%M%S)
  mkdir -p "$bak"
  while IFS='|' read -r dest _; do
    [[ $dest && -f $dest ]] || continue
    cp --parents -a "$dest" "$bak"
    echo "  $dest"
  done <<<"$slots"
  echo "$bak"
  exit 0
}

src=$(realpath "$arg")
[[ -f $src ]] || {
  echo "missing: $arg" >&2
  exit 1
}
cd "$root"
for c in magick png2icns; do
  command -v "$c" >/dev/null || {
    echo "need $c" >&2
    exit 1
  }
done

raster() {
  local dest=$1 size=$2 mode=${3:-}
  mkdir -p "$(dirname "$dest")"
  [[ $mode == svg ]] && {
    [[ ${src##*.} == [sS][vV][gG] ]] && cp "$src" "$dest" && echo "  $dest"
    return
  }
  [[ $mode == ico ]] && {
    magick "$src" -background none -define icon:auto-resize="$size" "$dest"
    echo "  $dest $size"
    return
  }
  [[ $mode == icns ]] && {
    local pngs=() s
    IFS=, read -ra ss <<<"$size"
    for s in "${ss[@]}"; do pngs+=("assets/icons/${s}x${s}.png"); done
    png2icns "$dest" "${pngs[@]}"
    echo "  $dest $size"
    return
  }
  local args=("$src" -background none -gravity center)
  [[ $mode == gray ]] && args+=(-colorspace gray)
  args+=(-resize "${size}x${size}" -extent "${size}x${size}" "$dest")
  magick "${args[@]}"
  echo "  $dest ${size}x${size}"
}

while IFS='|' read -r dest size mode; do
  [[ $dest ]] || continue
  raster "$dest" "$size" "$mode"
done <<<"$slots"

echo 'done'
