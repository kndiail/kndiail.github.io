/**
 * Music Player Injector
 *
 * Adds a global floating APlayer (with Meting.js) to every page.
 * The playlist is pulled from a Meting-compatible API (netease by default).
 *
 * Autoplay note: modern browsers block audio without user interaction.
 * The player therefore starts only after the user's first click anywhere
 * on the page, then plays the playlist automatically.
 *
 * Continuous playback: browsers throttle/pause audio for hidden tabs.
 * When the tab becomes visible again we resume playback automatically,
 * unless the user deliberately paused via the player controls.
 *
 * Config (site _config.yml):
 *   music:
 *     enable: true
 *     playlistId: 18220651517    # netease playlist id
 *     server: netease
 *     api: ...                   # Meting API template
 *     fixed: true                # floating bottom-right player
 *     volume: 0.7
 */

const PLAYER_CSS = `
/* ===== Music player beautification ===== */
/* Colors are tokenized (--mp-*) so dark mode can override them via
   html[data-theme="dark"] on :root/documentElement without touching
   this injected stylesheet. Light defaults equal the original values. */
.aplayer.aplayer-fixed {
  overflow: visible;
  border-radius: 16px;
  z-index: 99;
}
.aplayer.aplayer-fixed .aplayer-body {
  right: auto !important;
  left: 18px !important;
  bottom: 18px !important;
  max-width: 340px;
  border-radius: 16px;
  overflow: visible;
  border: none;
  background: var(--mp-body-bg, rgba(255, 255, 255, 0.88)) !important;
  backdrop-filter: blur(16px) saturate(1.3);
  -webkit-backdrop-filter: blur(16px) saturate(1.3);
  box-shadow: 0 0 0 1px var(--mp-body-border, rgba(255, 255, 255, 0.75)), 0 12px 40px var(--mp-shadow, rgba(60, 64, 90, 0.18)), 0 2px 10px rgba(0, 0, 0, 0.08);
}
.aplayer.aplayer-fixed .aplayer-pic {
  border-radius: 15px 0 0 15px;
}
.aplayer.aplayer-fixed .aplayer-info {
  padding: 12px 16px 10px 14px;
}
.aplayer.aplayer-fixed .aplayer-info .aplayer-music {
  margin-bottom: 6px;
}
.aplayer.aplayer-fixed .aplayer-info .aplayer-music .aplayer-title {
  font-weight: 600;
  color: var(--mp-title, #3a3f58);
}
.aplayer.aplayer-fixed .aplayer-info .aplayer-music .aplayer-author {
  color: var(--mp-author, #9aa0b5);
  font-size: 12px;
}
.aplayer .aplayer-info .aplayer-controller .aplayer-bar-wrap {
  margin: 8px 0;
}
.aplayer .aplayer-info .aplayer-controller .aplayer-bar-wrap .aplayer-bar .aplayer-loaded {
  background: var(--mp-loaded, rgba(180, 188, 210, 0.45)) !important;
}
.aplayer .aplayer-info .aplayer-controller .aplayer-bar-wrap .aplayer-bar .aplayer-played {
  background: linear-gradient(90deg, #fbc2eb 0%, #a6c1ee 100%) !important;
}
.aplayer .aplayer-info .aplayer-controller .aplayer-bar-wrap .aplayer-bar .aplayer-played .aplayer-thumb {
  background: var(--mp-thumb, #b78fce) !important;
  border-color: var(--mp-thumb-border, #fff) !important;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
}
.aplayer .aplayer-info .aplayer-controller .aplayer-icon {
  color: var(--mp-icon, #5a5f78);
}
.aplayer .aplayer-info .aplayer-controller .aplayer-icon:hover {
  color: var(--mp-icon-hover, #b78fce);
}
.aplayer .aplayer-info .aplayer-controller .aplayer-icon-play,
.aplayer .aplayer-info .aplayer-controller .aplayer-icon-pause {
  color: var(--mp-accent, #8a6bb0);
}
.aplayer .aplayer-info .aplayer-controller .aplayer-volume-wrap .aplayer-volume-bar-wrap .aplayer-volume-bar {
  background: var(--mp-vol-bg, #e4e7f0);
}
.aplayer .aplayer-info .aplayer-controller .aplayer-volume-wrap .aplayer-volume-bar-wrap .aplayer-volume-bar .aplayer-volume {
  background: linear-gradient(180deg, #fbc2eb, #a6c1ee) !important;
}
.aplayer .aplayer-list {
  border: none;
}
.aplayer .aplayer-list ol li {
  border-top: 1px solid var(--mp-list-border, #f2f3f8);
  color: var(--mp-list-text, #5a5f78);
}
.aplayer .aplayer-list ol li:hover {
  background: var(--mp-list-hover, rgba(246, 247, 252, 0.85));
}
.aplayer .aplayer-list ol li.aplayer-list-light {
  background: var(--mp-list-light, rgba(240, 235, 250, 0.55));
}
.aplayer .aplayer-list ol li.aplayer-list-light .aplayer-list-title {
  color: var(--mp-accent, #8a6bb0);
}
.aplayer .aplayer-list ol li .aplayer-list-index {
  color: var(--mp-list-index, #b4b8ca);
}
.aplayer.aplayer-fixed.aplayer-narrow .aplayer-body {
  border-radius: 50%;
  background: linear-gradient(135deg, #a18cd1, #fbc2eb) !important;
  box-shadow: 0 6px 20px rgba(138, 107, 176, 0.35);
}
.aplayer.aplayer-fixed.aplayer-narrow .aplayer-pic {
  border-radius: 50%;
}
html[data-theme="dark"] {
  --mp-body-bg: rgba(24, 26, 32, 0.88);
  --mp-body-border: rgba(255, 255, 255, 0.08);
  --mp-shadow: rgba(0, 0, 0, 0.5);
  --mp-title: #e6eaf2;
  --mp-author: #8a93a6;
  --mp-loaded: rgba(100, 108, 128, 0.45);
  --mp-thumb: #b78fce;
  --mp-thumb-border: #2c313a;
  --mp-icon: #aab2c0;
  --mp-icon-hover: #c9b2e0;
  --mp-accent: #b78fce;
  --mp-vol-bg: #3a3f4a;
  --mp-list-border: #2c313a;
  --mp-list-text: #aab2c0;
  --mp-list-hover: rgba(40, 44, 54, 0.85);
  --mp-list-light: rgba(48, 52, 64, 0.6);
  --mp-list-index: #6b7280;
}
`;

