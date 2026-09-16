/* ============================================================
 *  INTERACTIVE.JS · 物理沙盒自由拖拽 + 火柴人蜘蛛丝拉货工匠引擎 v7.0
 *  核心突破:
 *    1. 彻底解决快速拖拽跟丢: window 全局 pointermove/pointerup，甩再快也 100% 紧贴光标
 *    2. 彻底解决错位: document.body 纯净屏幕坐标系，指哪到哪 0 偏差
 *    3. 蜘蛛丝拉货双技能:
 *       - 动作 A: 高空卡片 -> 仰天拔河后仰用力拉拽 (Tug-of-War)
 *       - 动作 B: 远处边缘卡片 -> 纤夫扛绳大前倾反向拉货 (Shoulder Towing Walk)
 *    4. 拉进范围后双手稳稳托起 -> 逐级跳台阶 -> 扣嵌锁死 -> 擦汗！
 * ============================================================ */

(function () {
  "use strict";

  const clamp = (n, min, max) => Math.max(min, Math.min(n, max));

  /* ------------------------------------------------------------
   * 1. 物理微粒火花画布
   * ------------------------------------------------------------ */
  const canvas = document.createElement("canvas");
  canvas.id = "particleCanvas";
  canvas.style.cssText =
    "position:fixed;inset:0;pointer-events:none;z-index:999999;";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  let W = (canvas.width = window.innerWidth);
  let H = (canvas.height = window.innerHeight);

  window.addEventListener("resize", () => {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  });

  const particles = [];
  const COLORS = ["#3df5b4", "#ffffff", "#a1a1aa", "#60a5fa", "#f59e0b"];

  function createBurst(x, y, count = 16) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4.2 + 1.8;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2,
        gravity: 0.15,
        size: Math.random() * 3.5 + 2,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        alpha: 1,
        decay: Math.random() * 0.02 + 0.018,
        rotation: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.2,
      });
    }
  }

  function loopParticles() {
    ctx.clearRect(0, 0, W, H);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.alpha -= p.decay;
      p.rotation += p.vr;

      if (p.alpha <= 0) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    }
    requestAnimationFrame(loopParticles);
  }
  requestAnimationFrame(loopParticles);

  /* ------------------------------------------------------------
   * 2. 全局绝对坐标自由拖拽引擎 (彻底解决高速甩动丢失)
   * ------------------------------------------------------------ */
  const cardStates = new Map();
  let isHeroRunning = false;

  function recordSlots() {
    if (isHeroRunning) return;
    const cards = document.querySelectorAll(".card");
    cards.forEach((card, idx) => {
      let st = cardStates.get(card);
      if (!st) {
        st = {
          el: card,
          isDisplaced: false,
          isCarried: false,
          isDragging: false,
          placeholder: null,
          fixedX: 0,
          fixedY: 0,
          phaseX: idx * 0.8 + Math.random() * 2,
          phaseY: idx * 0.9 + Math.random() * 2,
        };
        cardStates.set(card, st);
      }

      if (!st.isDisplaced) {
        const rect = card.getBoundingClientRect();
        st.homeX = rect.left;
        st.homeY = rect.top;
        st.homeW = rect.width;
        st.homeH = rect.height;
      }
    });
  }

  // 就地太空慢呼吸浮动
  let driftTime = 0;
  function loopCardDrift(now) {
    driftTime = now * 0.001;
    cardStates.forEach((st) => {
      if (st.isDisplaced && !st.isCarried && !st.isDragging && !st.isBeingReeled) {
        const floatX = Math.sin(driftTime * 0.85 + st.phaseX) * 12;
        const floatY = Math.cos(driftTime * 0.75 + st.phaseY) * 14;
        const rot = Math.sin(driftTime * 0.5 + st.phaseX) * 4;

        const curX = st.fixedX + floatX;
        const curY = st.fixedY + floatY;

        st.el.style.left = `${curX.toFixed(1)}px`;
        st.el.style.top = `${curY.toFixed(1)}px`;
        st.el.style.transform = `rotate(${rot.toFixed(1)}deg)`;
      }
    });
    requestAnimationFrame(loopCardDrift);
  }
  requestAnimationFrame(loopCardDrift);

  function initCardDrag() {
    let activeCard = null;
    let downClientX = 0,
      downClientY = 0;
    let grabOffsetX = 0,
      grabOffsetY = 0;
    let downTime = 0;
    let hasMoved = false;

    document.querySelectorAll(".card").forEach((card) => {
      card.setAttribute("draggable", "false");
      card.addEventListener("dragstart", (e) => e.preventDefault());
      card.addEventListener("click", (e) => e.preventDefault());

      // 3D 视差 (未拖拽时)
      card.addEventListener("pointermove", (e) => {
        if (activeCard || isHeroRunning) return;
        const st = cardStates.get(card);
        if (st && st.isDisplaced) return;

        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width;
        const py = (e.clientY - rect.top) / rect.height;

        card.style.setProperty("--rx", `${((py - 0.5) * -14).toFixed(2)}deg`);
        card.style.setProperty("--ry", `${((px - 0.5) * 14).toFixed(2)}deg`);
        card.style.setProperty("--px", `${(px * 100).toFixed(1)}%`);
        card.style.setProperty("--py", `${(py * 100).toFixed(1)}%`);
      });

      card.addEventListener("pointerleave", () => {
        card.style.setProperty("--rx", "0deg");
        card.style.setProperty("--ry", "0deg");
      });

      // 仅在 card 上监听 pointerdown
      card.addEventListener("pointerdown", (e) => {
        if (isHeroRunning) return;
        if (e.button !== 0) return;

        activeCard = card;
        downClientX = e.clientX;
        downClientY = e.clientY;
        downTime = performance.now();
        hasMoved = false;

        const rect = card.getBoundingClientRect();
        grabOffsetX = e.clientX - rect.left;
        grabOffsetY = e.clientY - rect.top;
      });
    });

    // 【核心解决跟丢】：pointermove 和 pointerup 必须全局绑定在 window 上！
    // 鼠标甩得再快也绝不丢帧，卡片 100% 同步跟手！
    window.addEventListener("pointermove", (e) => {
      if (!activeCard) return;
      const dx = e.clientX - downClientX;
      const dy = e.clientY - downClientY;

      // 移动超过 6px 判定为开始拖拽
      if (!hasMoved && Math.hypot(dx, dy) > 6) {
        hasMoved = true;
        const st = cardStates.get(activeCard);
        st.isDragging = true;

        if (!st.placeholder) {
          const ph = document.createElement("div");
          ph.className = "slot-ghost show";
          ph.style.width = `${st.homeW}px`;
          ph.style.height = `${st.homeH}px`;
          activeCard.insertAdjacentElement("beforebegin", ph);
          st.placeholder = ph;
        }

        document.body.appendChild(activeCard);

        activeCard.style.position = "fixed";
        activeCard.style.width = `${st.homeW}px`;
        activeCard.style.height = `${st.homeH}px`;
        activeCard.style.margin = "0";
        activeCard.style.zIndex = "100000";
        activeCard.classList.add("is-dragging");

        SoundFx.lift();
      }

      if (hasMoved) {
        const st = cardStates.get(activeCard);
        const clampedX = clamp(
          e.clientX - grabOffsetX,
          12,
          window.innerWidth - st.homeW - 12
        );
        const clampedY = clamp(
          e.clientY - grabOffsetY,
          12,
          window.innerHeight - st.homeH - 12
        );

        activeCard.style.left = `${clampedX}px`;
        activeCard.style.top = `${clampedY}px`;
        activeCard.style.transform = "none";

        st.fixedX = clampedX;
        st.fixedY = clampedY;
        st.isDisplaced = true;
      }
    });

    window.addEventListener("pointerup", (e) => {
      if (!activeCard) return;
      const st = cardStates.get(activeCard);
      const elapsed = performance.now() - downTime;
      const dist = Math.hypot(e.clientX - downClientX, e.clientY - downClientY);

      if (hasMoved) {
        st.isDragging = false;
        activeCard.classList.remove("is-dragging");
        activeCard.classList.add("is-displaced");
        SoundFx.snap();
        createBurst(e.clientX, e.clientY, 14);
      } else {
        // 短促轻点才打开网页
        if (dist < 6 && elapsed < 450) {
          const url = activeCard.href;
          if (url && url !== "#") {
            window.open(url, "_blank", "noopener");
          }
        }
      }

      activeCard = null;
      hasMoved = false;
    });
  }

  /* ------------------------------------------------------------
   * 3. 火柴人骨骼系统 (Sens-Bot 同构 + 蜘蛛丝发射器)
   * ------------------------------------------------------------ */
  let stickStage = null;

  function createStickmanStage() {
    if (stickStage) stickStage.remove();

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.id = "stickmanStage";
    svg.style.cssText =
      "position:fixed;inset:0;pointer-events:none;z-index:99998;width:100vw;height:100vh;";

    svg.innerHTML = `
      <defs>
        <filter id="smGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.6"/>
        </filter>
      </defs>
      <!-- 蜘蛛丝高光韧性线 -->
      <line id="smWebLine" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="4,2" opacity="0"/>
      <!-- 躯干 -->
      <line id="smBody" stroke="#ffffff" stroke-width="3.2" stroke-linecap="round"/>
      <!-- 双臂 -->
      <line id="smArmL" stroke="#ffffff" stroke-width="2.8" stroke-linecap="round"/>
      <line id="smArmR" stroke="#ffffff" stroke-width="2.8" stroke-linecap="round"/>
      <!-- 双腿 -->
      <polyline id="smLegL" stroke="#ffffff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <polyline id="smLegR" stroke="#ffffff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <!-- 头部：Sens-Bot 同构 -->
      <circle id="smHead" r="16" fill="#1c1f28" stroke="#ffffff" stroke-width="2" filter="url(#smGlow)"/>
      <ellipse id="smEyeL" rx="3.6" ry="4.5" fill="#ffffff"/>
      <circle id="smPupilL" r="1.8" fill="#000000"/>
      <ellipse id="smEyeR" rx="3.6" ry="4.5" fill="#ffffff"/>
      <circle id="smPupilR" r="1.8" fill="#000000"/>
    `;
    document.body.appendChild(svg);
    stickStage = svg;
    return svg;
  }

  // 姿态渲染
  // pose: "stand" | "hero_land" | "look_left" | "look_right" | "run1" | "run2" | "squat" | "carry_stand" | "carry_run1" | "carry_run2" | "jump" | "wipe_brow" | "web_shoot" | "tug_pull1" | "tug_pull2" | "tow_walk1" | "tow_walk2"
  function drawStickman(footX, footY, pose = "stand", faceDir = 1, lookDir = 1) {
    if (!stickStage) return;

    const head = stickStage.querySelector("#smHead");
    const eyeL = stickStage.querySelector("#smEyeL");
    const pupilL = stickStage.querySelector("#smPupilL");
    const eyeR = stickStage.querySelector("#smEyeR");
    const pupilR = stickStage.querySelector("#smPupilR");
    const body = stickStage.querySelector("#smBody");
    const armL = stickStage.querySelector("#smArmL");
    const armR = stickStage.querySelector("#smArmR");
    const legL = stickStage.querySelector("#smLegL");
    const legR = stickStage.querySelector("#smLegR");

    let headX = footX;
    let headY = footY - 56;
    let neckY = footY - 40;
    let hipY = footY - 22;

    if (pose === "web_shoot") {
      // 蜘蛛侠单手前指射丝姿态
      body.setAttribute("x1", headX);
      body.setAttribute("y1", neckY);
      body.setAttribute("x2", headX);
      body.setAttribute("y2", hipY);

      // 前手笔直伸出指向目标
      armR.setAttribute("x1", headX);
      armR.setAttribute("y1", neckY + 2);
      armR.setAttribute("x2", headX + 24 * faceDir);
      armR.setAttribute("y2", neckY - 8);

      // 后手微曲在胸前
      armL.setAttribute("x1", headX);
      armL.setAttribute("y1", neckY + 4);
      armL.setAttribute("x2", headX - 12 * faceDir);
      armL.setAttribute("y2", neckY + 12);

      legL.setAttribute(
        "points",
        `${headX},${hipY} ${headX - 8 * faceDir},${footY - 8} ${headX - 8 * faceDir},${footY}`
      );
      legR.setAttribute(
        "points",
        `${headX},${hipY} ${headX + 10 * faceDir},${footY - 8} ${headX + 10 * faceDir},${footY}`
      );
    } else if (pose.startsWith("tug_pull")) {
      // 动作 A：仰角站立拔河拉拽姿态 (双脚前后扎马步，身体大幅后倾用力拉！)
      const isPulling = pose === "tug_pull1";
      const leanBack = -12 * faceDir; // 身体后仰
      headX = footX + leanBack;
      headY = footY - 54;
      neckY = footY - 38;
      hipY = footY - 20;

      body.setAttribute("x1", headX);
      body.setAttribute("y1", neckY);
      body.setAttribute("x2", footX - 4 * faceDir);
      body.setAttribute("y2", hipY);

      // 双手在胸前拉绳 (一收一放)
      const handPullX = isPulling ? headX - 4 * faceDir : headX + 8 * faceDir;
      const handPullY = isPulling ? neckY + 4 : neckY - 6;

      armL.setAttribute("x1", headX);
      armL.setAttribute("y1", neckY + 4);
      armL.setAttribute("x2", handPullX);
      armL.setAttribute("y2", handPullY);

      armR.setAttribute("x1", headX);
      armR.setAttribute("y1", neckY + 4);
      armR.setAttribute("x2", handPullX + 4 * faceDir);
      armR.setAttribute("y2", handPullY + 2);

      // 扎马步前后大迈步
      legL.setAttribute(
        "points",
        `${footX - 4 * faceDir},${hipY} ${footX - 18 * faceDir},${footY - 8} ${footX - 22 * faceDir},${footY}`
      );
      legR.setAttribute(
        "points",
        `${footX - 4 * faceDir},${hipY} ${footX + 12 * faceDir},${footY - 10} ${footX + 16 * faceDir},${footY}`
      );
    } else if (pose.startsWith("tow_walk")) {
      // 动作 B：纤夫扛绳背纤反向拉货姿态 (身体大前倾 38°，蛛丝过肩，用力蹬地！)
      const isStep1 = pose === "tow_walk1";
      const forwardLean = 18 * faceDir; // 身体前倾
      headX = footX + forwardLean;
      headY = footY - 44;
      neckY = footY - 30;
      hipY = footY - 16;

      body.setAttribute("x1", headX);
      body.setAttribute("y1", neckY);
      body.setAttribute("x2", footX);
      body.setAttribute("y2", hipY);

      // 双手在胸前紧握过肩蛛丝
      armL.setAttribute("x1", headX);
      armL.setAttribute("y1", neckY + 2);
      armL.setAttribute("x2", headX - 4 * faceDir);
      armL.setAttribute("y2", neckY + 12);

      armR.setAttribute("x1", headX);
      armR.setAttribute("y1", neckY + 2);
      armR.setAttribute("x2", headX + 8 * faceDir);
      armR.setAttribute("y2", neckY + 8);

      // 沉重蹬地步态
      if (isStep1) {
        legL.setAttribute(
          "points",
          `${footX},${hipY} ${footX - 16 * faceDir},${footY - 10} ${footX - 20 * faceDir},${footY}`
        );
        legR.setAttribute(
          "points",
          `${footX},${hipY} ${footX + 12 * faceDir},${footY - 6} ${footX + 16 * faceDir},${footY}`
        );
      } else {
        legL.setAttribute(
          "points",
          `${footX},${hipY} ${footX + 14 * faceDir},${footY - 10} ${footX + 18 * faceDir},${footY}`
        );
        legR.setAttribute(
          "points",
          `${footX},${hipY} ${footX - 14 * faceDir},${footY - 6} ${footX - 18 * faceDir},${footY}`
        );
      }
    } else if (pose === "hero_land") {
      headY = footY - 32;
      neckY = footY - 22;
      hipY = footY - 12;

      body.setAttribute("x1", headX);
      body.setAttribute("y1", neckY);
      body.setAttribute("x2", headX - 6 * faceDir);
      body.setAttribute("y2", hipY);

      legL.setAttribute(
        "points",
        `${headX - 6 * faceDir},${hipY} ${headX - 16 * faceDir},${footY - 4} ${headX - 18 * faceDir},${footY}`
      );
      legR.setAttribute(
        "points",
        `${headX - 6 * faceDir},${hipY} ${headX + 4 * faceDir},${footY - 8} ${headX + 8 * faceDir},${footY}`
      );

      armL.setAttribute("x1", headX);
      armL.setAttribute("y1", neckY + 2);
      armL.setAttribute("x2", headX + 12 * faceDir);
      armL.setAttribute("y2", footY);

      armR.setAttribute("x1", headX);
      armR.setAttribute("y1", neckY + 2);
      armR.setAttribute("x2", headX - 18 * faceDir);
      armR.setAttribute("y2", neckY - 8);
    } else if (pose === "wipe_brow") {
      body.setAttribute("x1", headX);
      body.setAttribute("y1", neckY);
      body.setAttribute("x2", headX);
      body.setAttribute("y2", hipY);

      legL.setAttribute(
        "points",
        `${headX},${hipY} ${headX - 6},${footY - 10} ${headX - 6},${footY}`
      );
      legR.setAttribute(
        "points",
        `${headX},${hipY} ${headX + 6},${footY - 10} ${headX + 6},${footY}`
      );

      armR.setAttribute("x1", headX);
      armR.setAttribute("y1", neckY + 2);
      armR.setAttribute("x2", headX + 8);
      armR.setAttribute("y2", headY + 2);

      armL.setAttribute("x1", headX);
      armL.setAttribute("y1", neckY + 4);
      armL.setAttribute("x2", headX - 11);
      armL.setAttribute("y2", neckY + 18);
    } else if (pose === "squat") {
      headY = footY - 40;
      neckY = footY - 28;
      hipY = footY - 14;

      body.setAttribute("x1", headX);
      body.setAttribute("y1", neckY);
      body.setAttribute("x2", headX);
      body.setAttribute("y2", hipY);

      legL.setAttribute(
        "points",
        `${headX},${hipY} ${headX - 12 * faceDir},${footY - 8} ${headX - 5 * faceDir},${footY}`
      );
      legR.setAttribute(
        "points",
        `${headX},${hipY} ${headX + 12 * faceDir},${footY - 8} ${headX + 5 * faceDir},${footY}`
      );

      armL.setAttribute("x1", headX);
      armL.setAttribute("y1", neckY + 2);
      armL.setAttribute("x2", headX - 12);
      armL.setAttribute("y2", headY - 12);

      armR.setAttribute("x1", headX);
      armR.setAttribute("y1", neckY + 2);
      armR.setAttribute("x2", headX + 12);
      armR.setAttribute("y2", headY - 12);
    } else if (pose.startsWith("carry")) {
      body.setAttribute("x1", headX);
      body.setAttribute("y1", neckY);
      body.setAttribute("x2", headX);
      body.setAttribute("y2", hipY);

      armL.setAttribute("x1", headX);
      armL.setAttribute("y1", neckY + 2);
      armL.setAttribute("x2", headX - 14);
      armL.setAttribute("y2", headY - 14);

      armR.setAttribute("x1", headX);
      armR.setAttribute("y1", neckY + 2);
      armR.setAttribute("x2", headX + 14);
      armR.setAttribute("y2", headY - 14);

      if (pose === "carry_run1") {
        legL.setAttribute(
          "points",
          `${headX},${hipY} ${headX - 12 * faceDir},${footY - 12} ${headX - 16 * faceDir},${footY}`
        );
        legR.setAttribute(
          "points",
          `${headX},${hipY} ${headX + 10 * faceDir},${footY - 8} ${headX + 14 * faceDir},${footY}`
        );
      } else if (pose === "carry_run2") {
        legL.setAttribute(
          "points",
          `${headX},${hipY} ${headX + 12 * faceDir},${footY - 10} ${headX + 16 * faceDir},${footY}`
        );
        legR.setAttribute(
          "points",
          `${headX},${hipY} ${headX - 10 * faceDir},${footY - 8} ${headX - 14 * faceDir},${footY}`
        );
      } else {
        legL.setAttribute(
          "points",
          `${headX},${hipY} ${headX - 6},${footY - 10} ${headX - 6},${footY}`
        );
        legR.setAttribute(
          "points",
          `${headX},${hipY} ${headX + 6},${footY - 10} ${headX + 6},${footY}`
        );
      }
    } else if (pose.startsWith("run")) {
      body.setAttribute("x1", headX);
      body.setAttribute("y1", neckY);
      body.setAttribute("x2", headX);
      body.setAttribute("y2", hipY);

      if (pose === "run1") {
        legL.setAttribute(
          "points",
          `${headX},${hipY} ${headX - 14 * faceDir},${footY - 12} ${headX - 18 * faceDir},${footY}`
        );
        legR.setAttribute(
          "points",
          `${headX},${hipY} ${headX + 10 * faceDir},${footY - 8} ${headX + 14 * faceDir},${footY}`
        );
        armL.setAttribute("x1", headX);
        armL.setAttribute("y1", neckY + 4);
        armL.setAttribute("x2", headX + 14 * faceDir);
        armL.setAttribute("y2", neckY + 12);
        armR.setAttribute("x1", headX);
        armR.setAttribute("y1", neckY + 4);
        armR.setAttribute("x2", headX - 14 * faceDir);
        armR.setAttribute("y2", neckY + 12);
      } else {
        legL.setAttribute(
          "points",
          `${headX},${hipY} ${headX + 14 * faceDir},${footY - 12} ${headX + 18 * faceDir},${footY}`
        );
        legR.setAttribute(
          "points",
          `${headX},${hipY} ${headX - 10 * faceDir},${footY - 8} ${headX - 14 * faceDir},${footY}`
        );
        armL.setAttribute("x1", headX);
        armL.setAttribute("y1", neckY + 4);
        armL.setAttribute("x2", headX - 14 * faceDir);
        armL.setAttribute("y2", neckY + 12);
        armR.setAttribute("x1", headX);
        armR.setAttribute("y1", neckY + 4);
        armR.setAttribute("x2", headX + 14 * faceDir);
        armR.setAttribute("y2", neckY + 12);
      }
    } else if (pose === "jump") {
      body.setAttribute("x1", headX);
      body.setAttribute("y1", neckY);
      body.setAttribute("x2", headX);
      body.setAttribute("y2", hipY);

      legL.setAttribute(
        "points",
        `${headX},${hipY} ${headX - 8 * faceDir},${hipY + 8} ${headX - 12 * faceDir},${hipY + 20}`
      );
      legR.setAttribute(
        "points",
        `${headX},${hipY} ${headX + 6 * faceDir},${hipY + 10} ${headX + 10 * faceDir},${hipY + 22}`
      );

      armL.setAttribute("x1", headX);
      armL.setAttribute("y1", neckY + 2);
      armL.setAttribute("x2", headX - 16 * faceDir);
      armL.setAttribute("y2", neckY - 12);

      armR.setAttribute("x1", headX);
      armR.setAttribute("y1", neckY + 2);
      armR.setAttribute("x2", headX + 16 * faceDir);
      armR.setAttribute("y2", neckY - 12);
    } else {
      body.setAttribute("x1", headX);
      body.setAttribute("y1", neckY);
      body.setAttribute("x2", headX);
      body.setAttribute("y2", hipY);

      legL.setAttribute(
        "points",
        `${headX},${hipY} ${headX - 6},${footY - 10} ${headX - 6},${footY}`
      );
      legR.setAttribute(
        "points",
        `${headX},${hipY} ${headX + 6},${footY - 10} ${headX + 6},${footY}`
      );

      armL.setAttribute("x1", headX);
      armL.setAttribute("y1", neckY + 4);
      armL.setAttribute("x2", headX - 11);
      armL.setAttribute("y2", neckY + 18);

      armR.setAttribute("x1", headX);
      armR.setAttribute("y1", neckY + 4);
      armR.setAttribute("x2", headX + 11);
      armR.setAttribute("y2", neckY + 18);
    }

    head.setAttribute("cx", headX);
    head.setAttribute("cy", headY);

    const eyeBaseX_L = headX - 5;
    const eyeBaseX_R = headX + 5;
    const eyeY = headY - 1;

    eyeL.setAttribute("cx", eyeBaseX_L);
    eyeL.setAttribute("cy", eyeY);
    eyeR.setAttribute("cx", eyeBaseX_R);
    eyeR.setAttribute("cy", eyeY);

    let pupilOffsetX = 0;
    let pupilOffsetY = 0;
    if (lookDir === "down") {
      pupilOffsetY = 2.2;
    } else if (lookDir === "up") {
      pupilOffsetY = -2.2;
    } else if (lookDir > 0) {
      pupilOffsetX = 1.8;
    } else if (lookDir < 0) {
      pupilOffsetX = -1.8;
    }

    pupilL.setAttribute("cx", eyeBaseX_L + pupilOffsetX);
    pupilL.setAttribute("cy", eyeY + pupilOffsetY);
    pupilR.setAttribute("cx", eyeBaseX_R + pupilOffsetX);
    pupilR.setAttribute("cy", eyeY + pupilOffsetY);
  }

  // 绘制/隐藏蛛丝
  function drawWebLine(x1, y1, x2, y2, visible = true) {
    if (!stickStage) return;
    const web = stickStage.querySelector("#smWebLine");
    if (!web) return;
    if (!visible) {
      web.setAttribute("opacity", "0");
      return;
    }
    web.setAttribute("x1", x1);
    web.setAttribute("y1", y1);
    web.setAttribute("x2", x2);
    web.setAttribute("y2", y2);
    web.setAttribute("opacity", "0.9");
  }

  /* ------------------------------------------------------------
   * 4. 跑动、跳跃、蛛丝拉货动力学引擎
   * ------------------------------------------------------------ */

  function animateRun(startX, targetX, y, duration, isCarrying, carriedCardObj, onComplete) {
    const startTime = performance.now();
    const faceDir = targetX >= startX ? 1 : -1;

    function step(now) {
      const elapsed = now - startTime;
      const p = Math.min(1, elapsed / duration);
      const curX = startX + (targetX - startX) * p;

      const legPhase = Math.floor(elapsed / 150) % 2;
      const pose = isCarrying
        ? legPhase === 0
          ? "carry_run1"
          : "carry_run2"
        : legPhase === 0
        ? "run1"
        : "run2";

      drawStickman(curX, y, pose, faceDir, faceDir);

      if (isCarrying && carriedCardObj) {
        updateCarriedPosition(curX, y, carriedCardObj);
      }

      if (p < 1) {
        requestAnimationFrame(step);
      } else {
        drawStickman(targetX, y, isCarrying ? "carry_stand" : "stand", faceDir);
        if (isCarrying && carriedCardObj) {
          updateCarriedPosition(targetX, y, carriedCardObj);
        }
        if (onComplete) onComplete();
      }
    }
    requestAnimationFrame(step);
  }

  function animateStepJump(startX, startY, endX, endY, isCarrying, carriedCardObj, onComplete) {
    const startTime = performance.now();
    const jumpDuration = 620;
    const faceDir = endX >= startX ? 1 : -1;

    const arcHeight = Math.max(65, Math.abs(endY - startY) + 36);
    const midX = (startX + endX) / 2;
    const peakY = Math.min(startY, endY) - arcHeight;

    SoundFx.jump();

    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / jumpDuration);
      const t = progress;

      const curX =
        (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * midX + t * t * endX;
      const curY =
        (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * peakY + t * t * endY;

      const pose = isCarrying
        ? "carry_stand"
        : progress < 0.85
        ? "jump"
        : "squat";
      drawStickman(curX, curY, pose, faceDir, faceDir);

      if (isCarrying && carriedCardObj) {
        updateCarriedPosition(curX, curY, carriedCardObj);
      }

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        drawStickman(endX, endY, isCarrying ? "carry_stand" : "stand", faceDir);
        SoundFx.snap();
        if (isCarrying && carriedCardObj) {
          updateCarriedPosition(endX, endY, carriedCardObj);
        }
        if (onComplete) onComplete();
      }
    }
    requestAnimationFrame(step);
  }

  function updateCarriedPosition(footX, footY, cardObj) {
    const cardEl = cardObj.el;
    const headY = footY - 56;
    const handsY = headY - 14;

    const cardW = cardObj.homeW;
    const cardH = cardObj.homeH;
    const left = footX - cardW / 2;
    const top = handsY - cardH;

    cardEl.style.position = "fixed";
    cardEl.style.left = `${left.toFixed(1)}px`;
    cardEl.style.top = `${top.toFixed(1)}px`;
    cardEl.style.transform = "none";
  }

  /* ------------------------------------------------------------
   * 🕷️ 核心新技能: 蜘蛛丝拉货动力学 (动作A: 高空拔河 / 动作B: 纤夫反向拉货)
   * ------------------------------------------------------------ */
  function reelCardWithSpiderWeb(stickFootX, stickFootY, cardObj, onReeled) {
    const cardEl = cardObj.el;
    cardObj.isBeingReeled = true; // 暂停随机慢漂

    const cardRect = cardEl.getBoundingClientRect();
    const cardCenterX = cardRect.left + cardRect.width / 2;
    const cardCenterY = cardRect.top + cardRect.height / 2;

    const faceDir = cardCenterX >= stickFootX ? 1 : -1;

    // 1. 射出蜘蛛丝姿态
    drawStickman(stickFootX, stickFootY, "web_shoot", faceDir, faceDir);
    SoundFx.webShoot();

    // 蛛丝飞速射向卡片中心
    const shootStartTime = performance.now();
    const shootDuration = 180;

    function shootStep(now) {
      const p = Math.min(1, (now - shootStartTime) / shootDuration);
      const startHandX = stickFootX + 24 * faceDir;
      const startHandY = stickFootY - 48;

      const webTipX = startHandX + (cardCenterX - startHandX) * p;
      const webTipY = startHandY + (cardCenterY - startHandY) * p;

      drawWebLine(startHandX, startHandY, webTipX, webTipY, true);

      if (p < 1) {
        requestAnimationFrame(shootStep);
      } else {
        // 钉中卡片瞬间微震
        createBurst(cardCenterX, cardCenterY, 8);
        SoundFx.snap();

        // 判定拉取动作类型:
        // 高度差大 (>120px) -> 动作 A: 仰天拔河
        // 否则 -> 动作 B: 纤夫反向扛绳走
        const isHighAltitude = cardCenterY < stickFootY - 120;

        if (isHighAltitude) {
          executeHighTugOfWar(stickFootX, stickFootY, cardObj, onReeled);
        } else {
          executeShoulderTowing(stickFootX, stickFootY, cardObj, onReeled);
        }
      }
    }
    requestAnimationFrame(shootStep);
  }

  // 动作 A: 仰角站立拔河拉拽 (双手用力后仰拔河，把天上的卡片斜向拉下来)
  function executeHighTugOfWar(footX, footY, cardObj, onDone) {
    const cardEl = cardObj.el;
    const initRect = cardEl.getBoundingClientRect();
    const startCardX = initRect.left;
    const startCardY = initRect.top;

    // 目标点：精准拉到火柴人头顶上方可抱持区域
    const targetCardX = footX - cardObj.homeW / 2;
    const targetCardY = footY - 70 - cardObj.homeH;

    const pullStartTime = performance.now();
    const pullDuration = 1100;

    function pullStep(now) {
      const elapsed = now - pullStartTime;
      const p = Math.min(1, elapsed / pullDuration);

      // 拔河发力周期
      const pullPhase = Math.floor(elapsed / 180) % 2;
      const pose = pullPhase === 0 ? "tug_pull1" : "tug_pull2";
      if (pullPhase === 0 && Math.floor(elapsed / 180) !== 0) {
        SoundFx.webTug();
      }

      drawStickman(footX, footY, pose, 1, "up");

      // 卡片加速滑行拉近
      const curCardX = startCardX + (targetCardX - startCardX) * (p * p);
      const curCardY = startCardY + (targetCardY - startCardY) * (p * p);

      // 【关键修复】：每一帧同步更新 fixed 坐标，防止任何闪退！
      cardObj.fixedX = curCardX;
      cardObj.fixedY = curCardY;
      cardEl.style.left = `${curCardX.toFixed(1)}px`;
      cardEl.style.top = `${curCardY.toFixed(1)}px`;
      cardEl.style.transform = `rotate(${((1 - p) * 8).toFixed(1)}deg)`;

      // 更新蛛丝连接线
      const handX = footX - 4;
      const handY = footY - 42;
      drawWebLine(handX, handY, curCardX + cardObj.homeW / 2, curCardY + cardObj.homeH, true);

      if (p < 1) {
        requestAnimationFrame(pullStep);
      } else {
        // 拉到位：收回蛛丝，立即无缝转入托运态 (彻底杜绝闪回！)
        drawWebLine(0, 0, 0, 0, false);
        cardObj.isBeingReeled = false;
        createBurst(targetCardX + cardObj.homeW / 2, targetCardY + cardObj.homeH, 12);

        onDone(footX, footY, true); // 传参 isAlreadyAtHands = true
      }
    }
    requestAnimationFrame(pullStep);
  }

  // 动作 B: 纤夫扛绳背纤反向拉货 (身体大前倾 38°，反方向沉重蹬地迈步拉货！)
  function executeShoulderTowing(footX, footY, cardObj, onDone) {
    const cardEl = cardObj.el;
    const initRect = cardEl.getBoundingClientRect();
    const startCardX = initRect.left;
    const startCardY = initRect.top;

    const pullDir = startCardX >= footX ? -1 : 1; // 反方向走！卡片在右，人向左拉
    const towDist = 140 * pullDir;
    const startWalkX = footX;
    const endWalkX = footX + towDist;

    const towStartTime = performance.now();
    const towDuration = 1350;

    function towStep(now) {
      const elapsed = now - towStartTime;
      const p = Math.min(1, elapsed / towDuration);

      // 火柴人反方向迈大步
      const curWalkX = startWalkX + (endWalkX - startWalkX) * p;
      const stepPhase = Math.floor(elapsed / 160) % 2;
      const pose = stepPhase === 0 ? "tow_walk1" : "tow_walk2";

      if (stepPhase === 0) {
        SoundFx.webTug();
        createBurst(curWalkX - 8 * pullDir, footY, 3);
      }

      drawStickman(curWalkX, footY, pose, pullDir, pullDir);

      // 【关键修复】：身后的卡片在每一帧真正被蛛丝拖拽拉近！
      const targetCardX = curWalkX - (cardObj.homeW / 2 + 20) * pullDir;
      const curCardX = startCardX + (targetCardX - startCardX) * (p * 1.15);

      cardObj.fixedX = curCardX;
      cardObj.fixedY = startCardY;
      cardEl.style.left = `${curCardX.toFixed(1)}px`;
      cardEl.style.top = `${startCardY.toFixed(1)}px`;
      cardEl.style.transform = `rotate(${(pullDir * 5).toFixed(1)}deg)`;

      // 蛛丝跨过火柴人肩膀连到卡片内侧边缘
      const shoulderX = curWalkX + 6 * pullDir;
      const shoulderY = footY - 42;
      const cardAttachX = pullDir > 0 ? curCardX : curCardX + cardObj.homeW;
      const cardAttachY = startCardY + cardObj.homeH / 2;

      drawWebLine(shoulderX, shoulderY, cardAttachX, cardAttachY, true);

      if (p < 1) {
        requestAnimationFrame(towStep);
      } else {
        drawWebLine(0, 0, 0, 0, false);
        cardObj.isBeingReeled = false;
        createBurst(curCardX + cardObj.homeW / 2, startCardY + cardObj.homeH / 2, 12);

        onDone(curWalkX, footY, false); // 拉到身边，火柴人转身托起
      }
    }
    requestAnimationFrame(towStep);
  }

  // 逐级跳跃导航引擎 (严格区分向上攀爬与向下落地，绝不反常爬顶)
  function navigateTo(startX, startY, targetX, targetY, isCarrying, carriedCardObj, onArrived) {
    const MAX_STEP_UP = 135;
    const heightDiff = startY - targetY; // >0 表示目标在上方高处；<0 表示目标在下方低处

    // 1. 同一水平高度 (高差 <= 20px)：直接迈开步伐奔跑
    if (Math.abs(heightDiff) <= 20) {
      const runDist = Math.abs(targetX - startX);
      const runDuration = Math.min(1000, Math.max(250, runDist * 2.2));
      animateRun(startX, targetX, targetY, runDuration, isCarrying, carriedCardObj, () => {
        onArrived(targetX, targetY);
      });
      return;
    }

    // 2. 【核心修复】：目标在【下方低处】(heightDiff < -20，即 targetY > startY)
    // 物理重力自然下跳，直接优雅向下跳跃着地，绝不再向上爬楼梯！
    if (heightDiff < -20) {
      animateStepJump(startX, startY, targetX, targetY, isCarrying, carriedCardObj, () => {
        onArrived(targetX, targetY);
      });
      return;
    }

    // 3. 目标在【上方高处】(heightDiff > 20，即 targetY < startY)
    // 3.1 高差在单阶跳跃极限内：直接起跳跃上
    if (heightDiff <= MAX_STEP_UP) {
      animateStepJump(startX, startY, targetX, targetY, isCarrying, carriedCardObj, () => {
        onArrived(targetX, targetY);
      });
      return;
    }

    // 3.2 高差较大需要搭梯子：寻找位于 startY 与 targetY 区间内的顺路台阶 (绝不高过目标！)
    const candidateSteps = Array.from(cardStates.values())
      .filter((st) => !st.isDisplaced)
      .map((st) => {
        const r = st.el.getBoundingClientRect();
        return {
          topX: r.left + r.width / 2,
          topY: r.top,
        };
      })
      // 必须高于火柴人当前脚底，且在单次起跳能力范围内，同时【绝对不能高于目标高度】！
      .filter(
        (pt) =>
          pt.topY < startY - 18 &&
          pt.topY >= startY - MAX_STEP_UP - 45 &&
          pt.topY >= targetY - 30
      );

    if (candidateSteps.length > 0) {
      // 就近顺路排序
      candidateSteps.sort((a, b) => {
        const costA = Math.abs(a.topX - startX) + Math.abs(a.topX - targetX) * 0.35;
        const costB = Math.abs(b.topX - startX) + Math.abs(b.topX - targetX) * 0.35;
        return costA - costB;
      });

      const stepPt = candidateSteps[0];
      animateStepJump(startX, startY, stepPt.topX, stepPt.topY, isCarrying, carriedCardObj, () => {
        navigateTo(
          stepPt.topX,
          stepPt.topY,
          targetX,
          targetY,
          isCarrying,
          carriedCardObj,
          onArrived
        );
      });
    } else {
      // 无合适中继阶梯时，直接大跳向目标
      animateStepJump(startX, startY, targetX, targetY, isCarrying, carriedCardObj, () => {
        onArrived(targetX, targetY);
      });
    }
  }

  /* ------------------------------------------------------------
   * 5. 火柴人救援总动员：蛛丝拉取 + 底层地基优先 + 托运放置
   * ------------------------------------------------------------ */
  function startStickmanRescueMission(botEl, bubbleEl, onFinished) {
    isHeroRunning = true;
    createStickmanStage();

    const botRect = botEl.getBoundingClientRect();
    const startX = botRect.left + botRect.width / 2;
    const startY = botRect.top + botRect.height / 2;

    botEl.style.opacity = "0";

    const groundY = window.innerHeight - 55;
    const dropTime = 820;
    const dropStart = performance.now();

    function heroDrop(now) {
      const t = Math.min(1, (now - dropStart) / dropTime);
      const curY = startY + (groundY - startY) * (t * t);
      drawStickman(startX, curY, "jump", 1, "down");

      if (t < 1) {
        requestAnimationFrame(heroDrop);
      } else {
        // 落地三点式缓冲
        drawStickman(startX, groundY, "hero_land", 1, "down");
        SoundFx.snap();
        createBurst(startX, groundY, 18);

        setTimeout(() => {
          drawStickman(startX, groundY, "stand", -1, -1);
          setTimeout(() => {
            drawStickman(startX, groundY, "stand", 1, 1);
            setTimeout(() => {
              startNextDelivery(startX, groundY, 0, onFinished);
            }, 220);
          }, 220);
        }, 380);
      }
    }
    requestAnimationFrame(heroDrop);
  }

  function startNextDelivery(curFootX, curFootY, comboCount, onFinished) {
    const displacedList = Array.from(cardStates.values()).filter(
      (st) => st.isDisplaced
    );

    if (displacedList.length === 0) {
      finishMission(curFootX, curFootY, onFinished);
      return;
    }

    // 【智能最近线路决策 (Greedy Nearest Route Decision)】
    // 1. 物理重力层级约束：找出当前未归位卡片中属于最底层的槽位 Y
    let maxHomeY = -Infinity;
    displacedList.forEach((st) => {
      if (st.homeY > maxHomeY) maxHomeY = st.homeY;
    });

    // 2. 属于当前底层或同一行作业范围 (高差 130px 内) 的所有卡片进入候选任务池
    const candidates = displacedList.filter((st) => st.homeY >= maxHomeY - 130);

    // 3. 在候选卡片中，计算火柴人从当前站位 (curFootX, curFootY) 的综合往返路线代价，
    //    选出离火柴人脚底最近、搬运路线最短的最优目标！(绝不再跨屏折返跑！)
    let bestTarget = candidates[0];
    let minRouteCost = Infinity;

    candidates.forEach((st) => {
      const r = st.el.getBoundingClientRect();
      const cardX = r.left + r.width / 2;
      const cardY = r.top + r.height / 2;

      // 跑过去拾取卡片的距离 (权重高，优先就近接活)
      const distPickup = Math.hypot(cardX - curFootX, cardY - curFootY);
      // 从拾取点送回目标槽位的距离
      const destX = st.homeX + st.homeW / 2;
      const destY = st.homeY + st.homeH / 2;
      const distDrop = Math.hypot(destX - cardX, destY - cardY);

      const totalCost = distPickup * 1.4 + distDrop * 0.6;
      if (totalCost < minRouteCost) {
        minRouteCost = totalCost;
        bestTarget = st;
      }
    });

    const targetObj = bestTarget;
    const targetCardEl = targetObj.el;

    const currentCardRect = targetCardEl.getBoundingClientRect();
    const cardCenterX = currentCardRect.left + currentCardRect.width / 2;
    const cardCenterY = currentCardRect.top + currentCardRect.height / 2;

    // 【关键修复 1：严格空间相对位置判定，下方卡片绝不拉货】
    // deltaY > 0 表示卡片在火柴人上方高空；deltaY <= 0 表示卡片在火柴人脚下/下方
    const deltaY = curFootY - cardCenterY;
    const deltaX = Math.abs(cardCenterX - curFootX);

    // 只有高空悬挂 (deltaY > 140px) 或 极远侧翼 (deltaX > 320px 且不在下方) 才触发蜘蛛丝拉货！
    // 下方或同高度的卡片 (deltaY <= 80px)：火柴人直接走过去/跳下去托起，绝不触发多余拉拽！
    const isHighAltitude = deltaY > 140;
    const isFarSides = deltaX > 320 && deltaY > -60;
    const needsSpiderWeb = isHighAltitude || isFarSides;

    const proceedToCarry = (readyFootX, readyFootY, isAlreadyAtHands = false) => {
      const startCarryHop = () => {
        // 双手稳稳托运卡片，逐级跳阶跑向原生槽位
        const destFootX = targetObj.homeX + targetObj.homeW / 2;
        const destFootY = targetObj.homeY + targetObj.homeH;

        navigateTo(
          readyFootX,
          readyFootY,
          destFootX,
          destFootY,
          true,
          targetObj,
          (dockX, dockY) => {
            drawStickman(dockX, dockY, "carry_stand", 1, "down");

            setTimeout(() => {
              // 【核心修复：丝滑平滑下放嵌合入槽，绝不瞬移！】
              const startPlaceLeft =
                parseFloat(targetCardEl.style.left) ||
                dockX - targetObj.homeW / 2;
              const startPlaceTop =
                parseFloat(targetCardEl.style.top) ||
                dockY - 70 - targetObj.homeH;

              const destPlaceLeft = targetObj.homeX;
              const destPlaceTop = targetObj.homeY;

              const placeStartTime = performance.now();
              const placeDuration = 300; // 300ms 从容平滑送入槽位

              // 火柴人双臂向下顺势沉稳送入
              drawStickman(dockX, dockY, "squat", 1, "down");

              function placeStep(pNow) {
                const p = Math.min(1, (pNow - placeStartTime) / placeDuration);
                const easeP = 1 - (1 - p) * (1 - p); // 平滑减速

                const curL =
                  startPlaceLeft + (destPlaceLeft - startPlaceLeft) * easeP;
                const curT =
                  startPlaceTop + (destPlaceTop - startPlaceTop) * easeP;

                targetCardEl.style.left = `${curL.toFixed(1)}px`;
                targetCardEl.style.top = `${curT.toFixed(1)}px`;
                targetCardEl.style.transform = "none";

                if (p < 1) {
                  requestAnimationFrame(placeStep);
                } else {
                  // 精准到位！彻底解除 fixed，平滑替换占位符，0 像素瞬移跳变！
                  targetObj.isCarried = false;
                  targetObj.isDisplaced = false;

                  if (targetObj.placeholder) {
                    targetObj.placeholder.replaceWith(targetCardEl);
                    targetObj.placeholder = null;
                  }

                  targetCardEl.classList.remove("is-carried", "is-displaced");
                  targetCardEl.classList.add("snap-highlight");
                  setTimeout(
                    () => targetCardEl.classList.remove("snap-highlight"),
                    500
                  );

                  targetCardEl.style.position = "";
                  targetCardEl.style.left = "";
                  targetCardEl.style.top = "";
                  targetCardEl.style.width = "";
                  targetCardEl.style.height = "";
                  targetCardEl.style.margin = "";
                  targetCardEl.style.zIndex = "";
                  targetCardEl.style.transform = "none";

                  SoundFx.snapLock(comboCount);
                  createBurst(dockX, targetObj.homeY + targetObj.homeH / 2, 16);

                  // 单手擦汗放松动作 (350ms)
                  drawStickman(dockX, dockY, "wipe_brow", 1, 1);

                  setTimeout(() => {
                    drawStickman(dockX, dockY, "stand", 1, 1);
                    setTimeout(() => {
                      // 搬下一张！
                      startNextDelivery(dockX, dockY, comboCount + 1, onFinished);
                    }, 240);
                  }, 350);
                }
              }

              requestAnimationFrame(placeStep);
            }, 160);
          }
        );
      };

      if (isAlreadyAtHands) {
        // 已经拉到头顶双手上了！直接无缝锁定进入托运态，0 帧延时，彻底不闪回！
        targetObj.isCarried = true;
        targetCardEl.classList.add("is-carried");
        updateCarriedPosition(readyFootX, readyFootY, targetObj);
        drawStickman(readyFootX, readyFootY, "carry_stand", 1, "up");

        setTimeout(startCarryHop, 180);
        return;
      }
      // 跑到卡片下方仰头看 (220ms)
      drawStickman(readyFootX, readyFootY, "stand", 1, "up");

      setTimeout(() => {
        // 深蹲双手上举准备 (300ms)
        drawStickman(readyFootX, readyFootY, "squat", 1, "up");

        setTimeout(() => {
          // 双腿蹬起，高高托举起卡片！
          targetObj.isCarried = true;
          targetCardEl.classList.add("is-carried");
          SoundFx.lift();

          updateCarriedPosition(readyFootX, readyFootY, targetObj);
          drawStickman(readyFootX, readyFootY, "carry_stand", 1, "up");

          setTimeout(() => {
            startCarryHop();
          }, 220);
        }, 300);
      }, 220);
    };

    if (needsSpiderWeb) {
      // 激活蜘蛛丝拉货神技能！
      reelCardWithSpiderWeb(curFootX, curFootY, targetObj, (afterReelX, afterReelY, isAlreadyAtHands) => {
        proceedToCarry(afterReelX, afterReelY, isAlreadyAtHands);
      });
    } else {
      // 在常规行走范围内：正常跑向卡片下方 (若卡片贴近地面则站于侧边，脚底绝不陷出屏幕！)
      const groundLevel = window.innerHeight - 55;
      let pickupX = cardCenterX;
      let pickupY = Math.min(groundLevel, currentCardRect.top + currentCardRect.height + 16);

      if (currentCardRect.bottom >= groundLevel - 15) {
        pickupY = groundLevel;
        pickupX = curFootX < cardCenterX ? currentCardRect.left - 24 : currentCardRect.right + 24;
        pickupX = clamp(pickupX, 20, window.innerWidth - 20);
      }

      navigateTo(curFootX, curFootY, pickupX, pickupY, false, null, (atX, atY) => {
        proceedToCarry(atX, atY, false);
      });
    }
  }

  function finishMission(lastX, lastY, onFinished) {
    SoundFx.victory();

    const botEl = document.getElementById("sensBot");
    const botRect = botEl.getBoundingClientRect();
    const destX = botRect.left + botRect.width / 2;
    const destY = botRect.top + botRect.height / 2;

    drawStickman(lastX, lastY, "wipe_brow", 1, "up");

    setTimeout(() => {
      animateStepJump(lastX, lastY, destX, destY, false, null, () => {
        if (stickStage) {
          stickStage.remove();
          stickStage = null;
        }

        botEl.style.opacity = "1";
        botEl.classList.add("squish");
        setTimeout(() => botEl.classList.remove("squish"), 350);

        isHeroRunning = false;
        if (onFinished) onFinished();
      });
    }, 300);
  }

  /* ------------------------------------------------------------
   * 6. 顶栏小宠物 (Sens-Bot) 交互控制器
   * ------------------------------------------------------------ */
  let botClicks = 0;
  let resetClickTimer = 0;

  function initSensBot() {
    const bot = document.getElementById("sensBot");
    if (!bot) return;

    const eyeL = bot.querySelector(".pupil-left");
    const eyeR = bot.querySelector(".pupil-right");
    const bubble = document.getElementById("botBubble");

    window.addEventListener("pointermove", (e) => {
      if (!eyeL || !eyeR || isHeroRunning) return;
      const rect = bot.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const angle = Math.atan2(e.clientY - cy, e.clientX - cx);
      const dist = Math.min(4, Math.hypot(e.clientX - cx, e.clientY - cy) / 40);

      eyeL.style.transform = `translate(${Math.cos(angle) * dist}px, ${
        Math.sin(angle) * dist
      }px)`;
      eyeR.style.transform = `translate(${Math.cos(angle) * dist}px, ${
        Math.sin(angle) * dist
      }px)`;
    });

    let bubbleTimer = 0;
    const showBubble = (text, duration = 3400) => {
      bubble.textContent = text;
      bubble.classList.add("show");
      clearTimeout(bubbleTimer);
      bubbleTimer = setTimeout(() => {
        bubble.classList.remove("show");
      }, duration);
    };

    bot.addEventListener("click", (e) => {
      e.stopPropagation();
      if (isHeroRunning) return;

      bot.classList.add("squish");
      setTimeout(() => bot.classList.remove("squish"), 300);

      botClicks++;
      clearTimeout(resetClickTimer);
      resetClickTimer = setTimeout(() => {
        botClicks = 0;
      }, 6000);

      const displacedCount = Array.from(cardStates.values()).filter(
        (st) => st.isDisplaced
      ).length;

      if (botClicks < 5) {
        if (displacedCount > 0) {
          showBubble(
            `发现有 ${displacedCount} 张卡片被你甩散了！再戳 ${
              5 - botClicks
            } 下我就去搬！`,
            3000
          );
        } else {
          const tips = [
            "你可以随意用鼠标把卡片甩到屏幕任意地方！(1/5)",
            "甩到远处的卡片，火柴人会射出蜘蛛丝拉回来哦！(2/5)",
            "把卡片搞乱之后，戳我 5 下我就下来帮你搬回原位！(3/5)",
            "准备好了吗？再戳一次召唤火柴人建筑工！(4/5)",
          ];
          showBubble(tips[(botClicks - 1) % tips.length], 3000);
        }
      } else if (botClicks >= 5) {
        botClicks = 0;

        if (displacedCount === 0) {
          showBubble(
            "卡片都很整齐呀！你先用鼠标把卡片甩到远处，我再帮你搬！(๑•̀ㅂ•́)و✧",
            4000
          );
        } else {
          showBubble(
            `🕷️ 收到！检测到 ${displacedCount} 张散落卡片！蛛丝发射，开工整理！`,
            3500
          );
          startStickmanRescueMission(bot, bubble, () => {
            showBubble(
              "✨ 呼！所有卡片已全部码齐归位！帅吧？(๑•̀ㅂ•́)و✧",
              4500
            );
          });
        }
      }
    });
  }

  /* ------------------------------------------------------------
   * 7. 物理音效静音切换
   * ------------------------------------------------------------ */
  function initMuteToggle() {
    const muteBtn = document.getElementById("muteToggle");
    if (!muteBtn) return;

    muteBtn.addEventListener("click", () => {
      const enabled = SoundFx.toggleMute();
      muteBtn.classList.toggle("muted", !enabled);
      muteBtn.setAttribute(
        "title",
        enabled ? "点击静音物理音效" : "点击开启物理音效"
      );
      if (enabled) SoundFx.click();
    });
  }

  window.Interactive = {
    init: () => {
      recordSlots();
      initCardDrag();
      initSensBot();
      initMuteToggle();

      window.addEventListener("resize", () => {
        recordSlots();
      });
    },
    recordSlots,
  };
})();
