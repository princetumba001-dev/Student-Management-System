// AI chatbot widget. Messages go to the Node backend (/api/chat), which checks
// the Firebase ID token and streams the model's answer back over SSE.
import { API_BASE } from "./firebase-config.js";
import { esc, mdToHtml } from "./ui.js";

const $ = (id) => document.getElementById(id);
const STORE = "campus-chat-v1";
const MAX_HISTORY = 20;

const SUGGESTIONS = [
  "What classes do I have today?",
  "Explain recursion simply",
  "Help me make a study plan",
  "Give me 5 interview tips",
];

export function initChat({ user, getContext }) {
  const panel = $("chatPanel"), body = $("chatBody"), input = $("chatInput"), send = $("chatSend");
  let history = [];
  let busy = false;
  let controller = null;

  try { history = JSON.parse(sessionStorage.getItem(`${STORE}:${user.uid}`) || "[]"); } catch { history = []; }
  const save = () => { try { sessionStorage.setItem(`${STORE}:${user.uid}`, JSON.stringify(history.slice(-MAX_HISTORY))); } catch { /* storage unavailable */ } };

  const scroll = () => { body.scrollTop = body.scrollHeight; };

  function addMsg(role, html) {
    const el = document.createElement("div");
    el.className = `msg ${role}`;
    el.innerHTML = html;
    body.appendChild(el);
    scroll();
    return el;
  }

  function welcome() {
    addMsg("bot", mdToHtml("Hi! I'm **Campus AI**. Ask me about your classes, homework, concepts, careers – anything."));
  }

  function renderHistory() {
    body.innerHTML = "";
    if (!history.length) return welcome();
    history.forEach((m) => addMsg(m.role === "user" ? "user" : "bot", m.role === "user" ? esc(m.content) : mdToHtml(m.content)));
  }

  $("chips").innerHTML = SUGGESTIONS.map((s) => `<button type="button" class="chip">${esc(s)}</button>`).join("");
  $("chips").querySelectorAll(".chip").forEach((c) => c.addEventListener("click", () => ask(c.textContent)));

  const toggle = (open) => {
    panel.classList.toggle("open", open ?? !panel.classList.contains("open"));
    if (panel.classList.contains("open")) setTimeout(() => input.focus(), 350);
  };
  $("chatFab").addEventListener("click", () => toggle());
  $("chatClose").addEventListener("click", () => toggle(false));
  $("chatClear").addEventListener("click", () => {
    controller?.abort();
    history = []; save(); renderHistory();
  });

  input.addEventListener("input", () => {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 110) + "px";
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); $("chatForm").requestSubmit(); }
  });
  $("chatForm").addEventListener("submit", (e) => { e.preventDefault(); ask(input.value); });

  async function ask(text) {
    text = text.trim();
    if (!text || busy) return;
    busy = true; send.disabled = true;
    input.value = ""; input.style.height = "auto";
    $("chips").classList.add("hidden");

    history.push({ role: "user", content: text });
    addMsg("user", esc(text));
    const bubble = addMsg("bot", `<span class="typing"><i></i><i></i><i></i></span>`);

    let answer = "";
    controller = new AbortController();
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: history.slice(-MAX_HISTORY) }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server error (${res.status})`);
      }

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const events = buf.split("\n\n");
        buf = events.pop();
        for (const ev of events) {
          const line = ev.trim();
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (data === "[DONE]") continue;
          const json = JSON.parse(data);
          if (json.error) throw new Error(json.error);
          if (json.text) { answer += json.text; bubble.innerHTML = mdToHtml(answer); scroll(); }
        }
      }
      if (!answer) bubble.innerHTML = mdToHtml("_(No response)_");
      history.push({ role: "assistant", content: answer });
    } catch (err) {
      if (err.name === "AbortError") { bubble.remove(); history.pop(); }
      else {
        bubble.className = "msg err";
        const offline = err instanceof TypeError;
        bubble.textContent = offline
          ? "Can't reach the backend. Start it with `npm start` in the backend folder."
          : err.message;
        history.pop(); // drop the unanswered question so it isn't resent
        if (answer) history.push({ role: "user", content: text }, { role: "assistant", content: answer });
      }
    } finally {
      busy = false; send.disabled = false; controller = null;
      save(); scroll();
    }
  }

  renderHistory();
  if (history.length) $("chips").classList.add("hidden");
}
