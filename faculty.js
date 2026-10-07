import { db } from "./firebase-config.js";
import { requireRole, logout } from "./auth-guard.js";
import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { esc, initials, initBackground, initReveal, initTilt, countUp, toast } from "./ui.js";

const $ = (id) => document.getElementById(id);

initBackground($("bg"));
$("logout").addEventListener("click", logout);

const { profile } = await requireRole(["faculty", "admin"]);
$("who").textContent = profile.name;
initReveal();

let students = [];
let view = "cards";

$("list").innerHTML = `<div class="grid cols-3">${'<div class="skeleton" style="height:150px"></div>'.repeat(6)}</div>`;

function filtered() {
  const q = $("search").value.trim().toLowerCase();
  const dept = $("dept").value;
  const sort = $("sort").value;
  const list = students.filter((s) =>
    (!dept || s.department === dept) &&
    (!q || [s.name, s.rollNo, s.email].some((v) => String(v || "").toLowerCase().includes(q))));
  list.sort((a, b) => sort === "attendance"
    ? (Number(b.attendance) || 0) - (Number(a.attendance) || 0)
    : String(a[sort] || "").localeCompare(String(b[sort] || ""), undefined, { numeric: true }));
  return list;
}

function renderStats() {
  countUp($("cTotal"), students.length);
  countUp($("cDepts"), new Set(students.map((s) => s.department).filter(Boolean)).size);
  const atts = students.map((s) => Number(s.attendance)).filter((n) => !Number.isNaN(n));
  countUp($("cAtt"), atts.length ? Math.round(atts.reduce((a, b) => a + b, 0) / atts.length) : 0);

  const current = $("dept").value;
  const depts = [...new Set(students.map((s) => s.department).filter(Boolean))].sort();
  $("dept").innerHTML = `<option value="">All departments</option>` +
    depts.map((d) => `<option value="${esc(d)}"${d === current ? " selected" : ""}>${esc(d)}</option>`).join("");
}

function renderList() {
  const list = filtered();
  if (!list.length) {
    $("list").innerHTML = `<div class="card empty">${students.length ? "No students match your search." : "No student records yet. An admin can add them."}</div>`;
    return;
  }
  if (view === "table") {
    $("list").innerHTML = `
      <div class="table-wrap"><table>
        <thead><tr><th>Student</th><th>Roll no</th><th>Department</th><th>Year</th><th>Sem</th><th>Attendance</th></tr></thead>
        <tbody>${list.map((s) => `
          <tr data-id="${esc(s.id)}">
            <td><div class="row" style="flex-wrap:nowrap"><div class="avatar">${esc(initials(s.name))}</div><div><strong>${esc(s.name)}</strong><div class="muted small">${esc(s.email)}</div></div></div></td>
            <td>${esc(s.rollNo || "—")}</td><td>${esc(s.department || "—")}</td><td>${esc(s.year || "—")}</td><td>${esc(s.semester || "—")}</td>
            <td>${esc(s.attendance ?? "—")}${s.attendance != null && s.attendance !== "" ? "%" : ""}</td>
          </tr>`).join("")}</tbody>
      </table></div>`;
  } else {
    $("list").innerHTML = `<div class="grid cols-3">${list.map((s, i) => `
      <article class="card s-card tilt" data-id="${esc(s.id)}" style="animation:slideIn .45s ${Math.min(i, 12) * 0.04}s both">
        <div class="row" style="flex-wrap:nowrap"><div class="avatar">${esc(initials(s.name))}</div>
          <div style="min-width:0"><strong>${esc(s.name)}</strong><div class="muted small" style="overflow:hidden;text-overflow:ellipsis">${esc(s.email)}</div></div></div>
        <div class="row"><span class="badge student">${esc(s.department || "No dept")}</span><span class="badge">Year ${esc(s.year || "—")}</span><span class="badge">${esc(s.rollNo || "No roll no")}</span></div>
        <div><div class="row between small"><span class="muted">Attendance</span><strong>${esc(s.attendance ?? 0)}%</strong></div>
          <div class="bar" style="margin-top:6px"><i data-w="${Math.max(0, Math.min(100, Number(s.attendance) || 0))}"></i></div></div>
      </article>`).join("")}</div>`;
    initTilt($("list"));
    requestAnimationFrame(() => requestAnimationFrame(() =>
      $("list").querySelectorAll(".bar > i").forEach((b) => { b.style.width = b.dataset.w + "%"; })));
  }
  $("list").querySelectorAll("[data-id]").forEach((el) => el.addEventListener("click", () => openModal(el.dataset.id)));
}

