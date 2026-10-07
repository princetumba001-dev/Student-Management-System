import { db } from "./firebase-config.js";
import { requireRole, logout } from "./auth-guard.js";
import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { esc, initials, initBackground, initReveal, countUp, toast } from "./ui.js";
import { initChat } from "./chat.js";

const $ = (id) => document.getElementById(id);
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const todayIdx = (new Date().getDay() + 6) % 7; // Mon=0 … Sun=6

initBackground($("bg"));
$("logout").addEventListener("click", logout);

const { user, profile } = await requireRole(["student"]);
$("who").textContent = profile.name;
const hour = new Date().getHours();
$("greeting").textContent = `Good ${hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening"}`;
$("title").textContent = `Hi, ${profile.name.split(" ")[0]} 👋`;

let student = null;
let activeDay = DAYS[Math.min(todayIdx, 5)];

initChat({ user, getContext: () => student });
initReveal();

function renderDetails(s) {
  $("avatar").textContent = initials(s.name || profile.name);
  $("sName").textContent = s.name || profile.name;
  $("sRoll").textContent = s.rollNo ? `Roll No. ${s.rollNo}` : "";
  const rows = [
    ["Department", s.department], ["Year", s.year], ["Semester", s.semester],
    ["Email", s.email || profile.email], ["Phone", s.phone],
  ];
  $("details").innerHTML = rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v || "—")}</dd>`).join("");
}

function renderAttendance(s) {
  const att = Math.max(0, Math.min(100, Number(s.attendance) || 0));
  $("ringVal").style.strokeDashoffset = 327 - (327 * att) / 100;
  countUp($("attNum"), att);
  $("attNote").textContent = att >= 75 ? "You're above the 75% requirement. Keep it up!" : "Below 75% – attend more classes to avoid a shortage.";
}

function renderStats(s) {
  const subs = s.subjects || [];
  const credits = subs.reduce((a, x) => a + (Number(x.credits) || 0), 0);
  const marked = subs.filter((x) => x.marks !== "" && x.marks != null && !Number.isNaN(Number(x.marks)));
  const avg = marked.length ? Math.round(marked.reduce((a, x) => a + Number(x.marks), 0) / marked.length) : 0;
  countUp($("statSubjects"), subs.length);
  countUp($("statCredits"), credits);
  countUp($("statAvg"), avg);
}

function renderClasses(s) {
  $("dayChips").innerHTML = DAYS.map((d, i) =>
    `<button class="day-chip${d === activeDay ? " active" : ""}${i === todayIdx ? " today" : ""}" data-day="${d}">${d}</button>`).join("");
  $("dayChips").querySelectorAll("button").forEach((b) => b.addEventListener("click", () => { activeDay = b.dataset.day; renderClasses(s); }));

  const list = (s.classes || []).filter((c) => (c.day || "").slice(0, 3).toLowerCase() === activeDay.toLowerCase());
  $("classList").innerHTML = list.length
    ? list.map((c, i) => `
        <div class="class-item" style="animation-delay:${i * 0.07}s">
          <div class="time">${esc(c.time || "TBA")}</div>
          <div style="flex:1"><strong>${esc(c.subject)}</strong><div class="muted small">${esc(c.faculty || "")}</div></div>
          <span class="badge">${esc(c.room || "Room TBA")}</span>
        </div>`).join("")
    : `<div class="empty">🎉 No classes on ${esc(activeDay)}.</div>`;
}

function renderSubjects(s) {
  const subs = s.subjects || [];
  $("subjectGrid").innerHTML = subs.length
    ? subs.map((x) => {
        const m = Number(x.marks);
        const hasMarks = x.marks !== "" && x.marks != null && !Number.isNaN(m);
        return `
        <article class="card">
          <div class="row between"><span class="badge">${esc(x.code || "—")}</span><span class="muted small">${esc(x.credits ?? 0)} credits</span></div>
          <h3 style="margin-top:12px">${esc(x.name)}</h3>
          <p class="muted small">${esc(x.faculty || "Faculty TBA")}</p>
          <div class="row between small" style="margin:14px 0 6px"><span class="muted">Marks</span><strong>${hasMarks ? m + "%" : "Not graded"}</strong></div>
          <div class="bar"><i data-w="${hasMarks ? Math.max(0, Math.min(100, m)) : 0}"></i></div>
        </article>`;
      }).join("")
    : `<div class="card empty" style="grid-column:1/-1">No subjects assigned yet.</div>`;
  requestAnimationFrame(() => requestAnimationFrame(() =>
    $("subjectGrid").querySelectorAll(".bar > i").forEach((i) => { i.style.width = i.dataset.w + "%"; })));
}

onSnapshot(doc(db, "students", user.uid),
  (snap) => {
    if (!snap.exists()) {
      student = null;
      $("noRecord").classList.remove("hidden");
      $("content").classList.add("hidden");
      return;
    }
    student = snap.data();
    $("noRecord").classList.add("hidden");
    $("content").classList.remove("hidden");
    renderDetails(student); renderAttendance(student); renderStats(student);
    renderClasses(student); renderSubjects(student);
    initReveal();
  },
  (err) => { console.error(err); toast("Couldn't load your data: " + err.code, "error"); }
);
