/**
 * Theme switcher: light / dark / system
 * - Sets document.documentElement.dataset.theme to "light" | "dark"
 * - Persists choice to localStorage["theme"]
 * - system = follow prefers-color-scheme, live via matchMedia listener
 */

(function () {
  "use strict";

  function resolveTheme(mode) {
    if (mode === "light" || mode === "dark") return mode;
    // system
    try {
      return window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    } catch (e) {
      return "light";
    }
  }

  var darkLink = null;
  function ensureDarkLink() {
    if (darkLink) return darkLink;
    darkLink = document.createElement("link");
    darkLink.rel = "stylesheet";
    darkLink.id = "hl-dark";
    darkLink.href =
      "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css";
    document.head.appendChild(darkLink);
    return darkLink;
  }

  function apply(mode) {
    var theme = resolveTheme(mode);
    document.documentElement.setAttribute("data-theme", theme);
    // highlight.js: only load the matching stylesheet.
    var light = document.getElementById("hl-light");
    if (theme === "dark") {
      if (light) light.remove();
      ensureDarkLink();
    } else {
      if (darkLink && darkLink.parentNode) darkLink.parentNode.removeChild(darkLink);
      darkLink = null;
      if (!light) {
        light = document.createElement("link");
        light.rel = "stylesheet";
        light.id = "hl-light";
        light.href =
          "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css";
        document.head.appendChild(light);
      }
    }
  }

  var mode = "system";
  try {
    mode = localStorage.getItem("theme") || "system";
  } catch (e) {}

  var mql = window.matchMedia
    ? window.matchMedia("(prefers-color-scheme: dark)")
    : null;
  if (mql && mql.addEventListener) {
    mql.addEventListener("change", function () {
      if (mode === "system") apply("system");
    });
  } else if (mql && mql.addListener) {
    mql.addListener(function () {
      if (mode === "system") apply("system");
    });
  }

  function toggle() {
    var order = ["light", "dark", "system"];
    var next = order[(order.indexOf(mode) + 1) % order.length];
    mode = next;
    try {
      localStorage.setItem("theme", next);
    } catch (e) {}
    apply(next);
    var btn = document.querySelector(".theme-toggle");
    if (btn) {
      btn.setAttribute("data-mode", next);
      var icon = btn.querySelector("i");
      if (icon) {
        icon.className = "fa-solid fa-fw " + (next === "dark" ? "fa-moon" : next === "light" ? "fa-sun" : "fa-circle-half-stroke");
      }
    }
  }

  // Expose for the button handler + initial call
  window.__themeToggle = toggle;

  // theme.js runs in <head> (via import.ejs), so the button in <body>
  // may not exist yet — bind after DOM is ready.
  function bindButton() {
    var btn = document.querySelector(".theme-toggle");
    if (!btn) {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", bindButton);
      } else {
        setTimeout(bindButton, 100);
      }
      return;
    }
    btn.addEventListener("click", toggle);
    btn.setAttribute("data-mode", mode);
    var icon = btn.querySelector("i");
    if (icon) {
      icon.className =
        "fa-solid fa-fw " +
        (mode === "dark" ? "fa-moon" : mode === "light" ? "fa-sun" : "fa-circle-half-stroke");
    }
  }
  bindButton();

  apply(mode);
})();