hexo.extend.filter.register("after_render:html", function (html) {
  const cfg = (this.config.music) || {};
  if (!cfg.enable) return html;
  if (!cfg.playlistId) return html;

  const server = cfg.server || "netease";
  const api =
    cfg.api ||
    "https://api.injahow.cn/meting/?server=:server&type=:type&id=:id&r=:r";
  const fixed = cfg.fixed !== false;
  const volume = typeof cfg.volume === "number" ? cfg.volume : 0.7;

  const opts = {
    server: JSON.stringify(server),
    type: '"playlist"',
    id: JSON.stringify(String(cfg.playlistId)),
    api: JSON.stringify(api),
    fixed: fixed ? "true" : "false",
    // autoplay is handled by the injected first-click logic below.
    // Keep the meting-js attribute false to avoid the browser rejecting
    // a play() on load (which would also log a console error).
    autoplay: "false",
    theme: "'#a6c1ee'",
    order: "'list'",
    preload: "'auto'",
    volume: JSON.stringify(volume),
  };

  const meting = `<meting-js ${Object.entries(opts)
    .map(([k, v]) => `${k}=${v}`)
    .join(" ")} list-folded></meting-js>`;

  const html_ = html;

  // Inject APlayer CSS + beautification into <head>
  let out = html_;
  if (!/<link[^>]*APlayer\.min\.css/.test(out)) {
    out = out.replace(
      "</head>",
      '  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/aplayer@1.10.1/dist/APlayer.min.css" />\n</head>'
    );
  }
  if (!/<style[^>]*>[\s\S]*\.aplayer\.aplayer-fixed/.test(out)) {
    out = out.replace(
      "</head>",
      `  <style>${PLAYER_CSS}</style>\n</head>`
    );
  }

  // Inject APlayer + Meting scripts before </body>
  if (!/<script[^>]*APlayer\.min\.js/.test(out)) {
    out = out.replace(
      "</body>",
      '  <script src="https://cdn.jsdelivr.net/npm/aplayer@1.10.1/dist/APlayer.min.js"></script>\n' +
        '  <script src="https://cdn.jsdelivr.net/npm/meting@2.0.1/dist/Meting.min.js"></script>\n' +
        "</body>"
    );
  }

  // Inject the player element + runtime logic before </body>
  const runtimeScript = `
  <script>
    (function () {
      if (window.__musicPlayerInjected) return;
      window.__musicPlayerInjected = true;

      /* --- start playback on first user interaction --- */
      var started = false;
      var pending = false;
      function tryPlay() {
        if (started || pending) return;
        var el = document.querySelector('meting-js');
        if (!el || !el.aplayer) { setTimeout(tryPlay, 400); return; }
        var ap = el.aplayer;
        var audios = ap.list && ap.list.audios;
        if (!audios || !audios.length) { setTimeout(tryPlay, 400); return; }
        pending = true;
        var p;
        try { p = ap.play(); } catch (e) { p = Promise.reject(e); }
        Promise.resolve(p).then(function () {
          started = true; pending = false;
          window.__musicEverStarted = true;
        }, function () {
          pending = false;
          setTimeout(tryPlay, 600);
        });
      }
      function onFirstInteraction() {
        if (started) {
          ['click', 'pointerdown', 'keydown', 'touchstart'].forEach(function (evt) {
            document.removeEventListener(evt, onFirstInteraction);
          });
          return;
        }
        tryPlay();
      }
      ['click', 'pointerdown', 'keydown', 'touchstart'].forEach(function (evt) {
        document.addEventListener(evt, onFirstInteraction);
      });

      /* --- keep music playing across in-site page navigation --- */
      /* The theme navigates between pages with normal <a> links, so
         every page visit reloads the page and rebuilds the player,
         which resets playback to the first song from the start.
         To keep music playing continuously across these navigations we
         save the current song index + progress + playing state to
         sessionStorage before the page unloads, then restore it once
         the next page's player is ready. */
      var STORAGE_KEY = 'musicPlayerState';
      var pageFromStorage = (function () {
        try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY)); }
        catch (e) { return null; }
      })();

      function savePlayerState() {
        var el = document.querySelector('meting-js');
        var ap = el && el.aplayer ? el.aplayer : null;
        if (!ap || !ap.audio) return;
        try {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
            index: ap.list && ap.list.index !== undefined ? ap.list.index : 0,
            currentTime: ap.audio.currentTime || 0,
            /* hasStarted: has the user ever started playback? Once true,
               we keep resuming across navigations. We deliberately do NOT
               trust the paused flag at unload time — during navigation the
               audio is often already paused by the browser, so checking
               paused there would wrongly record "user stopped". */
            hasStarted: window.__musicEverStarted || !ap.audio.paused || ap.audio.currentTime > 0,
            ts: Date.now()
          }));
        } catch (e) {}
      }

      /* Save state on unload (page navigation / refresh). */
      window.addEventListener('beforeunload', savePlayerState);
      /* Also save periodically so a crash doesn't lose the position. */
      setInterval(savePlayerState, 5000);

      /* Restore state once the player + playlist are ready. */
      var restorePending = pageFromStorage ? true : false;
      function tryRestore() {
        if (!restorePending) return;
        var el = document.querySelector('meting-js');
        var ap = el && el.aplayer ? el.aplayer : null;
        if (!ap || !ap.list || !ap.list.audios || !ap.list.audios.length) {
          setTimeout(tryRestore, 400);
          return;
        }
        restorePending = false;
        var st = pageFromStorage;
        var idx = st && typeof st.index === 'number' ? st.index : 0;
        var time = st && typeof st.currentTime === 'number' ? st.currentTime : 0;
        var shouldPlay = st && st.hasStarted;
        /* Clamp index to playlist length. */
        idx = Math.max(0, Math.min(idx, ap.list.audios.length - 1));
        try {
          if (ap.list.index !== idx) ap.list.switch(idx);
        } catch (e) {}
        /* APlayer loads audio asynchronously; seek once it can. */
        function doSeek() {
          if (ap.audio && !isNaN(ap.audio.duration) && ap.audio.duration > 0) {
            try { ap.seek(Math.min(time, ap.audio.duration - 0.5)); } catch (e) {}
          } else {
            setTimeout(doSeek, 300);
          }
        }
        setTimeout(doSeek, 300);
        /* Resume if it was playing (user gesture required, so hook into
           the first-interaction handler). We optimistically try to play
           right away too — if the browser allows it (e.g. after a link
           click the gesture may still be valid), it starts immediately;
           otherwise it starts on the next user interaction. */
        if (shouldPlay) {
          var resume = function () {
            window.__musicEverStarted = true;
            try { ap.play().catch(function () {}); } catch (e) {}
          };
          setTimeout(resume, 500);
          /* Wait for first user interaction to satisfy autoplay policy. */
          document.addEventListener('pointerdown', resume, { once: true });
          document.addEventListener('click', resume, { once: true });
          document.addEventListener('keydown', resume, { once: true });
          document.addEventListener('touchstart', resume, { once: true });
        }
      }
      tryRestore();

      /* --- fix APlayer fixed-mode body width ---
         APlayer writes body.style.width = offsetWidth - 18 on init,
         which can squash the info panel. Clear it so the body uses its
         natural content width; the miniswitcher margin is handled by
         APlayer's own CSS. */
      function fixBodyWidth() {
        var el = document.querySelector('meting-js');
        if (!el || !el.aplayer) { setTimeout(fixBodyWidth, 500); return; }
        var body = el.aplayer.template && el.aplayer.template.body;
        if (body && body.style && body.style.width) body.style.width = '';
      }
      fixBodyWidth();
    })();
  </script>
</body>`;

  out = out.replace("</body>", "  " + meting + "\n" + runtimeScript);

  return out;
});
