/* ============================================================
 *  DECK FUN · 模块化灵动导航逻辑
 * ============================================================ */

(function () {
  "use strict";

  const $ = (sel) => document.querySelector(sel);

  function domainOf(url) {
    try { return new URL(url).hostname; } catch { return ""; }
  }

  function faviconOf(url) {
    const host = domainOf(url);
    if (!host) return null;
    return `https://www.google.com/s2/favicons?domain=${host}&sz=64`;
  }

  // 精致内置 SVG 矢量图标库
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

  function applySite() {
    document.title = `${SITE.brand} · 灵动控制台`;
    $("#brand").textContent = SITE.brand;
    $("#owner").textContent = SITE.owner;
    $("#tagline").textContent = SITE.tagline;
    $("#footerLeft").textContent = SITE.brand;
    $("#emptyEngine").textContent = SITE.searchEngine.name;
    const gh = $("#footerGithub");
    if (gh) gh.href = SITE.github || "#";
    $("#search").placeholder = `搜索链接, 或回车直接用 ${SITE.searchEngine.name} 探索…`;
  }

  function renderCard(item, order) {
    const a = document.createElement("a");
    a.className = "card";
    a.href = item.url;
    a.target = "_blank";
    a.rel = "noopener";
    a.style.setProperty("--i", order);
    a.dataset.search = `${item.name} ${item.desc || ""} ${domainOf(item.url)}`.toLowerCase();

    // 内部 3D 悬浮高光层
    const sheen = document.createElement("div");
    sheen.className = "card-sheen";

    // 图标容器
    const icon = document.createElement("span");
    icon.className = "card-icon";
    const fallbackSvg = getSvgFallback(item);
    const host = domainOf(item.url);
    const isSelfHosted = host.includes("iamsen.com") || host.includes("sensendemoou.cn");

    if (isSelfHosted) {
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

    // 文字
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

    // 箭头
    const arrow = document.createElement("span");
    arrow.className = "card-arrow";
    arrow.textContent = "↗";

    a.append(sheen, icon, body, arrow);
    return a;
  }

  function render() {
    const grid = $("#grid");
    grid.innerHTML = "";
    let totalLinks = 0;
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

    $("#footerCount").textContent = `${totalLinks} 节点接入 · 运行平稳`;
  }

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

  function bindKeys() {
    const input = $("#search");
    input.addEventListener("input", () => filter(input.value));
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); onEnter(); }
      if (e.key === "Escape") { input.value = ""; filter(""); input.blur(); }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "/" && document.activeElement !== input) {
        e.preventDefault();
        input.focus();
      }
    });
  }

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

  /* —— 音乐播放器 & 频谱 —— */
  function initMusic() {
    const cfg = (typeof SITE !== "undefined" && SITE.music) || null;
    if (!cfg || !cfg.src) return;

    const LS_VOL = "deck-music-vol";
    const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

    const player = document.createElement("div");
    player.className = "player";
    player.dataset.state = "paused";
    player.tabIndex = 0;

    const turntable = document.createElement("span");
    turntable.className = "turntable";
    const disc = document.createElement("span");
    disc.className = "disc";
    const tonearm = document.createElement("span");
    tonearm.className = "tonearm";
    const tonearmHead = document.createElement("span");
    tonearmHead.className = "tonearm-head";
    tonearm.append(tonearmHead);
    turntable.append(disc, tonearm);

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

    const vol = document.createElement("input");
    vol.className = "player-vol";
    vol.type = "range";
    vol.min = "0"; vol.max = "1"; vol.step = "0.01";

    const audio = document.createElement("audio");
    audio.loop = true;
    audio.preload = "none";
    audio.crossOrigin = "anonymous";
    audio.src = cfg.src;

    player.append(turntable, marquee, vol, audio);
    document.body.appendChild(player);

    const setMarquee = (text) => { item1.textContent = text; item2.textContent = text; };
    setMarquee(cfg.title || "DEFCON RADIO");

    const setVolume = (v) => {
      v = clamp(v, 0, 1);
      audio.volume = v;
      vol.value = String(v);
      localStorage.setItem(LS_VOL, v.toFixed(2));
    };
    const savedVol = parseFloat(localStorage.getItem(LS_VOL));
    setVolume(Number.isFinite(savedVol) ? savedVol : 0.5);
    vol.addEventListener("input", () => setVolume(parseFloat(vol.value)));

    audio.addEventListener("play", () => { player.dataset.state = "playing"; });
    audio.addEventListener("pause", () => { player.dataset.state = "paused"; });
    player.addEventListener("click", (e) => {
      if (e.target === vol) return;
      if (audio.paused) {
        audio.play().catch(() => {});
        SoundFx.click();
      } else {
        audio.pause();
        SoundFx.click();
      }
    });

    // Web Audio 频谱
    const canvas = document.createElement("canvas");
    canvas.className = "viz";
    document.body.appendChild(canvas);
    const c = canvas.getContext("2d");
    const root = document.documentElement;

    let W = 0, H = 0;
    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const BARS = 64;
    const MINT = "rgba(61, 245, 180,";
    let ctx = null, analyser = null, freq = null;

    const setupAudio = () => {
      if (ctx) return;
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      ctx = new AudioContext();
      analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.82;
      const src = ctx.createMediaElementSource(audio);
      src.connect(analyser);
      analyser.connect(ctx.destination);
      freq = new Uint8Array(analyser.frequencyBinCount);
      root.classList.add("viz-on");
      renderViz();
    };

    audio.addEventListener("play", setupAudio, { once: true });

    function renderViz() {
      requestAnimationFrame(renderViz);
      if (!analyser || audio.paused) return;

      analyser.getByteFrequencyData(freq);
      c.clearRect(0, 0, W, H);

      let lowSum = 0;
      for (let i = 0; i < 16; i++) lowSum += freq[i];
      const bass = (lowSum / 16 / 255);
      root.style.setProperty("--bass", (bass * 1.5).toFixed(3));

      // 绘制底部波形
      const barW = (W / BARS) * 0.7;
      const gap = (W / BARS) * 0.3;
      for (let i = 0; i < BARS; i++) {
        const val = freq[Math.floor((i / BARS) * (freq.length * 0.6))] / 255;
        const barH = val * (H * 0.22);
        const x = i * (barW + gap) + gap / 2;
        const y = H - barH;

        c.fillStyle = `${MINT} ${(0.25 + val * 0.6).toFixed(2)})`;
        c.fillRect(x, y, barW, barH);
      }
    }
  }

  window.addEventListener("DOMContentLoaded", () => {
    applySite();
    render();
    bindKeys();
    startClock();
    initMusic();

    // 启动趣味互动引擎
    if (window.Interactive) {
      window.Interactive.init();
    }
  });
})();
