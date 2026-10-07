// Shared UI helpers: escaping, toasts, animations, tiny markdown renderer.

const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ESC[c]);

export const initials = (name = "") =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() || "").join("") || "?";

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- toast ---------- */
export function toast(message, type = "success", ms = 3500) {
  let box = document.getElementById("toasts");
  if (!box) {
    box = document.createElement("div");
    box.id = "toasts";
    document.body.appendChild(box);
  }
  const t = document.createElement("div");
  t.className = `toast ${type}`;
  t.textContent = message;
  box.appendChild(t);
  setTimeout(() => {
    t.classList.add("out");
    setTimeout(() => t.remove(), 300);
  }, ms);
}

export function setLoading(btn, on) {
  btn.classList.toggle("loading", on);
  btn.disabled = on;
}

/* ---------- animated particle network background ---------- */
export function initBackground(canvas) {
  if (!canvas || reduced) return;
  const ctx = canvas.getContext("2d");
  let w, h, pts = [];
  const mouse = { x: -999, y: -999 };

  const resize = () => {
    w = canvas.width = innerWidth;
    h = canvas.height = innerHeight;
    const n = Math.min(90, Math.floor((w * h) / 20000));
    pts = Array.from({ length: n }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
    }));
  };
  addEventListener("resize", resize);
  addEventListener("mousemove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
  resize();

  const tick = () => {
    if (document.hidden) return requestAnimationFrame(tick);
    ctx.clearRect(0, 0, w, h);
    for (const p of pts) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
      const dm = Math.hypot(p.x - mouse.x, p.y - mouse.y);
      if (dm < 140) { p.x += (p.x - mouse.x) * 0.01; p.y += (p.y - mouse.y) * 0.01; }
      ctx.fillStyle = "rgba(45,212,191,.7)";
      ctx.beginPath(); ctx.arc(p.x, p.y, 1.6, 0, 6.283); ctx.fill();
    }
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
        if (d < 120) {
          ctx.strokeStyle = `rgba(45,212,191,${0.16 * (1 - d / 120)})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke();
        }
      }
    }
    requestAnimationFrame(tick);
  };
  tick();
}

/* ---------- reveal on scroll ---------- */
export function initReveal(root = document) {
  const els = $$(".reveal:not(.in)", root);
  if (reduced || !("IntersectionObserver" in window)) return els.forEach((e) => e.classList.add("in"));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
  }, { threshold: 0.12 });
  els.forEach((el, i) => { el.style.setProperty("--d", `${(i % 6) * 0.07}s`); io.observe(el); });
}

/* ---------- count-up numbers ---------- */
export function countUp(el, to, ms = 1200) {
  if (reduced) { el.textContent = to; return; }
  const start = performance.now();
  const from = Number(el.textContent) || 0;
  const step = (now) => {
    const p = Math.min(1, (now - start) / ms);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(from + (to - from) * eased);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ---------- 3D tilt on hover ---------- */
export function initTilt(root = document) {
  if (reduced) return;
  $$(".tilt", root).forEach((el) => {
    if (el.dataset.tilt) return;
    el.dataset.tilt = "1";
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(800px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateY(-4px)`;
    });
    el.addEventListener("mouseleave", () => { el.style.transform = ""; });
  });
}

/* ---------- typewriter that cycles through phrases ---------- */
export function typewriter(el, phrases, { speed = 70, pause = 1600 } = {}) {
  if (reduced) { el.textContent = phrases[0]; return; }
  let i = 0, j = 0, deleting = false;
  const loop = () => {
    const full = phrases[i];
    j += deleting ? -1 : 1;
    el.textContent = full.slice(0, j);
    let delay = deleting ? speed / 2 : speed;
    if (!deleting && j === full.length) { deleting = true; delay = pause; }
    else if (deleting && j === 0) { deleting = false; i = (i + 1) % phrases.length; delay = 300; }
    setTimeout(loop, delay);
  };
  loop();
}

/* ---------- minimal, XSS-safe markdown for chatbot replies ---------- */
const inline = (s) => s.replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

export function mdToHtml(src) {
  return esc(src).split("```").map((part, idx) => {
    if (idx % 2 === 1) return `<pre><code>${part.replace(/^\w*\n/, "")}</code></pre>`;
    let out = "", inList = false;
    for (const line of part.split("\n")) {
      const m = line.match(/^\s*(?:[-*]|\d+\.)\s+(.*)$/);
      if (m) { if (!inList) { out += "<ul>"; inList = true; } out += `<li>${inline(m[1])}</li>`; }
      else {
        if (inList) { out += "</ul>"; inList = false; }
        if (line.trim()) out += `<p>${inline(line)}</p>`;
      }
    }
    return inList ? out + "</ul>" : out;
  }).join("");
}
