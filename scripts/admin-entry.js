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

  // Password: prefer env var ADMIN_PASSWORD (GitHub Actions secret or
  // locally exported); fall back to config. A placeholder means unset.
  let password = process.env.ADMIN_PASSWORD || cfg.password || "";
  if (!password || password === "__ADMIN_PASSWORD__") return html;

  const passwordHash = sha256(password);

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

  // Inject password hash + analytics config onto <body> for admin.js.
  const an = this.config.analytics || {};
  const anJson =
    '{"provider":"' + (an.provider || "") +
    '","enabled":' + !!(an.enabled && an.websiteId) +
    ',"websiteId":"' + (an.websiteId || "") +
    '","apiBase":"' + (an.apiBase || "") + '"}';
  const bodyTag =
    `<body data-admin='{"hash":"${passwordHash}"}' data-analytics='${anJson}'>`;

  if (!/data-admin=/.test(out)) {
    out = out.replace("<body>", bodyTag);
  }

  return out;
});
