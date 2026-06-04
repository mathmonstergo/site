/* ============================================================
 *  DECK · 交互逻辑
 *  渲染链接卡片、搜索过滤、键盘快捷键、实时时钟。
 *  正常情况下你不需要改这个文件,改 links.js 即可。
 * ============================================================ */

(function () {
  "use strict";

  /* —— 小工具 —— */
  const $ = (sel) => document.querySelector(sel);

  function domainOf(url) {
    try { return new URL(url).hostname; } catch { return ""; }
  }

  // 用 Google 的 favicon 服务自动取图标;取不到再用首字母兜底
  function faviconOf(url) {
    const host = domainOf(url);
    if (!host) return null;
    return `https://www.google.com/s2/favicons?domain=${host}&sz=64`;
  }

  /* —— 1. 填充站点信息 —— */
  function applySite() {
    document.title = `${SITE.brand} — 导航`;
    $("#brand").textContent = SITE.brand;
    $("#owner").textContent = SITE.owner;
    $("#tagline").textContent = SITE.tagline;
    $("#footerLeft").textContent = SITE.brand;
    $("#emptyEngine").textContent = SITE.searchEngine.name;
    const gh = $("#footerGithub");
    gh.href = SITE.github || "#";
    $("#search").placeholder = `搜索链接,或回车用 ${SITE.searchEngine.name} 搜索…`;
  }

  /* —— 2. 渲染分类与卡片 —— */
  let totalLinks = 0;

  function renderCard(item, order) {
    const a = document.createElement("a");
    a.className = "card";
    a.href = item.url;
    a.target = "_blank";
    a.rel = "noopener";
    a.style.setProperty("--i", order);

    // 供搜索匹配用的纯文本
    a.dataset.search = `${item.name} ${item.desc || ""} ${domainOf(item.url)}`.toLowerCase();

    // 图标
    const icon = document.createElement("span");
    icon.className = "card-icon";
    const src = faviconOf(item.url);
    if (src) {
      const img = document.createElement("img");
      img.src = src;
      img.alt = "";
      img.loading = "lazy";
      img.referrerPolicy = "no-referrer";
      img.onerror = () => {
        icon.innerHTML = `<span class="fallback">${item.name.trim().charAt(0).toUpperCase()}</span>`;
      };
      icon.appendChild(img);
    } else {
      icon.innerHTML = `<span class="fallback">${item.name.trim().charAt(0).toUpperCase()}</span>`;
    }

    const body = document.createElement("span");
    body.className = "card-body";
    const name = document.createElement("span");
    name.className = "card-name";
    name.textContent = item.name;
    body.appendChild(name);
    if (item.desc) {
      const desc = document.createElement("span");
      desc.className = "card-desc";
      desc.textContent = item.desc;
      body.appendChild(desc);
    }

    const arrow = document.createElement("span");
    arrow.className = "card-arrow";
    arrow.textContent = "↗";

    a.append(icon, body, arrow);
    return a;
  }

  function render() {
    const grid = $("#grid");
    grid.innerHTML = "";
    totalLinks = 0;
    let order = 0;

    CATEGORIES.forEach((cat, idx) => {
      const section = document.createElement("section");
      section.className = "cat";
      section.style.setProperty("--i", idx);

      const head = document.createElement("div");
      head.className = "cat-head";
      head.innerHTML =
        `<span class="cat-index">${String(idx + 1).padStart(2, "0")}</span>` +
        `<span class="cat-name">${cat.name}</span>` +
        `<span class="cat-rule"></span>` +
        `<span class="cat-count">${cat.items.length}</span>`;

      const list = document.createElement("div");
      list.className = "cat-grid";
      cat.items.forEach((item) => {
        list.appendChild(renderCard(item, order++));
        totalLinks++;
      });

      section.append(head, list);
      grid.appendChild(section);
    });

    $("#footerCount").textContent = `${totalLinks} 链接 · ${CATEGORIES.length} 分类`;
  }

  /* —— 3. 搜索过滤 —— */
  function filter(query) {
    const q = query.trim().toLowerCase();
    const empty = $("#empty");
    let visible = 0;

    document.querySelectorAll(".cat").forEach((cat) => {
      let catVisible = 0;
      cat.querySelectorAll(".card").forEach((card) => {
        const match = !q || card.dataset.search.includes(q);
        card.classList.toggle("is-hidden", !match);
        if (match) { catVisible++; visible++; }
      });
      cat.classList.toggle("is-hidden", catVisible === 0);
    });

    if (q && visible === 0) {
      $("#emptyQuery").textContent = query.trim();
      empty.hidden = false;
    } else {
      empty.hidden = true;
    }
  }

  // 回车:有匹配则打开第一个,没有则用搜索引擎搜
  function onEnter() {
    const input = $("#search");
    const q = input.value.trim();
    if (!q) return;
    const first = document.querySelector(".card:not(.is-hidden)");
    if (first) {
      window.open(first.href, "_blank", "noopener");
    } else {
      window.open(SITE.searchEngine.url + encodeURIComponent(q), "_blank", "noopener");
    }
  }

  /* —— 4. 键盘快捷键 —— */
  function bindKeys() {
    const input = $("#search");

    input.addEventListener("input", () => filter(input.value));
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); onEnter(); }
      if (e.key === "Escape") { input.value = ""; filter(""); input.blur(); }
    });

    // 在页面任意位置按 "/" 快速聚焦搜索框
    document.addEventListener("keydown", (e) => {
      if (e.key === "/" && document.activeElement !== input) {
        e.preventDefault();
        input.focus();
      }
    });
  }

  /* —— 5. 实时时钟 —— */
  function startClock() {
    const el = $("#clock");
    const pad = (n) => String(n).padStart(2, "0");
    const tick = () => {
      const d = new Date();
      el.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };
    tick();
    setInterval(tick, 1000);
  }

  /* —— 启动 —— */
  document.addEventListener("DOMContentLoaded", () => {
    applySite();
    render();
    bindKeys();
    startClock();
  });
})();
