// index.html – landing page animations
import { initBackground, initReveal, initTilt, countUp, typewriter, $$ } from "./ui.js";
initBackground(document.getElementById("bg"));
initReveal();
initTilt();
typewriter(document.getElementById("type"), ["in one place.", "always in sync.", "answered by AI.", "role-protected."]);
document.getElementById("yr").textContent = new Date().getFullYear();
const io = new IntersectionObserver((es) => es.forEach((e) => {
  if (e.isIntersecting) { countUp(e.target, Number(e.target.dataset.count)); io.unobserve(e.target); }
}), { threshold: 0.6 });
$$("[data-count]").forEach((el) => io.observe(el));
  
