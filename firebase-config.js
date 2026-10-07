// ============================================================
//  1. Firebase console -> Project settings -> Your apps -> Web app
//  2. Paste the config object below.
//  3. Enable Authentication -> Email/Password and create Firestore.
// ============================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

// The Node backend. When the backend itself serves these pages (npm start ->
// http://localhost:5000) the API is on the same origin. If you open the pages
// from another dev server (e.g. VS Code Live Server) it falls back to :5000.
export const API_BASE =
  location.port === "5000" ? "" : `${location.protocol}//${location.hostname || "localhost"}:5000`;

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
