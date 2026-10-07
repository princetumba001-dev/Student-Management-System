import { db } from "./firebase-config.js";
import { requireRole, logout } from "./auth-guard.js";
import {
  collection, doc, onSnapshot, updateDoc, setDoc, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { esc, initials, initBackground, initReveal, countUp, toast, setLoading } from "./ui.js";

const $ = (id) => document.getElementById(id);
const ROLES = ["pending", "student", "faculty", "admin"];

initBackground($("bg"));
$("logout").addEventListener("click", logout);

const { user: me, profile } = await requireRole(["admin"]);
$("who").textContent = profile.name;
initReveal();

let users = [];
let students = [];

/* ---------- tabs ---------- */
$("tabs").querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => {
  $("tabs").querySelectorAll(".tab").forEach((x) => x.classList.toggle("active", x === t));
  ["users", "students"].forEach((n) => $(`tab-${n}`).classList.toggle("hidden", n !== t.dataset.tab));
}));

/* ---------- stats ---------- */
function renderStats() {
  countUp($("cUsers"), users.length);
  countUp($("cPending"), users.filter((u) => u.role === "pending").length);
  countUp($("cStudents"), students.length);
  countUp($("cFaculty"), users.filter((u) => u.role === "faculty").length);
}

/* ---------- users & roles ---------- */
function renderUsers() {
  const q = $("userSearch").value.trim().toLowerCase();
  const rf = $("roleFilter").value;
  const list = users
    .filter((u) => (!rf || u.role === rf) && (!q || `${u.name} ${u.email}`.toLowerCase().includes(q)))
    .sort((a, b) => (a.role === "pending" ? -1 : 0) - (b.role === "pending" ? -1 : 0) || String(a.name).localeCompare(String(b.name)));

  $("userBody").innerHTML = list.length ? list.map((u) => {
    const self = u.id === me.uid;
    return `<tr class="${u.role === "pending" ? "pending-row" : ""}">
      <td><div class="row" style="flex-wrap:nowrap"><div class="avatar">${esc(initials(u.name))}</div>
        <div><strong>${esc(u.name)}</strong>${self ? ' <span class="muted small">(you)</span>' : ""}<div class="muted small">${esc(u.email)}</div></div></div></td>
      <td>${u.requestedRole ? `<span class="badge ${esc(u.requestedRole)}">${esc(u.requestedRole)}</span>` : "—"}</td>
      <td><span class="badge ${esc(u.role)}">${esc(u.role)}</span></td>
      <td><div class="role-cell">
        <select class="input role-select" data-role-for="${esc(u.id)}" ${self ? "disabled title=\"You can't change your own role\"" : ""}>
          ${ROLES.map((r) => `<option value="${r}"${r === u.role ? " selected" : ""}>${r}</option>`).join("")}
        </select>
        <button class="btn btn-sm btn-primary" data-save-role="${esc(u.id)}" ${self ? "disabled" : ""}>Assign</button>
      </div></td></tr>`;
  }).join("") : `<tr><td colspan="4" class="empty">No users found.</td></tr>`;

  $("userBody").querySelectorAll("[data-save-role]").forEach((btn) => btn.addEventListener("click", () => assignRole(btn)));
}

async function assignRole(btn) {
  const uid = btn.dataset.saveRole;
  const role = $("userBody").querySelector(`[data-role-for="${CSS.escape(uid)}"]`).value;
  const u = users.find((x) => x.id === uid);
  if (!u || u.role === role) return toast("Role unchanged.", "error");
  if (!confirm(`Change ${u.name}'s role from "${u.role}" to "${role}"?`)) return;

  setLoading(btn, true);
  try {
    await updateDoc(doc(db, "users", uid), { role });
    // New students get an empty record the admin can fill in (merge: never overwrites existing data).
    if (role === "student" && !students.some((s) => s.id === uid)) {
      await setDoc(doc(db, "students", uid), {
        name: u.name, email: u.email, rollNo: "", department: "", year: "", semester: "", phone: "",
        attendance: 0, classes: [], subjects: [], createdAt: serverTimestamp(),
      }, { merge: true });
    }
    toast(`${u.name} is now ${role}.`);
  } catch (err) {
    console.error(err);
    toast(`Failed: ${err.code || err.message}`, "error");
  } finally { setLoading(btn, false); }
}

["userSearch", "roleFilter"].forEach((id) => $(id).addEventListener("input", renderUsers));

