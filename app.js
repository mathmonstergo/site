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

  /* —— 精致内置 SVG 矢量图标库 (智能兜底，告别简陋单字母) —— */
  const SVG_ICONS = {
    monitor: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="8" rx="2"/><rect x="2" y="13" width="20" height="8" rx="2"/><line x1="6" y1="7" x2="6.01" y2="7"/><line x1="6" y1="17" x2="6.01" y2="17"/><path d="M12 7h6M12 17h6"/></svg>`,
    xui: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><circle cx="12" cy="11" r="2"/><path d="M12 7v2M12 13v2"/></svg>`,
    pdf: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 13h6M9 17h4"/></svg>`,
    blog: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="9" y1="7" x2="15" y2="7"/><line x1="9" y1="11" x2="13" y2="11"/></svg>`,
    pwd: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1.5"/></svg>`,
    mail: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
    github: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/></svg>`,
    community: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="8" y1="10" x2="8.01" y2="10"/><line x1="12" y1="10" x2="12.01" y2="10"/><line x1="16" y1="10" x2="16.01" y2="10"/></svg>`,
    ai: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/><circle cx="12" cy="12" r="3.5"/></svg>`,
    fallback: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`
  };

  function getSvgFallback(item) {
    const key = (item.name + " " + item.url).toLowerCase();
    if (key.includes("monitor") || key.includes("探针") || key.includes("vps")) return SVG_ICONS.monitor;
    if (key.includes("3x") || key.includes("xui") || key.includes("节点")) return SVG_ICONS.xui;
    if (key.includes("pdf")) return SVG_ICONS.pdf;
    if (key.includes("日志") || key.includes("typecho") || key.includes("blog")) return SVG_ICONS.blog;
    if (key.includes("bitwarden") || key.includes("pwd") || key.includes("密码")) return SVG_ICONS.pwd;
    if (key.includes("mail") || key.includes("邮")) return SVG_ICONS.mail;
    if (key.includes("github")) return SVG_ICONS.github;
    if (key.includes("linux") || key.includes("do")) return SVG_ICONS.community;
    if (key.includes("gpt") || key.includes("claude") || key.includes("gemini") || key.includes("deepseek") || key.includes("perplexity") || key.includes("ai")) return SVG_ICONS.ai;
    return SVG_ICONS.fallback;
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

    // 图标 (优先高颜值专属矢量 SVG，或尝试拉取外部 favicon，智能优雅兜底)
    const icon = document.createElement("span");
    icon.className = "card-icon";
    const fallbackSvg = getSvgFallback(item);
    const host = domainOf(item.url);
    const isSelfHosted = host.includes("iamsen.com") || host.includes("sensendemoou.cn");

    if (isSelfHosted) {
      // 自建私有服务: 直接使用高质感专属内置矢量图标，稳定且极具工业质感
      icon.innerHTML = `<span class="icon-svg">${fallbackSvg}</span>`;
    } else {
      const src = faviconOf(item.url);
      if (src) {
        const img = document.createElement("img");
        img.src = src;
        img.alt = "";
        img.loading = "lazy";
        img.referrerPolicy = "no-referrer";
        img.onerror = () => {
          img.remove();
          icon.innerHTML = `<span class="icon-svg">${fallbackSvg}</span>`;
        };
        icon.appendChild(img);
      } else {
        icon.innerHTML = `<span class="icon-svg">${fallbackSvg}</span>`;
      }
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

  /* —— 6. 背景音乐播放器(唱片机:旋转唱片 + 悬停抬唱臂;可拖动 / 单击切换 / 双击或静止悬停展开 / 滚轮调音量 / 歌名跑马灯)—— */
  function initMusic() {
    const cfg = (typeof SITE !== "undefined" && SITE.music) || null;
    if (!cfg || !cfg.src) return; // 没配音乐就不渲染播放器

    const LS_VOL = "deck-music-vol"; // 记住音量
    const LS_POS = "deck-music-pos"; // 记住拖动后的位置
    const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

    // —— 组装 DOM ——
    const player = document.createElement("div");
    player.className = "player";
    player.dataset.state = "paused";
    player.tabIndex = 0;
    player.setAttribute("role", "button");
    player.setAttribute("aria-label", "背景音乐:单击播放 / 暂停,双击展开 / 收起设置,滚轮调音量,可拖动");

    // 唱片机:旋转唱片(播放时转、暂停时定格)+ 唱臂(悬停抬起)
    const turntable = document.createElement("span");
    turntable.className = "turntable";
    const disc = document.createElement("span");
    disc.className = "disc";
    const tonearm = document.createElement("span");
    tonearm.className = "tonearm";
    const tonearmHead = document.createElement("span"); // 末端折段(钝角 headshell),其末端是唱头
    tonearmHead.className = "tonearm-head";
    tonearm.append(tonearmHead);
    turntable.append(disc, tonearm);

    // 歌名跑马灯:两份相同文字无缝循环
    const marquee = document.createElement("div");
    marquee.className = "player-marquee";
    const track = document.createElement("div");
    track.className = "marquee-track";
    const item1 = document.createElement("span");
    const item2 = document.createElement("span");
    item1.className = "marquee-item";
    item2.className = "marquee-item";
    item2.setAttribute("aria-hidden", "true");
    track.append(item1, item2);
    marquee.appendChild(track);
    // 可选：让文字反向(从右往左)
    // track.style.animationDirection = "reverse";
    const vol = document.createElement("input");
    vol.className = "player-vol";
    vol.type = "range";
    vol.min = "0"; vol.max = "1"; vol.step = "0.01";
    vol.setAttribute("aria-label", "音量");

    const audio = document.createElement("audio");
    audio.loop = true;          // 循环播放(电台流则本就连续)
    audio.preload = "none";
    audio.crossOrigin = "anonymous"; // 允许 Web Audio 跨域分析频谱(SomaFM 流支持;本地 mp3 同源也 OK)
    audio.src = cfg.src;

    player.append(turntable, marquee, vol, audio);
    document.body.appendChild(player);

    const setMarquee = (text) => { item1.textContent = text; item2.textContent = text; };
    setMarquee(cfg.title || "MUSIC");

    // —— 音量(初值取上次保存的)——
    const setVolume = (v) => {
      v = clamp(v, 0, 1);
      audio.volume = v;
      vol.value = String(v);
      localStorage.setItem(LS_VOL, v.toFixed(2));
    };
    const savedVol = parseFloat(localStorage.getItem(LS_VOL));
    setVolume(Number.isFinite(savedVol) ? savedVol
      : (typeof cfg.volume === "number" ? cfg.volume : 0.5));
    vol.addEventListener("input", () => setVolume(parseFloat(vol.value)));
    let volActive = false; // 正在拖音量条时,别因指针移出而收起
    vol.addEventListener("pointerdown", (e) => { e.stopPropagation(); volActive = true; });
    window.addEventListener("pointerup", () => { volActive = false; });

    // —— 播放状态 → UI ——
    audio.addEventListener("play", () => { player.dataset.state = "playing"; });
    audio.addEventListener("pause", () => { player.dataset.state = "paused"; });
    const tryPlay = () => { const p = audio.play(); if (p) p.catch(() => {}); };
    const toggle = () => { if (audio.paused) tryPlay(); else audio.pause(); };

    // —— 交互状态:悬停展开 / 拖动 / 长按 ——
    const IDLE_MS = 900;  // 光标停在组件上「静止不操作」多久后,展开音量条
    const LONG_MS = 400;  // 按住超过这个时长算「长按」,不触发播放 / 暂停
    const DBL_MS = 240;   // 两次点击在此窗口内算双击 → 展开 / 收起(并抑制这次播放切换)
    let dragging = false, moved = false, longPress = false;
    let sx = 0, sy = 0, ox = 0, oy = 0, longTimer = 0, hoverTimer = 0, clickTimer = 0;

    const armHover = () => {  // 只要还在动就不断重置;停下不动满 IDLE_MS 才展开
      clearTimeout(hoverTimer);
      hoverTimer = window.setTimeout(() => player.classList.add("vol-open"), IDLE_MS);
    };
    const disarmHover = () => clearTimeout(hoverTimer);
    const openPanel = () => { disarmHover(); player.classList.add("vol-open"); };      // 展开音量条 + 切换器
    const togglePanel = () => { disarmHover(); player.classList.toggle("vol-open"); };  // 双击:开 / 关(手机靠它收起)

    const applyPos = (left, top) => {
      const w = player.offsetWidth, h = player.offsetHeight;
      player.style.left = clamp(left, 6, window.innerWidth - w - 6) + "px";
      player.style.top = clamp(top, 6, window.innerHeight - h - 6) + "px";
      player.style.right = "auto";
      player.style.bottom = "auto";
    };

    // 悬停展开:仅在「未按下且指针静止」时;一移动就重置,一按下就取消
    player.addEventListener("pointerenter", armHover);
    player.addEventListener("pointerleave", (e) => {
      disarmHover();
      // 触摸屏每次抬指都会误触发 pointerleave → 只让「鼠标移出」收起面板;
      // 触摸端靠「再次双击」或「点别处」收起(见下)
      if (e.pointerType === "mouse" && !volActive) player.classList.remove("vol-open");
    });
    player.addEventListener("wheel", (e) => {
      e.preventDefault();                 // 在组件上滚 = 调音量(滚轮是操作,不靠它做悬停展开)
      disarmHover();
      setVolume(audio.volume + (e.deltaY < 0 ? 0.05 : -0.05));
      player.classList.add("vol-open");   // 但调音量时把条显出来做反馈
    }, { passive: false });

    // 按下:开始可能的拖动 / 长按;按下即「操作」,取消悬停展开
    player.addEventListener("pointerdown", (e) => {
      dragging = true; moved = false; longPress = false;
      sx = e.clientX; sy = e.clientY;
      const r = player.getBoundingClientRect();
      ox = r.left; oy = r.top;
      try { player.setPointerCapture(e.pointerId); } catch (_) {}
      player.classList.add("dragging");
      disarmHover();
      clearTimeout(longTimer);
      longTimer = window.setTimeout(() => { longPress = true; }, LONG_MS);
    });
    player.addEventListener("pointermove", (e) => {
      if (dragging) {
        const dx = e.clientX - sx, dy = e.clientY - sy;
        if (!moved && Math.hypot(dx, dy) > 4) { moved = true; clearTimeout(longTimer); }
        if (moved) applyPos(ox + dx, oy + dy);
      } else {
        armHover(); // 悬停且在移动 → 不断重置;停下来才会展开
      }
    });
    const endPress = (e) => {
      if (!dragging) return;
      dragging = false;
      clearTimeout(longTimer);
      player.classList.remove("dragging");
      try { player.releasePointerCapture(e.pointerId); } catch (_) {}
      if (moved) {
        const r = player.getBoundingClientRect();
        localStorage.setItem(LS_POS, JSON.stringify({ left: r.left, top: r.top }));
      } else if (!longPress) {
        // 区分单击 / 双击:单击切换播放(延后 DBL_MS 确认),双击展开 / 收起面板并取消这次切换
        if (clickTimer) {
          clearTimeout(clickTimer); clickTimer = 0;
          togglePanel();
        } else {
          clickTimer = window.setTimeout(() => { clickTimer = 0; toggle(); }, DBL_MS);
        }
      }
      // 长按但没移动 → 视为一次握住 / 操作,什么都不做
    };
    player.addEventListener("pointerup", endPress);
    // 点击播放器以外的任意位置 → 收起面板(手机没有 mouseleave,靠这条 + 双击来关)
    document.addEventListener("pointerdown", (e) => {
      if (player.classList.contains("vol-open") && !player.contains(e.target)) {
        player.classList.remove("vol-open");
      }
    });
    player.addEventListener("keydown", (e) => {
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); toggle(); }
    });

    // 恢复上次拖动的位置(下一帧拿到尺寸后夹在视口内)
    try {
      const pos = JSON.parse(localStorage.getItem(LS_POS) || "null");
      if (pos && Number.isFinite(pos.left) && Number.isFinite(pos.top)) {
        requestAnimationFrame(() => applyPos(pos.left, pos.top));
      }
    } catch (_) {}

    // —— 自动开始:浏览器禁止「零互动出声」,先试一次(多半被拦),
    //    再挂在第一次「真实手势」上。滚动 / 移动鼠标不算,只认 点击 / 触摸 / 按键。
    tryPlay();
    const kickEvents = ["pointerdown", "keydown", "touchstart"];
    const kick = (e) => {
      kickEvents.forEach((ev) => window.removeEventListener(ev, kick));
      if (player.contains(e.target)) return; // 点的就是播放器,交给它自己处理
      tryPlay();
    };
    kickEvents.forEach((ev) => window.addEventListener(ev, kick, { passive: true }));

    // —— 电台「正在播放」:SomaFM 接口带开放 CORS,纯静态站可直接读,每 20s 刷新 ——
    if (cfg.somaChannel) {
      const fallback = cfg.title || "MUSIC";
      const refresh = async () => {
        try {
          const res = await fetch("https://api.somafm.com/channels.json", { cache: "no-store" });
          const data = await res.json();
          const ch = (data.channels || []).find((c) => c.id === cfg.somaChannel);
          setMarquee((ch && ch.lastPlaying) || fallback);
        } catch (_) { /* 网络/接口失败就保持上次显示 */ }
      };
      refresh();
      setInterval(refresh, 20000);
    }

    initVisualizer(audio, player); // 启动背景频谱可视化(底层 canvas)+ 播放器左侧样式切换
  }

  /* —— 7. 背景频谱可视化(Web Audio 真实频谱)——
   *  下层全屏 canvas,5 种样式:底部 / 中心圆波 / 左右两侧 / 环绕四周 / 关闭;
   *  低频能量写入 CSS 变量 --bass,驱动顶部辉光随鼓点呼吸;切换器嵌在播放器左侧。
   *  懒加载:只在首次手势 / 播放时建 AudioContext;尊重「减少动态」偏好。 */
  function initVisualizer(audio, player) {
    const mq = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq && mq.matches) return; // 用户要求减少动态 → 不跑可视化,音乐照常

    const root = document.documentElement;
    const canvas = document.createElement("canvas");
    canvas.className = "viz";
    document.body.appendChild(canvas);
    const c = canvas.getContext("2d");

    const DPR = Math.min(window.devicePixelRatio || 1, 1.5); // 限到 1.5 兼顾清晰与性能
    let W = 0, H = 0;
    const resize = () => {
      W = canvas.width = Math.floor(window.innerWidth * DPR);
      H = canvas.height = Math.floor(window.innerHeight * DPR);
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
    };
    resize();
    window.addEventListener("resize", resize);

    const BARS = 64;                    // 频谱柱数(用对数映射铺满整条频段)
    const MINT = "rgba(61, 245, 180,";  // 拼透明度用,如 MINT + " 0.9)"
    const G_LO = 1.0, G_HI = 3.2;       // 频段增益:低频 1.0×(已取消左侧压制,可满幅起伏)、高频 3.2×
    let ctx = null, analyser = null, freq = null, peaks = null, barv = null, gain = null, edges = null, raf = 0;

    // —— 当前样式:底部 / 中心圆波 / 左右两侧 / 关闭(记住上次选择)——
    const LS_MODE = "deck-viz-mode";
    const MODES = ["bottom", "center", "sides", "off"];
    let mode = localStorage.getItem(LS_MODE);
    if (MODES.indexOf(mode) < 0) mode = "bottom";

    // Web Audio 懒创建:首个手势 / 播放时建,只建一次(createMediaElementSource 每元素仅一次)
    function ensureCtx() {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!ctx) {
        try {
          ctx = new AC();
          const node = ctx.createMediaElementSource(audio);
          analyser = ctx.createAnalyser();
          analyser.fftSize = 2048;                  // 大 FFT:低频也有足够分辨率给对数分段
          analyser.smoothingTimeConstant = 0.2; // 剥离原生粘滞感
          node.connect(analyser);
          analyser.connect(ctx.destination);         // 必须接回输出,否则音频会静音
          const NF = analyser.frequencyBinCount;     // = 1024
          freq = new Uint8Array(NF);
          peaks = new Float32Array(BARS);
          barv = new Float32Array(BARS);
          // 预算每根柱的「对数」频段边界(人耳是对数的,低/中/高都铺得到)
          edges = new Float32Array(BARS + 1);
          const lo = 3, hi = Math.min(NF - 1, 560);  // 跳过最低的次低频隆隆;约覆盖到 ~12kHz
          for (let i = 0; i <= BARS; i++) edges[i] = Math.floor(lo * Math.pow(hi / lo, i / BARS));
          // 预算每根柱的频段增益(几何渐增):一条固定的「频谱倾斜」,抬高频、压低频。
          // 关键 —— 它只是个固定系数,各柱仍按当下能量自由起伏,所以保留错落与动感(不做时间归一化)
          gain = new Float32Array(BARS);
          for (let i = 0; i < BARS; i++) gain[i] = G_LO * Math.pow(G_HI / G_LO, i / (BARS - 1));
        } catch (e) {
          ctx = analyser = null; return; // 不支持 / 被拒(如跨域受限)→ 放弃可视化,音乐照常
        }
      }
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      startLoop(); // 每次手势 / 播放都确保渲染循环在跑(暂停会停帧,再播要重启)
    }

    // 每帧:对数分段取峰值 → 乘频段增益(固定倾斜)→ 伽马增强对比。
    // 低频不再天然最高、高频也抬得起来,但各柱仍随当下能量起伏 → 错落有致、有动感。
   function fillBars() {
      for (let i = 0; i < BARS; i++) {
        let m = 0;
        const b1 = Math.max(edges[i] + 1, edges[i + 1]);
        for (let b = edges[i]; b < b1; b++) if (freq[b] > m) m = freq[b];

        // 1. 基础值计算
        let v = (m / 255) * gain[i];

        // 2. 增强伽马对比度 (拉开错落感的核心)
        // 原来是 1.4。提升到 2.2~2.5 会让主旋律/鼓点极其突出，背景底噪被自动隐藏
        v = Math.pow(v > 1 ? 1 : v, 2.4); 

        // 3. 非对称物理缓动 (Attack & Release)
        // 当前值比旧值大 (击打): 快速响应 (0.75)
        // 当前值比旧值小 (余音): 顺滑回落 (0.12)
        if (v > barv[i]) {
          barv[i] += (v - barv[i]) * 0.75;
        } else {
          barv[i] += (v - barv[i]) * 0.12; 
        }
      }
    }

    // —— 样式 1:底部频谱(薄荷绿柱 + 峰值帽)——
    function bottomBars() {
      const maxH = H * 0.42, bw = W / BARS;
      const g = c.createLinearGradient(0, H, 0, H - maxH);
      g.addColorStop(0, MINT + " 0.92)"); g.addColorStop(1, MINT + " 0)");
      for (let i = 0; i < BARS; i++) {
        const h = barv[i] * maxH, x = i * bw + bw * 0.18, w = bw * 0.64;
        c.fillStyle = g; c.fillRect(x, H - h, w, h);
        // 引入阻尼和常数重力，让帽檐的跌落有“失重感”
        peaks[i] = Math.max(h, peaks[i] * 0.94 - 1.5 * DPR);
        c.fillStyle = MINT + " 0.85)";
        c.fillRect(x, H - peaks[i] - 2 * DPR, w, 2 * DPR);
      }
    }

    // —— 样式 2:左右两侧(频段映射到纵轴,向中间生长)——
    function sideBars() {
      const maxW = W * 0.16, bh = H / BARS;
      const gl = c.createLinearGradient(0, 0, maxW, 0);
      gl.addColorStop(0, MINT + " 0.85)"); gl.addColorStop(1, MINT + " 0)");
      const gr = c.createLinearGradient(W, 0, W - maxW, 0);
      gr.addColorStop(0, MINT + " 0.85)"); gr.addColorStop(1, MINT + " 0)");
      for (let j = 0; j < BARS; j++) {
        const len = barv[j] * maxW, y = j * bh + bh * 0.18, t = bh * 0.64;
        c.fillStyle = gl; c.fillRect(0, y, len, t);
        c.fillStyle = gr; c.fillRect(W - len, y, len, t);
      }
    }

    // —— 样式 3:中心圆波(径向柱 + 脉动光环,左右镜像;均衡后无固定凸起)——
    function centerWave(bass) {
      const cx = W / 2, cy = H / 2;
      const base = Math.min(W, H) * 0.16 * (1 + bass * 0.12); // 内圈随低音脉动
      const maxLen = Math.min(W, H) * 0.20;
      const P = BARS * 2;
      c.lineCap = "round"; c.lineWidth = 2 * DPR;
      for (let i = 0; i < P; i++) {
        const v = barv[i < BARS ? i : P - 1 - i];   // 左右镜像 → 对称
        const a = (i / P) * Math.PI * 2 - Math.PI / 2;
        const ca = Math.cos(a), sa = Math.sin(a), r1 = base + v * maxLen;
        c.strokeStyle = MINT + " " + (0.22 + v * 0.6).toFixed(2) + ")";
        c.beginPath();
        c.moveTo(cx + ca * base, cy + sa * base);
        c.lineTo(cx + ca * r1, cy + sa * r1);
        c.stroke();
      }
      c.strokeStyle = MINT + " " + (0.16 + bass * 0.28).toFixed(2) + ")";
      c.lineWidth = 1.5 * DPR;
      c.beginPath(); c.arc(cx, cy, base, 0, Math.PI * 2); c.stroke();
    }

    function draw() {
      raf = 0;
      if (!analyser || mode === "off") return;
      analyser.getByteFrequencyData(freq);
      fillBars();
      c.clearRect(0, 0, W, H);

      let bass = 0, energy = 0;
      for (let b = 2; b < 14; b++) bass += freq[b];   // 原始低频能量(不归一),驱动辉光
      for (let i = 0; i < BARS; i++) energy += freq[i];
      bass = Math.min(1, bass / 2520);

      if (mode === "bottom") bottomBars();
      else if (mode === "center") centerWave(bass);
      else if (mode === "sides") sideBars();

      root.style.setProperty("--bass", bass.toFixed(3));

      if (!audio.paused || energy > 8) {
        raf = requestAnimationFrame(draw);
      } else {                        // 暂停且已衰减到静默 → 收尾停帧省电
        c.clearRect(0, 0, W, H);
        root.style.setProperty("--bass", "0");
      }
    }
    function startLoop() { if (!raf && analyser && mode !== "off") raf = requestAnimationFrame(draw); }

    // —— 样式切换器(左下角,与右下角播放器对称)——
    const ICONS = {
      bottom: '<svg viewBox="0 0 16 16" fill="currentColor"><rect x="1.5" y="9" width="2.2" height="5.5" rx="1"/><rect x="5.4" y="4.5" width="2.2" height="10" rx="1"/><rect x="9.3" y="6.5" width="2.2" height="8" rx="1"/><rect x="13" y="8" width="2.2" height="6.5" rx="1"/></svg>',
      center: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="8" cy="8" r="2"/><circle cx="8" cy="8" r="5.6"/></svg>',
      sides: '<svg viewBox="0 0 16 16" fill="currentColor"><rect x="1.5" y="2.5" width="2.4" height="11" rx="1"/><rect x="12.1" y="2.5" width="2.4" height="11" rx="1"/></svg>',
      off: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><path d="M8 1.8 V7.5"/><path d="M4.4 4.6 a5 5 0 1 0 7.2 0"/></svg>',
    };
    const LABELS = { bottom: "底部频谱", center: "中心圆波", sides: "左右两侧", off: "关闭特效" };
    const switcher = document.createElement("div");
    switcher.className = "viz-switch";
    switcher.setAttribute("role", "group");
    switcher.setAttribute("aria-label", "背景特效样式");
    const buttons = MODES.map((m) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "viz-btn";
      b.dataset.mode = m;
      b.title = LABELS[m];
      b.setAttribute("aria-label", LABELS[m]);
      b.innerHTML = ICONS[m];
      b.addEventListener("click", () => setMode(m));
      switcher.appendChild(b);
      return b;
    });
    // 放进播放器左侧,跟随音量条同样的展开规则(.player.vol-open 一起滑出)
    if (player) player.insertBefore(switcher, player.firstChild);
    else document.body.appendChild(switcher);
    // 在切换器上按下不应触发播放器的拖动 / 播放暂停(与音量条一致)
    switcher.addEventListener("pointerdown", (e) => e.stopPropagation());

    function setMode(m) {
      mode = m;
      localStorage.setItem(LS_MODE, m);
      buttons.forEach((b) => {
        const on = b.dataset.mode === m;
        b.classList.toggle("active", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
      if (m === "off") {                  // 关闭:停帧、清屏、辉光复原成静态
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
        c.clearRect(0, 0, W, H);
        root.classList.remove("viz-on");
        root.style.setProperty("--bass", "0");
        canvas.style.display = "none";
      } else {
        canvas.style.display = "";
        root.classList.add("viz-on");
        startLoop();                      // 若音频已在播,立即按新样式渲染
      }
    }
    setMode(mode); // 应用初始 / 上次选择的样式

    // 播放即接管;另挂一次性手势,确保 AudioContext 在用户激活态里被唤醒
    audio.addEventListener("play", ensureCtx);
    const onGesture = () => {
      ensureCtx();
      ["pointerdown", "keydown", "touchstart"].forEach((ev) => window.removeEventListener(ev, onGesture));
    };
    ["pointerdown", "keydown", "touchstart"].forEach((ev) =>
      window.addEventListener(ev, onGesture, { passive: true }));
  }

  /* —— 启动 —— */
  document.addEventListener("DOMContentLoaded", () => {
    applySite();
    render();
    bindKeys();
    startClock();
    initMusic();
  });
})();
