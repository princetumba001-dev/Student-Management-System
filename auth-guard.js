// Protects a page: resolves with { user, profile } only if the signed-in user
// has one of the allowed roles, otherwise sends them back to login.html.
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export function requireRole(allowed) {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) return location.replace("login.html");
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        const profile = snap.exists() ? snap.data() : null;
        if (!profile || !allowed.includes(profile.role)) return location.replace("login.html?denied=1");
        resolve({ user, profile });
      } catch (err) {
        console.error(err);
        location.replace("login.html?error=1");
      }
    });
  });
}

export const logout = () => signOut(auth).then(() => location.replace("login.html"));
