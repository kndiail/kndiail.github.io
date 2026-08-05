/**
 * Analytics (Umami) injector.
 *
 * Injects the Umami tracking script into every rendered HTML page when
 * analytics.enabled is true. Follows the after_render:html pattern from
 * music-player.js / admin-entry.js.
 */

hexo.extend.filter.register("after_render:html", function (html) {
  const cfg = this.config.analytics || {};
  if (!cfg.enabled) return html;
  if (cfg.provider !== "umami") return html;
  if (!cfg.websiteId) return html;

  const host = cfg.host || "https://cloud.umami.is";
  const scriptSrc = host + "/script.js";

  const umamiTag =
    '  <script async src="' +
    scriptSrc +
    '" data-website-id="' +
    cfg.websiteId +
    '"></script>\n';

  let out = html;
  if (!/data-website-id/.test(out)) {
    out = out.replace("</head>", umamiTag + "</head>");
  }
  return out;
});
