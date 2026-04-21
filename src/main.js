import "./styles.css";

const moods = [
  { label: "Clear", hue: 190, energy: 72, gravity: 0.42 },
  { label: "Deep", hue: 226, energy: 54, gravity: 0.68 },
  { label: "Spark", hue: 34, energy: 88, gravity: 0.28 },
  { label: "Calm", hue: 154, energy: 38, gravity: 0.82 },
];

const STORAGE_KEY = "orbit-atlas:v1";

const seedNodes = [
  ["Morning brief", "priority", 0.86, -0.58, 18],
  ["Client thread", "people", 0.66, 0.26, 16],
  ["Deep work", "focus", -0.56, 0.49, 20],
  ["Walk + reset", "ritual", -0.18, -0.81, 15],
  ["Design notes", "creative", 0.22, -0.18, 19],
  ["Inbox zero", "admin", -0.78, -0.08, 14],
];

const app = document.querySelector("#app");
app.innerHTML = `
  <main class="shell">
    <section class="hero">
      <div class="hero__text">
        <p class="eyebrow">Orbit Atlas</p>
        <h1>Turn the noise into a living map.</h1>
        <p class="lede">A tiny ambient workspace for tracking thoughts, moods, and momentum without the usual dashboard clutter.</p>
        <div class="controls">
          <label>
            <span>Current mood</span>
            <select id="moodSelect"></select>
          </label>
          <button id="randomizeBtn" type="button">Reshuffle orbit</button>
        </div>
      </div>
      <div class="hero__visual">
        <canvas id="orbitCanvas" aria-label="Animated orbit visual"></canvas>
        <div class="core">
          <span class="core__label">Signal core</span>
          <strong id="coreValue">72%</strong>
          <small id="coreNote">steady drift</small>
        </div>
      </div>
    </section>

    <section class="workspace">
      <div class="workspace__panel">
        <div class="section-heading">
          <p>Live pattern</p>
          <h2>What the day is made of</h2>
        </div>
        <div class="stats">
          <article>
            <span>Focus</span>
            <strong id="focusValue">4 blocks</strong>
          </article>
          <article>
            <span>Drift</span>
            <strong id="driftValue">Low</strong>
          </article>
          <article>
            <span>Lift</span>
            <strong id="liftValue">High</strong>
          </article>
        </div>
        <div class="timeline" id="timeline"></div>
      </div>

      <div class="workspace__panel workspace__panel--tall">
        <div class="section-heading">
          <p>Notation</p>
          <h2>Add a thought</h2>
        </div>
        <form id="noteForm" class="note-form">
          <input id="noteInput" maxlength="42" placeholder="What should stay in orbit?" />
          <select id="tagInput">
            <option>focus</option>
            <option>creative</option>
            <option>admin</option>
            <option>people</option>
            <option>rest</option>
          </select>
          <button type="submit">Launch</button>
        </form>
        <ul id="noteList" class="note-list"></ul>
      </div>
    </section>
  </main>
`;

const moodSelect = document.querySelector("#moodSelect");
const canvas = document.querySelector("#orbitCanvas");
const ctx = canvas.getContext("2d");
const coreValue = document.querySelector("#coreValue");
const coreNote = document.querySelector("#coreNote");
const focusValue = document.querySelector("#focusValue");
const driftValue = document.querySelector("#driftValue");
const liftValue = document.querySelector("#liftValue");
const timeline = document.querySelector("#timeline");
const noteForm = document.querySelector("#noteForm");
const noteInput = document.querySelector("#noteInput");
const tagInput = document.querySelector("#tagInput");
const noteList = document.querySelector("#noteList");
const randomizeBtn = document.querySelector("#randomizeBtn");
const restored = loadState();

let currentMood = moods[0];
let notes = [
  { text: "Shield the morning", tag: "focus" },
  { text: "Ship one useful thing", tag: "creative" },
  { text: "Answer the obvious messages", tag: "people" },
];
let pointer = { x: 0, y: 0, active: false };
let backdropParticles = Array.from({ length: 84 }, (_, index) => ({
  x: Math.random(),
  y: Math.random(),
  r: 0.6 + Math.random() * 1.8,
  speed: 0.00012 + Math.random() * 0.00026,
  sway: Math.random() * Math.PI * 2,
  layer: index % 3,
}));

let orbitNodes = seedNodes.map(([label, tag, x, y, size], index) => ({
  label,
  tag,
  x,
  y,
  size,
  angle: index * 1.1,
  speed: 0.002 + index * 0.0005,
  radius: 132 + index * 18,
}));

if (restored?.notes?.length) notes = restored.notes;
if (Number.isInteger(restored?.moodIndex)) {
  moodSelect.value = String(restored.moodIndex);
  currentMood = moods[restored.moodIndex];
}

function saveState() {
  const state = {
    moodIndex: Number(moodSelect.value),
    notes,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  } catch {
    return null;
  }
}

if (restored?.notes?.length) notes = restored.notes;
if (Number.isInteger(restored?.moodIndex)) moodSelect.value = String(restored.moodIndex);

function populateMoodOptions() {
  moodSelect.innerHTML = moods
    .map((mood, index) => `<option value="${index}">${mood.label}</option>`)
    .join("");
}