/* ---------- student records ---------- */
function renderStudents() {
  const q = $("stuSearch").value.trim().toLowerCase();
  const list = students.filter((s) => !q || `${s.name} ${s.rollNo} ${s.email} ${s.department}`.toLowerCase().includes(q))
    .sort((a, b) => String(a.name).localeCompare(String(b.name)));
  $("stuBody").innerHTML = list.length ? list.map((s) => `
    <tr>
      <td><div class="row" style="flex-wrap:nowrap"><div class="avatar">${esc(initials(s.name))}</div><div><strong>${esc(s.name)}</strong><div class="muted small">${esc(s.email)}</div></div></div></td>
      <td>${esc(s.rollNo || "—")}</td><td>${esc(s.department || "—")}</td><td>${esc(s.year || "—")} / ${esc(s.semester || "—")}</td><td>${esc(s.attendance ?? 0)}%</td>
      <td><button class="btn btn-sm" data-edit="${esc(s.id)}">Edit</button></td>
    </tr>`).join("") : `<tr><td colspan="6" class="empty">No student records yet. Assign the “student” role to a user first.</td></tr>`;
  $("stuBody").querySelectorAll("[data-edit]").forEach((b) => b.addEventListener("click", () => openForm(b.dataset.edit)));
}
$("stuSearch").addEventListener("input", renderStudents);

const parseLines = (text, n) =>
  text.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
    const p = l.split("|").map((x) => x.trim());
    while (p.length < n) p.push("");
    return p;
  });
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, Number(v) || 0));

function openForm(id) {
  const studentUsers = users.filter((u) => u.role === "student");
  $("fUser").innerHTML = studentUsers.length
    ? studentUsers.map((u) => `<option value="${esc(u.id)}">${esc(u.name)} – ${esc(u.email)}</option>`).join("")
    : `<option value="">No users have the student role yet</option>`;

  const target = id || ($("fUser").value || "");
  $("fUser").value = target;
  const s = students.find((x) => x.id === target) || {};
  fill(s);
  $("formTitle").textContent = id ? `Edit ${s.name || "student"}` : "Add / edit student record";
  $("modalBack").classList.add("open");
}
function fill(s) {
  $("fRoll").value = s.rollNo || ""; $("fDept").value = s.department || "";
  $("fYear").value = s.year || ""; $("fSem").value = s.semester || "";
  $("fPhone").value = s.phone || ""; $("fAtt").value = s.attendance ?? "";
  $("fSubjects").value = (s.subjects || []).map((x) => [x.code, x.name, x.credits, x.marks, x.faculty].join(" | ")).join("\n");
  $("fClasses").value = (s.classes || []).map((x) => [x.subject, x.day, x.time, x.room, x.faculty].join(" | ")).join("\n");
}
$("fUser").addEventListener("change", () => fill(students.find((x) => x.id === $("fUser").value) || {}));
const closeForm = () => $("modalBack").classList.remove("open");
$("closeForm").addEventListener("click", closeForm);
$("cancelForm").addEventListener("click", closeForm);
$("addStudent").addEventListener("click", () => openForm());
addEventListener("keydown", (e) => { if (e.key === "Escape") closeForm(); });

$("stuForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const uid = $("fUser").value;
  const u = users.find((x) => x.id === uid);
  if (!u) return toast("Pick a student account first.", "error");

  const subjects = parseLines($("fSubjects").value, 5).map(([code, name, credits, marks, faculty]) => ({
    code, name, faculty, credits: clamp(credits, 0, 20), marks: marks === "" ? "" : clamp(marks, 0, 100),
  }));
  const classes = parseLines($("fClasses").value, 5).map(([subject, day, time, room, faculty]) => ({ subject, day, time, room, faculty }));
  if (subjects.some((s) => !s.name) || classes.some((c) => !c.subject)) return toast("Every subject/class line needs a name.", "error");

  setLoading($("saveForm"), true);
  try {
    await setDoc(doc(db, "students", uid), {
      name: u.name, email: u.email,
      rollNo: $("fRoll").value.trim(), department: $("fDept").value.trim(),
      year: $("fYear").value.trim(), semester: $("fSem").value.trim(), phone: $("fPhone").value.trim(),
      attendance: clamp($("fAtt").value, 0, 100), subjects, classes, updatedAt: serverTimestamp(),
    }, { merge: true });
    toast("Student record saved.");
    closeForm();
  } catch (err) {
    console.error(err);
    toast(`Save failed: ${err.code || err.message}`, "error");
  } finally { setLoading($("saveForm"), false); }
});

/* ---------- live data ---------- */
const onErr = (err) => { console.error(err); toast(`Firestore error: ${err.code}`, "error"); };
onSnapshot(collection(db, "users"), (snap) => {
  users = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  renderStats(); renderUsers();
}, onErr);
onSnapshot(collection(db, "students"), (snap) => {
  students = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  renderStats(); renderStudents();
}, onErr);
