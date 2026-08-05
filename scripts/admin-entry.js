/**
 * Admin beacon + data injection.
 *
 * Injects into every rendered HTML page:
 *   1. A small script that records this browser's visit (path, time,
 *      date) into localStorage["adminVisits"] — used by the /admin/
 *      dashboard's local stats.
 *   2. The SHA-256 hash of the admin password on <body data-admin="...">,
 *      consumed by js/lib/admin.js for client-side auth. Only the hash is
 *      shipped to the client, never the plaintext.
 *
 * Follows the same after_render:html pattern as scripts/music-player.js.
 */

const crypto = require("crypto");

function sha256(str) {
  return crypto.createHash("sha256").update(str, "utf8").digest("hex");
}

hexo.extend.filter.register("after_render:html", function (html) {
  const cfg = this.config.admin || {};
  if (!cfg.enable) return html;
  if (!cfg.password) return html;

  const passwordHash = sha256(cfg.password);

  // Inject the beacon script before </body> (idempotent).
  const beacon = `
  <script>
    (function () {
      if (window.__adminBeaconInjected) return;
      window.__adminBeaconInjected = true;
      try {
        var visits = JSON.parse(localStorage.getItem("adminVisits") || "[]");
        var now = new Date();
        visits.push({
          path: location.pathname + location.search,
          time: now.toLocaleString(),
          date: now.toISOString().slice(0, 10)
        });
        if (visits.length > 500) visits = visits.slice(-500);
        localStorage.setItem("adminVisits", JSON.stringify(visits));
      } catch (e) {}
    })();
  </script>
</body>`;

  let out = html;
  if (!/__adminBeaconInjected/.test(out)) {
    out = out.replace("</body>", beacon);
  }

  // Inject the password hash + enable flag onto <body> for admin.js.
  if (!/data-admin=/.test(out)) {
    out = out.replace(
      "<body>",
      `<body data-admin='{"hash":"${passwordHash}"}'>`
    );
  }

  return out;
});
