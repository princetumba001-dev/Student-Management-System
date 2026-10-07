import { auth, db } from "./firebase-config.js";
import {
  signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile,
  onAuthStateChanged, signOut, sendPasswordResetEmail,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { initBackground, setLoading, toast, esc } from "./ui.js";

initBackground(document.getElementById("bg"));

const ROUTES = { admin: "admin.html", faculty: "facultyportal.html", student: "studentportal.html" };
const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);

let mode = "signin";
let busy = false; // true while sign-up is writing the profile, so the auth listener doesn't race it

const ERRORS = {
  "auth/invalid-credential": "Wrong email or password.",
  "auth/invalid-email": "That email address doesn't look right.",
  "auth/user-not-found": "No account found with that email.",
  "auth/wrong-password": "Wrong email or password.",
  "auth/email-already-in-use": "An account with this email already exists. Try signing in.",
  "auth/weak-password": "Password must be at least 6 characters.",
  "auth/too-many-requests": "Too many attempts. Please wait a minute and try again.",
  "auth/network-request-failed": "Network error – check your connection.",
  "permission-denied": "Permission denied by Firestore rules. Have you published firestore.rules?",
};
const friendly = (e) => ERRORS[e.code] || e.message || "Something went wrong.";

function showMsg(text, type = "error") {
  $("msg").innerHTML = text ? `<div class="alert ${type}">${esc(text)}</div>` : "";
  if (type === "error" && text) { $("card").classList.remove("shake"); void $("card").offsetWidth; $("card").classList.add("shake"); }
}

function setMode(m) {
  mode = m;
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.mode === m));
  document.querySelectorAll("[data-signup]").forEach((el) => el.classList.toggle("hidden", m !== "signup"));
  $("submit").textContent = m === "signup" ? "Create account" : "Sign in";
  $("password").autocomplete = m === "signup" ? "new-password" : "current-password";
  showMsg("");
}

document.querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => setMode(t.dataset.mode)));
$("togglePw").addEventListener("click", () => {
  const p = $("password");
  p.type = p.type === "password" ? "text" : "password";
});

function showPending(profile) {
  $("formView").classList.add("hidden");
  $("pendingView").classList.remove("hidden");
  const want = profile?.requestedRole ? ` as ${profile.requestedRole}` : "";
  $("pendingText").textContent = `Your account${want} has been created. An admin needs to assign your role before you can enter. Come back and sign in again after approval.`;
}

async function routeUser(user) {
  const ref = doc(db, "users", user.uid);
  let snap = await getDoc(ref);
  if (!snap.exists()) {
    // Account created elsewhere (e.g. Firebase console) – give it a pending profile.
    await setDoc(ref, {
      name: user.displayName || user.email.split("@")[0], email: user.email,
      role: "pending", requestedRole: "student", createdAt: serverTimestamp(),
    });
    snap = await getDoc(ref);
  }
  const profile = snap.data();
  if (ROUTES[profile.role]) return location.replace(ROUTES[profile.role]);
  showPending(profile);
}

$("pendingOut").addEventListener("click", async () => {
  await signOut(auth);
  $("pendingView").classList.add("hidden");
  $("formView").classList.remove("hidden");
  setMode("signin");
});

$("forgot").addEventListener("click", async (e) => {
  e.preventDefault();
  const email = $("email").value.trim();
  if (!email) return showMsg("Enter your email first, then click “Forgot password?”.");
  try {
    await sendPasswordResetEmail(auth, email);
    showMsg("Password reset email sent – check your inbox.", "ok");
  } catch (err) { showMsg(friendly(err)); }
});

$("form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = $("email").value.trim();
  const password = $("password").value;
  const name = $("name").value.trim();
  if (!email || !password) return showMsg("Email and password are required.");
  if (mode === "signup" && name.length < 2) return showMsg("Please enter your full name.");

  setLoading($("submit"), true);
  showMsg("");
  try {
    if (mode === "signup") {
      busy = true;
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      await setDoc(doc(db, "users", cred.user.uid), {
        name, email, role: "pending", requestedRole: $("role").value, createdAt: serverTimestamp(),
      });
      busy = false;
      toast("Account created!");
      await routeUser(cred.user);
    } else {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await routeUser(cred.user);
    }
  } catch (err) {
    busy = false;
    showMsg(friendly(err));
  } finally {
    setLoading($("submit"), false);
  }
});

// Already signed in? Skip the form (unless we were just bounced back here).
onAuthStateChanged(auth, async (user) => {
  if (busy) return;
  if (params.has("denied") || params.has("error")) {
    if (user) await signOut(auth);
    showMsg(params.has("denied")
      ? "Your account doesn't have access to that page. Sign in with the right account."
      : "Couldn't load your profile. Check your Firestore rules and try again.");
    history.replaceState({}, "", "login.html");
    return;
  }
  if (user) { try { await routeUser(user); } catch (err) { showMsg(friendly(err)); } }
});
