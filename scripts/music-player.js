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
 * Config (site _config.yml):
 *   music:
 *     enable: true
 *     playlistId: 60198            # netease playlist id
 *     server: netease
 *     api: https://api.injahow.cn/meting/   # Meting-compatible API endpoint
 *     autoplay: true               # start playing after first user click
 *     fixed: true                  # floating bottom-right player
 *     volume: 0.7
 */

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
    theme: "'#66afef'",
    order: "'list'",
    preload: "'auto'",
    volume: JSON.stringify(volume),
  };

  const meting = `<meting-js ${Object.entries(opts)
    .map(([k, v]) => `${k}=${v}`)
    .join(" ")} list-folded></meting-js>`;

  const html_ = html;

  // Inject CSS into <head> if APlayer stylesheet not present yet
  let out = html_;
  if (!/<link[^>]*APlayer\.min\.css/.test(out)) {
    out = out.replace(
      "</head>",
      '  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/aplayer@1.10.1/dist/APlayer.min.css" />\n</head>'
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

  // Inject the player element + autoplay-on-first-click logic before </body>
  const playerHtml =
    '  ' +
    meting +
    "\n" +
    "  <script>\n" +
    "    (function () {\n" +
    "      if (window.__musicPlayerInjected) return;\n" +
    "      window.__musicPlayerInjected = true;\n" +
    "      var started = false;\n" +
    "      var pending = false;\n" +
    "      function tryPlay() {\n" +
    "        if (started || pending) return;\n" +
    "        var el = document.querySelector('meting-js');\n" +
    "        if (!el || !el.aplayer) { setTimeout(tryPlay, 400); return; }\n" +
    "        var ap = el.aplayer;\n" +
    "        var audios = ap.list && ap.list.audios;\n" +
    "        if (!audios || !audios.length) { setTimeout(tryPlay, 400); return; }\n" +
    "        pending = true;\n" +
    "        var p;\n" +
    "        try { p = ap.play(); } catch (e) { p = Promise.reject(e); }\n" +
    "        Promise.resolve(p).then(function () {\n" +
    "          started = true; pending = false;\n" +
    "        }, function () {\n" +
    "          pending = false;\n" +
    "          setTimeout(tryPlay, 600);\n" +
    "        });\n" +
    "      }\n" +
    "      function onFirstInteraction() {\n" +
    "        if (started) {\n" +
    "          ['click', 'pointerdown', 'keydown', 'touchstart'].forEach(function (evt) {\n" +
    "            document.removeEventListener(evt, onFirstInteraction);\n" +
    "          });\n" +
    "          return;\n" +
    "        }\n" +
    "        tryPlay();\n" +
    "      }\n" +
    "      ['click', 'pointerdown', 'keydown', 'touchstart'].forEach(function (evt) {\n" +
    "        document.addEventListener(evt, onFirstInteraction);\n" +
    "      });\n" +
    "    })();\n" +
    "  </script>\n" +
    "</body>";

  out = out.replace("</body>", playerHtml);

  return out;
});