function setMood(index) {
  currentMood = moods[index];
  document.documentElement.style.setProperty("--accent-hue", currentMood.hue);
  coreValue.textContent = `${currentMood.energy}%`;
  coreNote.textContent = currentMood.label.toLowerCase() + " drift";
  focusValue.textContent = `${Math.max(3, Math.round(currentMood.energy / 18))} blocks`;
  driftValue.textContent = currentMood.gravity > 0.6 ? "Anchored" : "Light";
  liftValue.textContent = currentMood.energy > 60 ? "High" : "Building";
  document.body.dataset.mood = currentMood.label.toLowerCase();
  renderTimeline();
  saveState();
}

function renderTimeline() {
  const items = [
    ["01", "Frame the day", `Mood ${currentMood.label}`],
    ["02", "Protect focus", `${focusValue.textContent} available`],
    ["03", "Reduce drag", driftValue.textContent],
    ["04", "Keep orbit tidy", notes.length + " live notes"],
  ];

  timeline.innerHTML = items
    .map(
      ([step, title, meta]) => `
      <div class="timeline__item">
        <span>${step}</span>
        <div>
          <strong>${title}</strong>
          <p>${meta}</p>
        </div>
      </div>`
    )
    .join("");
}

function renderNotes() {
  noteList.innerHTML = notes
    .slice(0, 6)
    .map(
      (note) => `
      <li>
        <span>${note.tag}</span>
        <strong>${note.text}</strong>
      </li>`
    )
    .join("");
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function draw(now) {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  ctx.clearRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;
  const t = now * 0.00025;
  const parallaxX = pointer.active ? (pointer.x - 0.5) * 18 : Math.sin(now * 0.0001) * 8;
  const parallaxY = pointer.active ? (pointer.y - 0.5) * 18 : Math.cos(now * 0.00011) * 6;

  ctx.fillStyle = "rgba(7, 17, 31, 0.18)";
  ctx.fillRect(0, 0, w, h);

  backdropParticles.forEach((particle) => {
    particle.y += particle.speed * (0.5 + currentMood.gravity * 0.7);
    if (particle.y > 1.08) particle.y = -0.08;
    const px = w * particle.x + Math.sin(t * 5 + particle.sway) * (18 + particle.layer * 10);
    const py = h * particle.y + Math.cos(t * 4 + particle.sway) * (12 + particle.layer * 8);
    ctx.fillStyle = `hsla(${currentMood.hue + particle.layer * 22}, 90%, 72%, ${0.12 + particle.layer * 0.07})`;
    ctx.beginPath();
    ctx.arc(px, py, particle.r, 0, Math.PI * 2);
    ctx.fill();
  });

  const glow = ctx.createRadialGradient(cx, cy, 24, cx, cy, Math.min(w, h) * 0.44);
  glow.addColorStop(0, `hsla(${currentMood.hue}, 90%, 68%, 0.24)`);
  glow.addColorStop(1, "rgba(7, 17, 31, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, Math.min(w, h) * 0.46, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  [0.22, 0.34, 0.46].forEach((ratio) => {
    ctx.beginPath();
    ctx.arc(cx, cy, Math.min(w, h) * ratio, 0, Math.PI * 2);
    ctx.stroke();
  });

  ctx.fillStyle = `hsla(${currentMood.hue}, 85%, 65%, 1)`;
  ctx.beginPath();
  ctx.arc(cx + parallaxX, cy + parallaxY, 18 + currentMood.energy * 0.08, 0, Math.PI * 2);
  ctx.fill();

  orbitNodes.forEach((node, index) => {
    node.angle += node.speed * (currentMood.gravity * 0.8 + 0.5);
    const x = cx + parallaxX + Math.cos(node.angle + t) * node.radius * (0.74 + index * 0.02);
    const y = cy + parallaxY + Math.sin(node.angle * 0.92 + t * 1.3) * node.radius * 0.58;

    ctx.strokeStyle = `hsla(${(currentMood.hue + index * 19) % 360}, 85%, 68%, 0.18)`;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x, y);
    ctx.stroke();

    ctx.fillStyle = `hsla(${(currentMood.hue + index * 16) % 360}, 92%, 72%, 0.95)`;
    ctx.beginPath();
    ctx.arc(x, y, node.size * 0.8, 0, Math.PI * 2);
    ctx.fill();
  });

  requestAnimationFrame(draw);
}

noteForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = noteInput.value.trim();
  if (!text) return;
  notes = [{ text, tag: tagInput.value }, ...notes].slice(0, 8);
  noteInput.value = "";
  renderNotes();
  renderTimeline();
  saveState();
});

moodSelect.addEventListener("change", (event) => setMood(Number(event.target.value)));
randomizeBtn.addEventListener("click", () => {
  const nextIndex = Math.floor(Math.random() * moods.length);
  moodSelect.value = String(nextIndex);
  setMood(nextIndex);
  orbitNodes = orbitNodes.map((node, index) => ({
    ...node,
    radius: 116 + index * 20 + Math.random() * 18,
    speed: 0.0015 + Math.random() * 0.0015,
  }));
  saveState();
});

window.addEventListener("pointermove", (event) => {
  const rect = canvas.getBoundingClientRect();
  pointer = {
    x: (event.clientX - rect.left) / rect.width,
    y: (event.clientY - rect.top) / rect.height,
    active: event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom,
  };
});

window.addEventListener("pointerleave", () => {
  pointer.active = false;
});

populateMoodOptions();
renderNotes();
setMood(Number(moodSelect.value || 0));
resizeCanvas();
window.addEventListener("resize", resizeCanvas);
requestAnimationFrame(draw);
