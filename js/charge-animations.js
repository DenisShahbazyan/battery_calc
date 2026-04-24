// Анимация принципа основного заряда во всплывающем окне:
// зарядник выдает максимальный ток, АКБ берёт столько, сколько может.
// По мере заполнения ток падает до порога → переход к следующему этапу (~85–90%).
// Использование: ChargeAnimation.open({ maxI: 6.0, offI: 0.2 })
window.ChargeAnimation = (function () {
  const CFG = {
    maxI: 6.0,
    offI: 0.2,
    socStart: 20,
    socEnd: 88,
    ccPart: 0.25, // доля времени, когда АКБ берёт максимальный ток
  };
  const CYCLE = 9000; // длительность анимации заряда, мс
  const HOLD = 2600; // пауза на финале, мс

  let K = 1, Q_TOTAL = 1;
  function configure(maxI, offI) {
    CFG.maxI = maxI > 0 ? maxI : 6.0;
    // порог должен быть заметно меньше максимума, иначе кривая теряет смысл
    CFG.offI = offI > 0 ? Math.min(offI, CFG.maxI / 3) : CFG.maxI / 30;
    K = Math.log(CFG.maxI / CFG.offI);
    Q_TOTAL = CFG.ccPart + ((1 - CFG.ccPart) * (1 - Math.exp(-K))) / K;
  }

  // Модель: сначала ток на максимуме, затем экспоненциально падает до порога.
  // Заряженность растёт пропорционально принятому току (быстро в начале, медленно в конце).
  function sim(p) {
    p = Math.max(0, Math.min(1, p));
    const a = CFG.ccPart;
    let I, Q;
    if (p < a) {
      I = CFG.maxI;
      Q = p;
    } else {
      const q = (p - a) / (1 - a);
      I = CFG.maxI * Math.exp(-K * q);
      Q = a + ((1 - a) * (1 - Math.exp(-K * q))) / K;
    }
    const soc = CFG.socStart + ((CFG.socEnd - CFG.socStart) * Q) / Q_TOTAL;
    return { p, I, soc, phase: p < a ? "cc" : "cv", done: false };
  }

  const COLORS = {
    current: "#2f80ed",
    soc: "#27ae60",
    threshold: "#f5576c",
    muted: "#888",
  };

  function fitCanvas(c) {
    const dpr = window.devicePixelRatio || 1;
    const w = c.clientWidth;
    const h = c.clientHeight;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
    }
    const ctx = c.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    return { ctx, w, h };
  }

  function rr(ctx, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function socColor(soc) {
    if (soc < 40) return "#f5576c";
    if (soc < 70) return "#f2a93b";
    return "#27ae60";
  }

  // Подпись внизу: что происходит с АКБ прямо сейчас
  function acceptText(s) {
    const soc = Math.round(s.soc);
    if (s.done)
      return { t: `АКБ ~${soc}% — принимает всего ${fmtA(CFG.offI)}А → переход к следующему этапу`, c: "#1e8449", bg: "#d4edda" };
    if (s.phase === "cc")
      return { t: `АКБ разряжен (${soc}%) — «голодный», принимает максимум: ${fmtA(s.I)}А`, c: "#c0392b", bg: "#fdecea" };
    if (s.I > CFG.maxI * 0.25)
      return { t: `АКБ наполняется (${soc}%) — места меньше, принимает меньше: ${s.I.toFixed(2)}А`, c: "#a5650a", bg: "#fff3cd" };
    return { t: `АКБ почти полный (${soc}%) — берёт совсем немного: ${s.I.toFixed(2)}А`, c: "#1e8449", bg: "#e8f6ee" };
  }

  // Формат тока: 6.0 / 0.2 / 0.15
  function fmtA(v) {
    return v < 1 ? String(Number(v.toFixed(2))) : v.toFixed(1);
  }

  function drawCaption(ctx, w, h, s) {
    const c = acceptText(s);
    const narrow = w < 520;
    ctx.font = `bold ${narrow ? 13 : 14}px sans-serif`;
    let lines = [c.t];
    if (ctx.measureText(c.t).width + 32 > w - 16) {
      const i = c.t.indexOf(" — ");
      lines = i > 0 ? [c.t.slice(0, i), c.t.slice(i + 1)] : [c.t];
    }
    const lh = narrow ? 17 : 18;
    const tw = Math.max(...lines.map((l) => ctx.measureText(l).width));
    const pw = Math.min(w - 16, tw + 32), ph = 14 + lh * lines.length;
    const px = (w - pw) / 2, py = h - ph - 8;
    ctx.fillStyle = c.bg;
    rr(ctx, px, py, pw, ph, Math.min(16, ph / 2));
    ctx.fill();
    ctx.fillStyle = c.c;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    lines.forEach((l, i) => ctx.fillText(l, w / 2, py + 7 + lh * (i + 0.5) + 1, pw - 20));
    return ph;
  }

  // Горизонтальная батарейка с уровнем заряда и зоной 85–90%
  function drawHBattery(ctx, bx, by, bw, bh, soc) {
    ctx.fillStyle = "#555";
    rr(ctx, bx + bw, by + bh / 2 - bh * 0.15, 10, bh * 0.3, 3);
    ctx.fill();
    ctx.fillStyle = "#fff";
    rr(ctx, bx, by, bw, bh, 12);
    ctx.fill();
    const iw = bw - 10, fw = (iw * soc) / 100;
    ctx.fillStyle = socColor(soc);
    rr(ctx, bx + 5, by + 5, fw, bh - 10, 8);
    ctx.fill();
    const xb = bx + 5 + iw * 0.85;
    ctx.fillStyle = "rgba(39,174,96,0.18)";
    ctx.fillRect(xb, by + 5, iw * 0.05, bh - 10);
    ctx.strokeStyle = "rgba(39,174,96,0.9)";
    ctx.setLineDash([4, 3]);
    ctx.lineWidth = 1;
    ctx.strokeRect(xb, by + 5, iw * 0.05, bh - 10);
    ctx.setLineDash([]);
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 3;
    rr(ctx, bx, by, bw, bh, 12);
    ctx.stroke();
    const cy = by + bh / 2;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `bold ${Math.round(bh * 0.2)}px sans-serif`;
    ctx.fillStyle = "#fff";
    if (fw > bh * 0.55) ctx.fillText(`${Math.round(soc)}%`, bx + 5 + fw / 2, cy);
    if (iw - fw > 70) {
      ctx.font = "12px sans-serif";
      ctx.fillStyle = COLORS.muted;
      ctx.fillText(`свободно ${Math.round(100 - soc)}%`, bx + 5 + fw + (iw - fw) / 2, cy);
    }
    ctx.fillStyle = COLORS.soc;
    ctx.font = "11px sans-serif";
    ctx.textBaseline = "top";
    ctx.fillText("85–90%", xb + iw * 0.025, by + bh + 5);
  }

  // Стрелка вдоль оси X: тело толщиной thick, наконечник длиной head (выступает на head/2 с каждой стороны)
  function arrowPath(ctx, x0, x1, cy, thick, head) {
    ctx.beginPath();
    ctx.moveTo(x0, cy - thick / 2);
    ctx.lineTo(x1 - head, cy - thick / 2);
    ctx.lineTo(x1 - head, cy - thick / 2 - head / 2);
    ctx.lineTo(x1, cy);
    ctx.lineTo(x1 - head, cy + thick / 2 + head / 2);
    ctx.lineTo(x1 - head, cy + thick / 2);
    ctx.lineTo(x0, cy + thick / 2);
    ctx.closePath();
  }

  // Стрелка тока с бегущими полосами (скорость ∝ току)
  function drawFlowArrow(ctx, x0, x1, cy, thick, head, s, ts) {
    ctx.fillStyle = s.done ? COLORS.threshold : COLORS.current;
    arrowPath(ctx, x0, x1, cy, thick, head);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    ctx.rect(x0, cy - thick / 2, x1 - head - x0, thick);
    ctx.clip();
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    const off = ((ts / 1000) * 30 * s.I) % 24;
    for (let x = x0 - 24 + off; x < x1; x += 24) ctx.fillRect(x, cy - thick / 2, 8, thick);
    ctx.restore();
  }

  // Зарядник выдает максимум (пунктир), АКБ берёт сколько может (синяя стрелка)
  function draw(canvas, s, ts) {
    const { ctx, w, h } = fitCanvas(canvas);
    const narrow = w < 520;
    const capH = narrow ? 56 : 50;
    const bw = narrow ? w * 0.4 : Math.min(w * 0.42, 320);
    const bh = narrow ? 76 : 110;
    const bx = w - bw - (narrow ? 22 : 60);
    const by = (h - capH) / 2 - bh / 2 + 6;
    const cy = by + bh / 2;
    const x0 = narrow ? 10 : 24, x1 = bx - (narrow ? 8 : 12);
    const maxT = narrow ? 34 : 50, maxH = narrow ? 20 : 28;
    // что выдает зарядник — пунктирный контур
    ctx.fillStyle = "rgba(47,128,237,0.07)";
    arrowPath(ctx, x0, x1, cy, maxT, maxH);
    ctx.fill();
    ctx.strokeStyle = "#9bbcf0";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
    // реально принятый ток
    const k = s.I / CFG.maxI;
    const minT = narrow ? 2.5 : 3, minH = narrow ? 8 : 10;
    drawFlowArrow(ctx, x0, x1, cy, minT + (maxT - minT) * k, minH + (maxH - minH) * k, s, ts);
    ctx.font = `${narrow ? 11 : 12}px sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    ctx.fillStyle = "#6b8fd6";
    ctx.fillText(`зарядник выдает ${fmtA(CFG.maxI)}А`, x0, cy - maxT / 2 - maxH / 2 - 4, x1 - x0);
    ctx.font = `bold ${narrow ? 13 : 15}px sans-serif`;
    ctx.textBaseline = "top";
    ctx.fillStyle = s.done ? COLORS.threshold : COLORS.current;
    ctx.fillText(`АКБ принимает: ${s.I.toFixed(2)}А`, x0, cy + maxT / 2 + maxH / 2 + 4, x1 - x0);
    drawHBattery(ctx, bx, by, bw, bh, s.soc);
    drawCaption(ctx, w, h, s);
  }

  // ---------- всплывающее окно ----------
  let modal = null, canvas = null, raf = 0, start = 0, lastFocus = null;

  function build() {
    modal = document.createElement("div");
    modal.className = "anim-modal";
    modal.hidden = true;
    modal.innerHTML = `
      <div class="anim-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="anim-modal-title">
        <button type="button" class="anim-modal-close" aria-label="Закрыть">×</button>
        <h3 id="anim-modal-title">Зарядник предлагает, АКБ берёт</h3>
        <p class="anim-modal-text"></p>
        <canvas></canvas>
        <div class="anim-modal-actions">
          <button type="button" class="anim-modal-btn" data-replay>↻ Сначала</button>
          <button type="button" class="anim-modal-btn" data-close>Закрыть</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    canvas = modal.querySelector("canvas");
    modal.addEventListener("click", (e) => {
      if (e.target === modal || e.target.closest(".anim-modal-close, [data-close]")) close();
      if (e.target.closest("[data-replay]")) start = performance.now();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !modal.hidden) close();
    });
  }

  function frame(ts) {
    const el = Math.max(0, ts - start) % (CYCLE + HOLD);
    const s = sim(Math.min(1, el / CYCLE));
    s.done = el >= CYCLE;
    draw(canvas, s, ts);
    raf = requestAnimationFrame(frame);
  }

  function open(opts = {}) {
    configure(opts.maxI, opts.offI);
    if (!modal) build();
    modal.querySelector(".anim-modal-text").textContent =
      `Пунктир показывает, сколько тока выдает зарядник (${fmtA(CFG.maxI)}А). ` +
      "Синяя стрелка показывает, сколько АКБ реально принимает. Ток уменьшает сам АКБ, а не зарядник.";
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.classList.add("anim-modal-open");
    modal.querySelector(".anim-modal-close").focus();
    start = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(frame);
  }

  function close() {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    document.body.classList.remove("anim-modal-open");
    cancelAnimationFrame(raf);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  return { open, close };
})();
