/**
 * Admin dashboard logic (pure static, client-side).
 * - Password is compared via SHA-256 (Web Crypto API) against a hash
 *   injected by the theme. Client-side auth is OBFUSCATION ONLY.
 * - Login state persists in sessionStorage.
 * - Stats: busuanzi global PV/UV + this browser's localStorage visit log.
 */

(function () {
  "use strict";

  var loginEl = document.getElementById("admin-login");
  var dashEl = document.getElementById("admin-dashboard");
  if (!loginEl || !dashEl) return;

  // ---- SHA-256 helper (Web Crypto) ----
  async function sha256(str) {
    var data = new TextEncoder().encode(str);
    var digest = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest))
      .map(function (b) { return b.toString(16).padStart(2, "0"); })
      .join("");
  }

  // ---- config injected from _config.yml admin.password (as SHA-256 hash) ----
  var ADMIN_HASH = "";
  try {
    var cfg = JSON.parse(document.body.getAttribute("data-admin") || "{}");
    if (cfg.hash) ADMIN_HASH = cfg.hash;
  } catch (e) {}
  if (!ADMIN_HASH) {
    // No hash injected (admin disabled?) — show a message.
    msg && (msg.textContent = "后台未启用");
    return;
  }

  // ---- login ----
  var form = document.getElementById("admin-login-form");
  var pwdInput = document.getElementById("admin-password");
  var msg = document.getElementById("admin-login-msg");

  function showDash() {
    loginEl.style.display = "none";
    dashEl.style.display = "block";
    sessionStorage.setItem("adminAuthed", "1");
    renderDashboard();
  }

  function lock() {
    sessionStorage.removeItem("adminAuthed");
    loginEl.style.display = "block";
    dashEl.style.display = "none";
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    var val = pwdInput.value;
    if (!val) { msg.textContent = "请输入密码"; return; }
    var hash = await sha256(val);
    if (hash === ADMIN_HASH) {
      msg.textContent = "";
      showDash();
    } else {
      msg.textContent = "密码错误";
    }
  });

  // auto-login if already authed this session
  if (sessionStorage.getItem("adminAuthed") === "1") {
    loginEl.style.display = "none";
    dashEl.style.display = "block";
    renderDashboard();
  }

  function renderDashboard() {
    // busuanzi PV/UV (read from the footer spans if present)
    var pv = document.getElementById("busuanzi_value_site_pv");
    var uv = document.getElementById("busuanzi_value_site_uv");
    var pvEl = document.getElementById("stat-pv");
    var uvEl = document.getElementById("stat-uv");
    function pollBusuanzi() {
      if (pvEl && pv && pv.textContent) pvEl.textContent = pv.textContent;
      if (uvEl && uv && uv.textContent) uvEl.textContent = uv.textContent;
      if ((!pv || !pv.textContent) && pvEl && pvEl.textContent === "–") {
        setTimeout(pollBusuanzi, 1000);
      }
    }
    pollBusuanzi();

    // local visit stats
    var visits = [];
    try { visits = JSON.parse(localStorage.getItem("adminVisits") || "[]"); } catch (e) {}
    var today = new Date().toISOString().slice(0, 10);
    var todayCount = visits.filter(function (v) { return v.date === today; }).length;

    document.getElementById("stat-visits").textContent = visits.length;
    document.getElementById("stat-today").textContent = todayCount;

    // current visitor info
    var uaEl = document.getElementById("admin-ua");
    var scrEl = document.getElementById("admin-screen");
    var langEl = document.getElementById("admin-lang");
    var onlineEl = document.getElementById("admin-online");
    var tzEl = document.getElementById("admin-tz");

    var ua = navigator.userAgent;
    uaEl.textContent = ua.length > 80 ? ua.slice(0, 80) + "…" : ua;
    scrEl.textContent = screen.width + " × " + screen.height;
    langEl.textContent = navigator.language || "–";
    onlineEl.textContent = navigator.onLine ? "在线" : "离线";
    try { tzEl.textContent = Intl.DateTimeFormat().resolvedOptions().timeZone || "–"; }
    catch (e) { tzEl.textContent = "–"; }

    // visit log table (newest first)
    var list = document.getElementById("admin-visit-list");
    list.innerHTML = "";
    var recent = visits.slice().reverse().slice(0, 20);
    if (recent.length === 0) {
      var tr = document.createElement("tr");
      var td = document.createElement("td");
      td.colSpan = 2;
      td.textContent = "暂无记录";
      tr.appendChild(td);
      list.appendChild(tr);
    } else {
      recent.forEach(function (v) {
        var tr = document.createElement("tr");
        var tdTime = document.createElement("td");
        var tdPage = document.createElement("td");
        tdTime.textContent = v.time || "";
        tdPage.textContent = v.path || "";
        tdPage.classList.add("mono");
        tr.appendChild(tdTime);
        tr.appendChild(tdPage);
        list.appendChild(tr);
      });
    }

    // clear local records
    var clearBtn = document.getElementById("admin-clear");
    if (clearBtn) {
      clearBtn.onclick = function () {
        localStorage.removeItem("adminVisits");
        renderDashboard();
      };
    }
  }

  // logout link (optional, add a small button in footer of dashboard)
  var logout = document.createElement("button");
  logout.className = "admin-btn";
  logout.textContent = "退出登录";
  logout.style.marginTop = "10px";
  logout.onclick = lock;
  dashEl.appendChild(logout);
})();