function openModal(id) {
  const s = students.find((x) => x.id === id);
  if (!s) return;
  const classes = s.classes || [], subjects = s.subjects || [];
  $("modal").innerHTML = `
    <div class="row between" style="margin-bottom:18px">
      <div class="row"><div class="avatar lg">${esc(initials(s.name))}</div>
        <div><h2 style="font-family:var(--display)">${esc(s.name)}</h2><span class="muted small">${esc(s.rollNo ? "Roll No. " + s.rollNo : "No roll number")}</span></div></div>
      <button class="btn btn-sm" id="closeModal">✕</button>
    </div>
    <dl class="kv" style="margin-bottom:22px">
      <dt>Email</dt><dd>${esc(s.email || "—")}</dd><dt>Phone</dt><dd>${esc(s.phone || "—")}</dd>
      <dt>Department</dt><dd>${esc(s.department || "—")}</dd><dt>Year / Sem</dt><dd>${esc(s.year || "—")} / ${esc(s.semester || "—")}</dd>
      <dt>Attendance</dt><dd>${esc(s.attendance ?? "—")}%</dd>
    </dl>
    <h3 style="margin-bottom:8px">Subjects (${subjects.length})</h3>
    <div class="table-wrap" style="margin-bottom:22px"><table style="min-width:0"><thead><tr><th>Code</th><th>Subject</th><th>Credits</th><th>Marks</th></tr></thead><tbody>
      ${subjects.length ? subjects.map((x) => `<tr><td>${esc(x.code)}</td><td>${esc(x.name)}</td><td>${esc(x.credits)}</td><td>${esc(x.marks === "" || x.marks == null ? "—" : x.marks + "%")}</td></tr>`).join("") : `<tr><td colspan="4" class="empty">None assigned</td></tr>`}
    </tbody></table></div>
    <h3 style="margin-bottom:8px">Classes (${classes.length})</h3>
    <div class="table-wrap"><table style="min-width:0"><thead><tr><th>Day</th><th>Time</th><th>Subject</th><th>Room</th></tr></thead><tbody>
      ${classes.length ? classes.map((c) => `<tr><td>${esc(c.day)}</td><td>${esc(c.time)}</td><td>${esc(c.subject)}</td><td>${esc(c.room)}</td></tr>`).join("") : `<tr><td colspan="4" class="empty">None scheduled</td></tr>`}
    </tbody></table></div>`;
  $("modalBack").classList.add("open");
  $("closeModal").addEventListener("click", closeModal);
}
const closeModal = () => $("modalBack").classList.remove("open");
$("modalBack").addEventListener("click", (e) => { if (e.target === $("modalBack")) closeModal(); });
addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

// CSV export – cells starting with = + - @ are prefixed so spreadsheets don't run them as formulas.
function csvCell(v) {
  let s = String(v ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
}
$("exportCsv").addEventListener("click", () => {
  const list = filtered();
  if (!list.length) return toast("Nothing to export.", "error");
  const head = ["Name", "Roll No", "Email", "Phone", "Department", "Year", "Semester", "Attendance"];
  const rows = list.map((s) => [s.name, s.rollNo, s.email, s.phone, s.department, s.year, s.semester, s.attendance].map(csvCell).join(","));
  const blob = new Blob([[head.map(csvCell).join(","), ...rows].join("\n")], { type: "text/csv" });
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: "students.csv" });
  a.click();
  URL.revokeObjectURL(a.href);
  toast(`Exported ${list.length} students`);
});

["search", "dept", "sort"].forEach((id) => $(id).addEventListener("input", renderList));
$("viewTabs").querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => {
  view = t.dataset.view;
  $("viewTabs").querySelectorAll(".tab").forEach((x) => x.classList.toggle("active", x === t));
  renderList();
}));

onSnapshot(collection(db, "students"),
  (snap) => {
    students = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderStats();
    renderList();
  },
  (err) => {
    console.error(err);
    $("list").innerHTML = `<div class="card empty">Couldn't load students (${esc(err.code)}). Check your Firestore rules.</div>`;
  });
