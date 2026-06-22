/*!
 * PresenceVision Embed — 1行貼るだけで「最新記事」をどんなサイトにも表示。
 * 使い方:
 *   <div id="pv-articles"></div>
 *   <script src="https://presencevision.com/pv-embed.js"
 *           data-project="PROJECT_ID" data-key="API_KEY" data-limit="6" async></script>
 * 任意: data-target="任意のコンテナID" / data-accent="#2563eb"
 */
(function () {
  "use strict";
  var s =
    document.currentScript ||
    (function () {
      var all = document.getElementsByTagName("script");
      for (var i = all.length - 1; i >= 0; i--) {
        if (all[i].src && all[i].src.indexOf("pv-embed.js") !== -1) return all[i];
      }
      return null;
    })();
  if (!s) return;

  var projectId = s.getAttribute("data-project");
  var key = s.getAttribute("data-key");
  var limit = parseInt(s.getAttribute("data-limit") || "6", 10) || 6;
  var targetId = s.getAttribute("data-target") || "pv-articles";
  var accent = s.getAttribute("data-accent") || "#2563eb";
  if (!projectId || !key) return;

  var base = s.src.replace(/\/pv-embed\.js.*$/, "");

  function esc(t) {
    var d = document.createElement("div");
    d.textContent = t == null ? "" : String(t);
    return d.innerHTML;
  }
  function fmtDate(iso) {
    try {
      var d = new Date(iso);
      return d.getFullYear() + "/" + (d.getMonth() + 1) + "/" + d.getDate();
    } catch (e) {
      return "";
    }
  }

  function render(container, articles) {
    if (!articles || !articles.length) {
      container.innerHTML =
        '<p style="color:#888;font-size:14px;">記事はまだありません。</p>';
      return;
    }
    var html =
      '<div class="pv-list" style="display:grid;gap:12px;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',\'Noto Sans JP\',sans-serif;">';
    for (var i = 0; i < articles.length; i++) {
      var a = articles[i];
      html +=
        '<a href="' +
        esc(a.url) +
        '" target="_blank" rel="noopener" style="display:block;text-decoration:none;border:1px solid #e5e7eb;border-radius:10px;padding:14px 16px;transition:box-shadow .15s;background:#fff;">' +
        '<div style="font-weight:600;font-size:15px;color:#111827;line-height:1.45;">' +
        esc(a.title) +
        "</div>" +
        (a.excerpt
          ? '<div style="margin-top:6px;font-size:13px;color:#6b7280;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">' +
            esc(a.excerpt) +
            "</div>"
          : "") +
        '<div style="margin-top:8px;font-size:11px;color:' +
        esc(accent) +
        ';font-weight:600;">' +
        (a.publishedAt ? fmtDate(a.publishedAt) + " ・ " : "") +
        "続きを読む →</div>" +
        "</a>";
    }
    html += "</div>";
    container.innerHTML = html;
  }

  function mount() {
    var container = document.getElementById(targetId);
    if (!container) return;
    var url =
      base +
      "/api/public/articles?projectId=" +
      encodeURIComponent(projectId) +
      "&key=" +
      encodeURIComponent(key) +
      "&limit=" +
      limit;
    fetch(url)
      .then(function (r) {
        return r.ok ? r.json() : { articles: [] };
      })
      .then(function (d) {
        render(container, d && d.articles);
      })
      .catch(function () {
        container.innerHTML =
          '<p style="color:#b91c1c;font-size:13px;">記事の取得に失敗しました。</p>';
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
