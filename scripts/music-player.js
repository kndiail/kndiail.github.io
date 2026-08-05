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
.aplayer.aplayer-fixed {
  right: 18px;
  bottom: 18px;
  max-width: 340px;
  border-radius: 16px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.88) !important;
  backdrop-filter: blur(16px) saturate(1.3);
  -webkit-backdrop-filter: blur(16px) saturate(1.3);
  box-shadow: 0 12px 40px rgba(60, 64, 90, 0.18), 0 2px 10px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.75);
  z-index: 99;
}
.aplayer.aplayer-fixed .aplayer-body {
  background: transparent !important;
}
.aplayer.aplayer-fixed .aplayer-pic {
  border-radius: 15px 0 0 15px;
}

/* Info / titles */
.aplayer.aplayer-fixed .aplayer-info {
  padding: 12px 16px 10px 14px;
}
.aplayer.aplayer-fixed .aplayer-info .aplayer-music {
  margin-bottom: 6px;
}
.aplayer.aplayer-fixed .aplayer-info .aplayer-music .aplayer-title {
  font-weight: 600;
  color: #3a3f58;
}
.aplayer.aplayer-fixed .aplayer-info .aplayer-music .aplayer-author {
  color: #9aa0b5;
  font-size: 12px;
}

/* Progress bar */
.aplayer .aplayer-info .aplayer-controller .aplayer-bar-wrap {
  margin: 8px 0;
}
.aplayer .aplayer-info .aplayer-controller .aplayer-bar-wrap .aplayer-bar .aplayer-loaded {
  background: rgba(180, 188, 210, 0.45) !important;
}
.aplayer .aplayer-info .aplayer-controller .aplayer-bar-wrap .aplayer-bar .aplayer-played {
  background: linear-gradient(90deg, #fbc2eb 0%, #a6c1ee 100%) !important;
}
.aplayer .aplayer-info .aplayer-controller .aplayer-bar-wrap .aplayer-bar .aplayer-played .aplayer-thumb {
  background: #b78fce !important;
  border-color: #fff !important;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
}

/* Control buttons */
.aplayer .aplayer-info .aplayer-controller .aplayer-icon {
  color: #5a5f78;
}
.aplayer .aplayer-info .aplayer-controller .aplayer-icon:hover {
  color: #b78fce;
}
.aplayer .aplayer-info .aplayer-controller .aplayer-icon-play,
.aplayer .aplayer-info .aplayer-controller .aplayer-icon-pause {
  color: #8a6bb0;
}

/* Volume */
.aplayer .aplayer-info .aplayer-controller .aplayer-volume-wrap .aplayer-volume-bar-wrap .aplayer-volume-bar {
  background: #e4e7f0;
}
.aplayer .aplayer-info .aplayer-controller .aplayer-volume-wrap .aplayer-volume-bar-wrap .aplayer-volume-bar .aplayer-volume {
  background: linear-gradient(180deg, #fbc2eb, #a6c1ee) !important;
}

/* Playlist */
.aplayer .aplayer-list {
  border: none;
}
.aplayer .aplayer-list ol li {
  border-top: 1px solid #f2f3f8;
  color: #5a5f78;
}
.aplayer .aplayer-list ol li:hover {
  background: rgba(246, 247, 252, 0.85);
}
.aplayer .aplayer-list ol li.aplayer-list-light {
  background: rgba(240, 235, 250, 0.55);
}
.aplayer .aplayer-list ol li.aplayer-list-light .aplayer-list-title {
  color: #8a6bb0;
}
.aplayer .aplayer-list ol li .aplayer-list-index {
  color: #b4b8ca;
}

/* Narrow (collapsed) mini button */
.aplayer.aplayer-fixed.aplayer-narrow .aplayer-body {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(135deg, #a18cd1, #fbc2eb) !important;
  box-shadow: 0 6px 20px rgba(138, 107, 176, 0.35);
}
.aplayer.aplayer-fixed.aplayer-narrow .aplayer-pic {
  width: 54px;
  height: 54px;
  border-radius: 50%;
}
.aplayer.aplayer-fixed.aplayer-narrow .aplayer-pic .aplayer-icon {
  font-size: 20px;
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

      /* --- continuous playback across tab switches --- */
      var wasPlaying = false;
      document.addEventListener('visibilitychange', function () {
        var el = document.querySelector('meting-js');
        var ap = el && el.aplayer ? el.aplayer : null;
        if (!ap || !ap.audio) return;
        if (document.visibilityState === 'hidden') {
          wasPlaying = !ap.audio.paused && !ap.audio.ended;
        } else if (document.visibilityState === 'visible' && wasPlaying && ap.audio.paused && !ap.audio.ended) {
          ap.play().catch(function () {});
        }
      });
    })();
  </script>
</body>`;

  out = out.replace("</body>", "  " + meting + "\n" + runtimeScript);

  return out;
});
