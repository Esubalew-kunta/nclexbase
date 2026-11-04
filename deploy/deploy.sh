#!/usr/bin/env bash
#
# Install one build of the site into public_html, and put the previous one back if the new one
# does not answer. Run by GitHub Actions (see .github/workflows/deploy.yml), which ships this
# script next to the build it is deploying — so the script is always the one that belongs to
# the code, and there is no stale copy on the server to drift.
#
#   deploy.sh install <tarball> <sha>   what CI runs
#   deploy.sh rollback                  what a person runs: back to the previous build
#   deploy.sh status                    what is live, and what could be rolled back to
#
# KEEP is the list of things in public_html that belong to the server, not to the build: the
# noindex rules, cPanel's own PHP files, the certificate challenge folder. A deploy replaces
# everything else and leaves those exactly as they are.
set -euo pipefail

ACTION=${1:-}
DOC=$HOME/public_html
REL=$HOME/releases
HEALTH_URL='https://nclexbase.com/'
HOST_IP=91.204.209.6   # the box itself; pinned so a slow DNS answer can never fail a deploy
KEEP=(.htaccess .user.ini php.ini .well-known cgi-bin)
HISTORY=$REL/web.history
KEEP_RELEASES=5

log() { printf '[%s] %s\n' "$(date +%H:%M:%S)" "$*"; }

healthy() {
  local body
  body=$(curl -fsS -k --max-time 25 --resolve "nclexbase.com:443:$HOST_IP" "$HEALTH_URL" 2>/dev/null) || return 1
  # A page that loads but is not ours (a host error page, an empty index) is not healthy.
  grep -q 'NCLEXBase' <<<"$body"
}

keep_this() {
  local name=$1
  for k in "${KEEP[@]}"; do [[ $name == "$k" ]] && return 0; done
  return 1
}

unpack() {
  # Unpacked next to the docroot first: a tarball that turns out to be empty or truncated is
  # then found before anything that is being served has been touched.
  #
  # Cleaned up by hand rather than with a RETURN trap: bash keeps such a trap for every later
  # function return too, and the second firing refers to a local that no longer exists.
  local tarball=$1 staging ok=0
  staging=$(mktemp -d "$HOME/apps/web-incoming.XXXXXX")

  if tar -xzf "$tarball" -C "$staging" && [[ -f $staging/index.html ]]; then
    for f in "$DOC"/* "$DOC"/.[!.]*; do
      [[ -e $f ]] || continue
      keep_this "$(basename "$f")" || rm -rf "$f"
    done
    cp -a "$staging"/. "$DOC"/
    # The whole site is meant to stay out of search engines; a deploy that lost that rule
    # would be worse than a deploy that failed.
    grep -q 'X-Robots-Tag' "$DOC/.htaccess" && ok=1
  else
    log "that tarball is not a site build (no index.html); refusing to publish it"
  fi

  rm -rf "$staging"
  [[ $ok == 1 ]]
}

install_release() {
  local tarball=$1 sha=${2:-unknown}
  [[ -f $tarball ]] || { log "no such build: $tarball"; exit 1; }
  mkdir -p "$REL"

  local previous=''
  [[ -f $HISTORY ]] && previous=$(head -1 "$HISTORY" || true)

  if unpack "$tarball" && healthy; then
    log "healthy: $sha is live"
    { echo "$tarball"; [[ -f $HISTORY ]] && grep -vxF "$tarball" "$HISTORY" || true; } > "$HISTORY.new"
    mv "$HISTORY.new" "$HISTORY"
    printf '%s %s %s\n' "$sha" "$(basename "$tarball")" "$(date -Is)" > "$REL/web.live"
    tail -n +$((KEEP_RELEASES + 1)) "$HISTORY" | xargs -r rm -f
    head -n "$KEEP_RELEASES" "$HISTORY" > "$HISTORY.new" && mv "$HISTORY.new" "$HISTORY"
    return 0
  fi

  log "the new build did not come up"
  if [[ -n $previous && -f $previous ]]; then
    log "putting $(basename "$previous") back"
    if unpack "$previous" && healthy; then
      log "rolled back; the site is serving the previous build"
    else
      log "ROLLBACK ALSO FAILED. The site may be down."
    fi
  else
    log "no previous build to go back to."
  fi
  exit 1
}

case $ACTION in
  install)
    install_release "${2:?tarball}" "${3:-unknown}"
    ;;
  rollback)
    [[ -f $HISTORY ]] || { log "nothing has been deployed by this script yet"; exit 1; }
    previous=$(sed -n 2p "$HISTORY" || true)
    [[ -n $previous && -f $previous ]] || { log "there is no previous build to go back to"; exit 1; }
    log "rolling back to $(basename "$previous")"
    install_release "$previous" "rollback-to-$(basename "$previous")"
    ;;
  status)
    echo "live:    $(cat "$REL/web.live" 2>/dev/null || echo 'unknown')"
    echo "history:"; sed 's|^|  |' "$HISTORY" 2>/dev/null || echo "  (none)"
    healthy && echo "health:  ok" || echo "health:  FAILING"
    ;;
  *)
    sed -n '2,15p' "$0" | sed 's|^# \?||'
    exit 1
    ;;
esac
