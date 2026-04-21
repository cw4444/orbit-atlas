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

const clusterPalette = {
  focus: { label: "Focus", x: 0.52, y: 0.24, colorShift: 0 },
  creative: { label: "Creative", x: 0.78, y: 0.52, colorShift: 18 },
  people: { label: "People", x: 0.56, y: 0.76, colorShift: 36 },
  admin: { label: "Admin", x: 0.26, y: 0.66, colorShift: 54 },
  rest: { label: "Rest", x: 0.2, y: 0.34, colorShift: 72 },
  priority: { label: "Priority", x: 0.36, y: 0.18, colorShift: 96 },
  ritual: { label: "Ritual", x: 0.68, y: 0.18, colorShift: 120 },
  other: { label: "Other", x: 0.82, y: 0.32, colorShift: 144 },
};

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
          <button id="galaxyBtn" type="button" aria-pressed="false">Galaxy mode</button>
          <button id="presentationBtn" type="button" aria-pressed="false">Presentation mode</button>
          <button id="exportBtn" type="button">Download backup</button>
          <button id="importBtn" type="button">Restore backup</button>
        </div>
      </div>
      <div class="hero__visual">
        <canvas id="orbitCanvas" aria-label="Animated orbit visual"></canvas>
        <div id="noteLayer" class="note-layer" aria-label="Draggable notes"></div>
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

      <div class="workspace__panel">
        <div class="section-heading">
          <p>Clusters</p>
          <h2>Mind map groups</h2>
        </div>
        <div class="cluster-search">
          <input id="searchInput" type="search" placeholder="Search notes or tags" />
        </div>
        <div id="clusterFilter" class="cluster-filter"></div>
        <div id="clusterBoard" class="cluster-board"></div>
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
        <div class="editor-hint">Drag a note in the visual to move it around the orbit. Use the arrows below the note list to reorder the set.</div>
        <ul id="noteList" class="note-list"></ul>
      </div>
    </section>

    <section id="presentationDeck" class="presentation-deck" aria-label="Presentation mode overview">
      <div class="presentation-deck__hero">
        <p class="eyebrow">Presentation mode</p>
        <h2>Orbit Atlas, distilled.</h2>
        <p class="lede">A clean live board for showing the current shape of your thoughts, clusters, and momentum without the editing chrome.</p>
      </div>
      <div class="presentation-legend">
        <span>Legend</span>
        <div class="presentation-legend__items" id="presentationLegend"></div>
      </div>
      <div class="presentation-summary">
        <div class="presentation-summary__copy">
          <span>Summary</span>
          <strong id="presentationSummaryTitle">Clear, steady, and focused</strong>
          <p id="presentationSummaryBody">The map is mostly balanced with one clear dominant cluster and a gentle drift toward action.</p>
        </div>
        <div class="presentation-summary__metrics">
          <div>
            <span>Dominant cluster</span>
            <strong id="presentationDominant">Focus</strong>
          </div>
          <div>
            <span>Spread</span>
            <strong id="presentationSpread">Compact</strong>
          </div>
          <div>
            <span>Search focus</span>
            <strong id="presentationSearch">None</strong>
          </div>
        </div>
      </div>
      <div class="presentation-story">
        <div>
          <span>Talking point</span>
          <strong id="presentationTalk">This cluster is where the useful work is gathering.</strong>
          <p id="presentationTalk2">It stays close to the center because it supports the main shape of the day.</p>
        </div>
        <div class="presentation-story__actions">
          <button id="presentationNextBtn" type="button">Next cluster</button>
          <button id="presentationAutoBtn" type="button" aria-pressed="true">Auto tour</button>
        </div>
      </div>
      <div class="presentation-grid">
        <article class="presentation-card">
          <span>Current mood</span>
          <strong id="presentationMood">Clear</strong>
        </article>
        <article class="presentation-card">
          <span>Active cluster</span>
          <strong id="presentationCluster">All</strong>
        </article>
        <article class="presentation-card">
          <span>Live notes</span>
          <strong id="presentationNotes">3</strong>
        </article>
        <article class="presentation-card presentation-card--wide">
          <span>Cluster board</span>
          <div id="presentationClusters" class="presentation-clusters"></div>
        </article>
        <article class="presentation-card presentation-card--wide">
          <span>Active cluster</span>
          <strong id="presentationActiveTitle">Focus</strong>
          <p id="presentationActiveBody">The active group is the one we are currently touring and spotlighting.</p>
        </article>
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
const searchInput = document.querySelector("#searchInput");
const clusterFilter = document.querySelector("#clusterFilter");
const clusterBoard = document.querySelector("#clusterBoard");
const randomizeBtn = document.querySelector("#randomizeBtn");
const galaxyBtn = document.querySelector("#galaxyBtn");
const exportBtn = document.querySelector("#exportBtn");
const importBtn = document.querySelector("#importBtn");
const presentationBtn = document.querySelector("#presentationBtn");
const noteLayer = document.querySelector("#noteLayer");
const presentationDeck = document.querySelector("#presentationDeck");
const presentationMood = document.querySelector("#presentationMood");
const presentationCluster = document.querySelector("#presentationCluster");
const presentationNotes = document.querySelector("#presentationNotes");
const presentationClusters = document.querySelector("#presentationClusters");
const presentationSummaryTitle = document.querySelector("#presentationSummaryTitle");
const presentationSummaryBody = document.querySelector("#presentationSummaryBody");
const presentationDominant = document.querySelector("#presentationDominant");
const presentationSpread = document.querySelector("#presentationSpread");
const presentationSearch = document.querySelector("#presentationSearch");
const presentationTalk = document.querySelector("#presentationTalk");
const presentationTalk2 = document.querySelector("#presentationTalk2");
const presentationNextBtn = document.querySelector("#presentationNextBtn");
const presentationAutoBtn = document.querySelector("#presentationAutoBtn");
const presentationLegend = document.querySelector("#presentationLegend");
const presentationActiveTitle = document.querySelector("#presentationActiveTitle");
const presentationActiveBody = document.querySelector("#presentationActiveBody");
const importFile = document.createElement("input");
importFile.type = "file";
importFile.accept = "application/json,.json";
importFile.hidden = true;
document.body.appendChild(importFile);
const restored = loadState();

let currentMood = moods[0];
let galaxyMode = restored?.galaxyMode ?? false;
let notes = [
  { text: "Shield the morning", tag: "focus", x: 0.25, y: 0.2 },
  { text: "Ship one useful thing", tag: "creative", x: 0.72, y: 0.42 },
  { text: "Answer the obvious messages", tag: "people", x: 0.37, y: 0.73 },
];
let pointer = { x: 0, y: 0, active: false };
let dragState = null;
let clusterClock = 0;
let searchTerm = "";
let activeCluster = restored?.activeCluster ?? "all";
let collapsedClusters = new Set(restored?.collapsedClusters ?? []);
let presentationMode = restored?.presentationMode ?? false;
let presentationIndex = restored?.presentationIndex ?? 0;
let presentationAutoPlay = restored?.presentationAutoPlay ?? true;
let presentationTimer = null;
let presentationTimerPhase = 0;
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
  pulse: 0.7 + index * 0.15,
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
    galaxyMode,
    activeCluster,
    collapsedClusters: [...collapsedClusters],
    presentationMode,
    presentationIndex,
    presentationAutoPlay,
    presentationTimerPhase,
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
  document.body.dataset.galaxy = galaxyMode ? "on" : "off";
  document.body.dataset.presentation = presentationMode ? "on" : "off";
  galaxyBtn.setAttribute("aria-pressed", String(galaxyMode));
  galaxyBtn.textContent = galaxyMode ? "Galaxy mode: on" : "Galaxy mode";
  presentationBtn.setAttribute("aria-pressed", String(presentationMode));
  presentationBtn.textContent = presentationMode ? "Presentation mode: on" : "Presentation mode";
  presentationDeck.hidden = !presentationMode;
  document.body.classList.toggle("presentation-mode", presentationMode);
  renderTimeline();
  renderPresentationDeck();
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

function renderPresentationDeck() {
  presentationMood.textContent = currentMood.label;
  presentationCluster.textContent =
    activeCluster === "all"
      ? "All"
      : activeCluster.charAt(0).toUpperCase() + activeCluster.slice(1);
  presentationNotes.textContent = String(notes.length);
  const groups = noteClusters();
  const dominantGroup = [...groups].sort((a, b) => b.indices.length - a.indices.length)[0];
  const dominantLabel = dominantGroup?.cluster.label ?? "None";
  const dominantCount = dominantGroup?.indices.length ?? 0;
  const totalVisible = getFilteredNotes().length;
  const visibleNames = getVisibleClusterNames();
  const orderedGroups = groups.length ? groups : [{ cluster: clusterPalette.other, indices: [] }];
  const currentTour = orderedGroups[presentationIndex % orderedGroups.length];
  const tourLabel = currentTour.cluster.label;
  const tourCount = currentTour.indices.length;
  const spread = totalVisible >= 6 ? "Wide" : totalVisible >= 3 ? "Balanced" : "Compact";
  const searchLabel = searchTerm.trim() ? searchTerm.trim() : activeCluster === "all" ? "None" : activeCluster;
  const title =
    currentMood.energy > 70
      ? "Bright, active, and ready to move"
      : currentMood.gravity > 0.6
        ? "Calm, anchored, and easy to read"
        : "Light and exploratory";
  const stageTitle =
    presentationMode && activeCluster !== "all"
      ? `${tourLabel} on stage`
      : presentationMode
        ? "The whole board on stage"
        : "";
  const body =
      dominantCount === 0
        ? "The board is quiet right now. Add a few notes and the clusters will start to form."
        : `The ${dominantLabel.toLowerCase()} cluster leads with ${dominantCount} note${dominantCount === 1 ? "" : "s"}, while ${visibleNames.length > 1 ? "the rest stay readable around it" : "the rest remain in the background"}.`;
  presentationSummaryTitle.textContent = title;
  presentationSummaryBody.textContent = body;
  presentationDominant.textContent = dominantLabel;
  presentationSpread.textContent = spread;
  presentationSearch.textContent = searchLabel;
  const clusterFacts = getClusterFacts(currentTour.cluster, tourCount, totalVisible, dominantLabel);
  presentationTalk.textContent = clusterFacts[0];
  presentationTalk2.textContent = clusterFacts[1];
  presentationActiveTitle.textContent = stageTitle || tourLabel;
  presentationActiveBody.textContent =
    tourCount === 0
      ? "This cluster is waiting for a note to arrive."
      : `It has ${tourCount} note${tourCount === 1 ? "" : "s"} and sits inside the larger story of the board.`;
  renderLegend();
  presentationClusters.innerHTML = groups
    .map(({ cluster, indices }) => {
      const isActive = activeCluster === "all" || activeCluster === cluster.label.toLowerCase();
      return `
        <div class="presentation-clusters__item ${isActive ? "is-active" : ""}">
          <span>${cluster.label}</span>
          <strong>${indices.length}</strong>
        </div>`;
    })
    .join("");
  presentationNextBtn.disabled = groups.length === 0;
  presentationAutoBtn.setAttribute("aria-pressed", String(presentationAutoPlay));
  presentationAutoBtn.textContent = presentationAutoPlay ? "Auto tour: on" : "Auto tour";
  const spotlightCluster = currentTour.cluster.label.toLowerCase();
  document.body.dataset.spotlight = presentationMode ? spotlightCluster : "off";
  document.body.classList.toggle("presentation-stage", presentationMode);
}

function getClusterFacts(cluster, count, totalVisible, dominantLabel) {
  const label = cluster.label.toLowerCase();
  const isDominant = cluster.label === dominantLabel;
  const balanceWord = count >= Math.max(3, Math.round(totalVisible / 2)) ? "dominates" : "supports";
  const first = count === 0
    ? `The ${label} cluster is quiet right now.`
    : isDominant
      ? `The ${label} cluster leads the board with ${count} note${count === 1 ? "" : "s"}.`
      : `The ${label} cluster ${balanceWord} the bigger picture with ${count} note${count === 1 ? "" : "s"}.`;
  const second = count === 0
    ? "That makes it easy to introduce a new idea without fighting existing structure."
    : isDominant
      ? "This is the place to point to when you want the audience to understand the main theme fast."
      : "It gives the board texture by showing the supporting ideas around the main thread.";
  return [first, second];
}

function renderLegend() {
  const items = Object.values(clusterPalette).filter((item) => item.label !== "Other");
  presentationLegend.innerHTML = items
    .map(
      (item) => `
        <div class="presentation-legend__item">
          <span class="presentation-legend__swatch" style="--swatch-hue:${(currentMood.hue + item.colorShift) % 360}"></span>
          <strong>${item.label}</strong>
        </div>`
    )
    .join("");
}

function togglePresentationMode(force) {
  presentationMode = typeof force === "boolean" ? force : !presentationMode;
  document.body.classList.toggle("presentation-mode", presentationMode);
  presentationDeck.hidden = !presentationMode;
  presentationBtn.setAttribute("aria-pressed", String(presentationMode));
  presentationBtn.textContent = presentationMode ? "Presentation mode: on" : "Presentation mode";
  if (presentationMode) startPresentationAutoplay();
  else stopPresentationAutoplay();
  renderPresentationDeck();
  saveState();
}

function startPresentationAutoplay() {
  stopPresentationAutoplay();
  if (!presentationAutoPlay) return;
  presentationTimer = setInterval(() => {
    if (!presentationMode) {
      stopPresentationAutoplay();
      return;
    }
    presentationTimerPhase += 1;
    if (presentationTimerPhase % 2 === 0) advancePresentationTour();
  }, 3500);
}

function stopPresentationAutoplay() {
  if (presentationTimer) {
    clearInterval(presentationTimer);
    presentationTimer = null;
  }
}

function advancePresentationTour() {
  const groups = noteClusters();
  if (!groups.length) return;
  presentationIndex = (presentationIndex + 1) % groups.length;
  const nextCluster = groups[presentationIndex].cluster.label.toLowerCase();
  activeCluster = nextCluster;
  renderNotes();
  renderTimeline();
  renderPresentationDeck();
  saveState();
}

function togglePresentationAutoplay() {
  presentationAutoPlay = !presentationAutoPlay;
  presentationTimerPhase = 0;
  if (presentationMode) {
    if (presentationAutoPlay) startPresentationAutoplay();
    else stopPresentationAutoplay();
  }
  renderPresentationDeck();
  saveState();
}

function getFilteredNotes() {
  const term = searchTerm.trim().toLowerCase();
  if (!term && activeCluster === "all") return notes;
  return notes.filter((note) => {
    const haystack = `${note.text} ${note.tag}`.toLowerCase();
    const tagMatch = activeCluster === "all" || note.tag === activeCluster;
    return haystack.includes(term) && tagMatch;
  });
}

function getVisibleClusterNames() {
  const term = searchTerm.trim().toLowerCase();
  return noteClusters()
    .filter(({ cluster, indices }) => {
      const clusterName = cluster.label.toLowerCase();
      const searchMatch = !term || clusterName.includes(term) || indices.some((index) => {
        const note = notes[index];
        return `${note.text} ${note.tag}`.toLowerCase().includes(term);
      });
      const activeMatch = activeCluster === "all" || clusterName === activeCluster;
      return searchMatch && activeMatch && !collapsedClusters.has(clusterName);
    })
    .map(({ cluster }) => cluster.label.toLowerCase());
}

function renderNotes() {
  const visibleNotes = getFilteredNotes();
  noteList.innerHTML = visibleNotes
    .slice(0, 6)
    .map(
      (note) => {
        const actualIndex = notes.indexOf(note);
        return `
      <li data-index="${actualIndex}">
        <div>
          <span>${note.tag}</span>
          <strong>${note.text}</strong>
        </div>
        <div class="note-actions">
          <select data-action="tag" data-index="${actualIndex}">
            ${Object.keys(clusterPalette)
              .filter((key) => key !== "other")
              .map((key) => `<option value="${key}" ${key === note.tag ? "selected" : ""}>${clusterPalette[key].label}</option>`)
              .join("")}
          </select>
          <button type="button" data-action="up" data-index="${actualIndex}">Up</button>
          <button type="button" data-action="down" data-index="${actualIndex}">Down</button>
        </div>
      </li>`;
      }
    )
    .join("");
  renderNoteLayer();
  renderClusters();
  noteList.querySelectorAll("button[data-action]").forEach((button) => {
    button.addEventListener("click", handleReorderClick);
  });
  noteList.querySelectorAll("select[data-action='tag']").forEach((select) => {
    select.addEventListener("change", handleRetagChange);
  });
  renderClusterFilter();
}

function ensureNotePositions() {
  const grouped = new Map();
  notes.forEach((note) => {
    const key = clusterPalette[note.tag]?.label ?? "Other";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(note);
  });

  const arranged = [];
  grouped.forEach((groupNotes, key) => {
    const cluster = Object.values(clusterPalette).find((item) => item.label === key) ?? clusterPalette.other;
    groupNotes.forEach((note, index) => {
      const angle = (Math.PI * 2 * index) / Math.max(groupNotes.length, 1);
      const radius = groupNotes.length === 1 ? 0 : 0.07 + index * 0.012;
      arranged.push({
        ...note,
        x: typeof note.x === "number" ? note.x : cluster.x + Math.cos(angle) * radius,
        y: typeof note.y === "number" ? note.y : cluster.y + Math.sin(angle) * radius,
      });
    });
  });

  notes = arranged;
}

function renderNoteLayer() {
  noteLayer.innerHTML = notes
    .map(
      (note, index) => {
        const x = Math.max(0.08, Math.min(0.92, note.x ?? 0.5));
        const y = Math.max(0.08, Math.min(0.88, note.y ?? 0.5));
        const clusterName = clusterForTag(note.tag).label.toLowerCase();
        const active = (!searchTerm || `${note.text} ${note.tag}`.toLowerCase().includes(searchTerm.toLowerCase()))
          && (activeCluster === "all" || activeCluster === clusterName)
          && !collapsedClusters.has(clusterName);
        return `
          <button class="note-node ${active ? "" : "is-muted"}" data-index="${index}" style="left:${x * 100}%; top:${y * 100}%;">
            <span>${note.tag}</span>
            <strong>${note.text}</strong>
          </button>`;
      }
    )
    .join("");
  noteLayer.querySelectorAll(".note-node").forEach((node) => {
    node.addEventListener("pointerdown", startDragNote);
  });
}

function startDragNote(event) {
  event.preventDefault();
  const index = Number(event.currentTarget.dataset.index);
  const rect = canvas.getBoundingClientRect();
  dragState = {
    index,
    offsetX: event.clientX - rect.left,
    offsetY: event.clientY - rect.top,
    rect,
  };
  event.currentTarget.setPointerCapture(event.pointerId);
}

function updateDraggedNote(clientX, clientY) {
  if (dragState == null) return;
  const rect = canvas.getBoundingClientRect();
  const x = (clientX - rect.left) / rect.width;
  const y = (clientY - rect.top) / rect.height;
  notes = notes.map((note, index) =>
    index === dragState.index
      ? { ...note, x: Math.max(0.08, Math.min(0.92, x)), y: Math.max(0.08, Math.min(0.88, y)) }
      : note
  );
  renderNotes();
  saveState();
}

function endDragNote() {
  dragState = null;
}

function moveNote(index, direction) {
  const target = index + direction;
  if (target < 0 || target >= notes.length) return;
  const next = [...notes];
  [next[index], next[target]] = [next[target], next[index]];
  notes = next;
  renderNotes();
  saveState();
}

function handleReorderClick(event) {
  const index = Number(event.currentTarget.dataset.index);
  const direction = event.currentTarget.dataset.action === "up" ? -1 : 1;
  moveNote(index, direction);
}

function handleRetagChange(event) {
  const index = Number(event.currentTarget.dataset.index);
  const tag = event.currentTarget.value;
  notes = notes.map((note, noteIndex) => (noteIndex === index ? { ...note, tag } : note));
  ensureNotePositions();
  renderNotes();
  saveState();
}

function clusterForTag(tag) {
  return clusterPalette[tag] ?? clusterPalette.other;
}

function noteClusters() {
  const grouped = new Map();
  notes.forEach((note, index) => {
    const cluster = clusterForTag(note.tag);
    if (!grouped.has(cluster.label)) grouped.set(cluster.label, { cluster, indices: [] });
    grouped.get(cluster.label).indices.push(index);
  });
  return [...grouped.values()];
}

function noteConnections() {
  return noteClusters()
    .filter(({ cluster }) => activeCluster === "all" || cluster.label.toLowerCase() === activeCluster)
    .flatMap(({ indices }) =>
      indices.slice(1).map((current, idx) => [indices[idx], current])
    );
}

function renderClusters() {
  const groups = noteClusters();
  clusterBoard.innerHTML = groups
    .map(({ cluster, indices }) => {
      const preview = indices
        .slice(0, 3)
        .map((index) => notes[index]?.text)
        .filter(Boolean)
        .join(" • ");
      const clusterName = cluster.label.toLowerCase();
      const isCollapsed = collapsedClusters.has(clusterName);
      return `
        <article class="cluster-card ${isCollapsed ? "is-collapsed" : ""}">
          <div class="cluster-card__top">
            <span>${cluster.label}</span>
            <strong>${indices.length}</strong>
          </div>
          <p>${preview || "No notes yet"}</p>
          <div class="cluster-card__actions">
            <button type="button" data-cluster="${clusterName}" data-action="focus">Focus</button>
            <button type="button" data-cluster="${clusterName}" data-action="toggle">${isCollapsed ? "Expand" : "Collapse"}</button>
          </div>
        </article>`;
    })
    .join("");
  clusterBoard.querySelectorAll("button[data-action]").forEach((button) => {
    button.addEventListener("click", handleClusterAction);
  });
}

function renderClusterFilter() {
  const groups = noteClusters();
  clusterFilter.innerHTML = [
    `<button type="button" data-cluster="all" class="${activeCluster === "all" ? "is-active" : ""}">All</button>`,
    ...groups.map(({ cluster }) => `<button type="button" data-cluster="${cluster.label.toLowerCase()}" class="${activeCluster === cluster.label.toLowerCase() ? "is-active" : ""}">${cluster.label}</button>`),
  ].join("");
  clusterFilter.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      activeCluster = button.dataset.cluster;
      renderNotes();
      renderTimeline();
      saveState();
    });
  });
}

function handleClusterAction(event) {
  const cluster = event.currentTarget.dataset.cluster;
  const action = event.currentTarget.dataset.action;
  if (action === "focus") activeCluster = cluster;
  if (action === "toggle") {
    if (collapsedClusters.has(cluster)) collapsedClusters.delete(cluster);
    else collapsedClusters.add(cluster);
  }
  renderNotes();
  renderTimeline();
  saveState();
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
  const zoom = galaxyMode ? 1.18 : 1;
  const parallaxX = pointer.active ? (pointer.x - 0.5) * (galaxyMode ? 42 : 18) : Math.sin(now * 0.0001) * (galaxyMode ? 16 : 8);
  const parallaxY = pointer.active ? (pointer.y - 0.5) * (galaxyMode ? 42 : 18) : Math.cos(now * 0.00011) * (galaxyMode ? 12 : 6);

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

  const links = noteConnections();
  links.forEach(([a, b], index) => {
    const first = notes[a];
    const second = notes[b];
    if (!first || !second) return;
    const x1 = w * (first.x ?? 0.5);
    const y1 = h * (first.y ?? 0.5);
    const x2 = w * (second.x ?? 0.5);
    const y2 = h * (second.y ?? 0.5);
    ctx.strokeStyle = `hsla(${(currentMood.hue + index * 14) % 360}, 90%, 70%, 0.22)`;
    ctx.lineWidth = galaxyMode ? 1.8 : 1.2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(cx + Math.sin(index) * 70, cy + Math.cos(index) * 50, x2, y2);
    ctx.stroke();
  });

  const clusters = noteClusters();
  clusters.forEach(({ cluster, indices }, index) => {
    const hubX = cx + (cluster.x - 0.5) * w * (galaxyMode ? 0.96 : 0.78);
    const hubY = cy + (cluster.y - 0.5) * h * (galaxyMode ? 0.96 : 0.78);
    const halo = ctx.createRadialGradient(hubX, hubY, 8, hubX, hubY, 92);
    halo.addColorStop(0, `hsla(${(currentMood.hue + cluster.colorShift) % 360}, 92%, 70%, 0.22)`);
    halo.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(hubX, hubY, 92, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `hsla(${(currentMood.hue + cluster.colorShift) % 360}, 90%, 68%, 0.38)`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(hubX, hubY, 8 + indices.length * 1.5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = `hsla(${(currentMood.hue + cluster.colorShift) % 360}, 90%, 80%, 0.95)`;
    ctx.beginPath();
    ctx.arc(hubX, hubY, 4.5, 0, Math.PI * 2);
    ctx.fill();
  });

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
    const speedBoost = galaxyMode ? 2.1 : 1;
    node.angle += node.speed * (currentMood.gravity * 0.8 + 0.5) * speedBoost;
    const orbitRadius = node.radius * zoom * (0.74 + index * 0.02 + (galaxyMode ? 0.08 : 0));
    const x = cx + parallaxX + Math.cos(node.angle + t) * orbitRadius;
    const y = cy + parallaxY + Math.sin(node.angle * 0.92 + t * 1.3) * node.radius * (galaxyMode ? 0.84 : 0.58);
    const pulse = galaxyMode ? 0.5 + Math.sin(now * 0.004 + index) * 0.5 : 1;

    ctx.strokeStyle = `hsla(${(currentMood.hue + index * 19) % 360}, 85%, 68%, 0.18)`;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x, y);
    ctx.stroke();

    ctx.fillStyle = `hsla(${(currentMood.hue + index * 16) % 360}, 92%, 72%, 0.95)`;
    ctx.beginPath();
    ctx.arc(x, y, node.size * 0.8 * pulse, 0, Math.PI * 2);
    ctx.fill();
  });

  clusters.forEach(({ cluster, indices }) => {
    const hubX = cx + (cluster.x - 0.5) * w * (galaxyMode ? 0.96 : 0.78);
    const hubY = cy + (cluster.y - 0.5) * h * (galaxyMode ? 0.96 : 0.78);
    const labelFloat = Math.sin(now * 0.001 + indices.length) * 4;
    const label = `${cluster.label} ${indices.length}`;
    ctx.fillStyle = "rgba(5, 10, 18, 0.78)";
    const textWidth = ctx.measureText(label).width;
    const labelX = hubX - textWidth / 2 - 10;
    const labelY = hubY - 28 + labelFloat;
    ctx.beginPath();
    ctx.roundRect(labelX - 6, labelY - 14, textWidth + 12, 28, 14);
    ctx.fill();
    ctx.fillStyle = `hsla(${(currentMood.hue + cluster.colorShift) % 360}, 88%, 84%, 0.95)`;
    ctx.font = "12px Inter, ui-sans-serif, system-ui, sans-serif";
    ctx.fillText(label, labelX, labelY + 5);
  });

  requestAnimationFrame(draw);
}

noteForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = noteInput.value.trim();
  if (!text) return;
  const cluster = clusterForTag(tagInput.value);
  notes = [{ text, tag: tagInput.value, x: cluster.x, y: cluster.y }, ...notes].slice(0, 8);
  ensureNotePositions();
  noteInput.value = "";
  renderNotes();
  renderTimeline();
  saveState();
});

searchInput.addEventListener("input", (event) => {
  searchTerm = event.target.value;
  renderNotes();
  renderTimeline();
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

galaxyBtn.addEventListener("click", () => {
  galaxyMode = !galaxyMode;
  orbitNodes = orbitNodes.map((node, index) => ({
    ...node,
    radius: galaxyMode ? 96 + index * 34 : 132 + index * 18,
    speed: (galaxyMode ? 0.0026 : 0.002) + index * 0.0004,
  }));
  document.body.classList.toggle("galaxy-mode", galaxyMode);
  renderTimeline();
  saveState();
});

presentationBtn.addEventListener("click", () => {
  togglePresentationMode();
});

presentationNextBtn.addEventListener("click", () => {
  advancePresentationTour();
});

presentationAutoBtn.addEventListener("click", () => {
  togglePresentationAutoplay();
});

exportBtn.addEventListener("click", async () => {
  const payload = JSON.stringify({ moodIndex: Number(moodSelect.value), galaxyMode, notes }, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `orbit-atlas-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
  exportBtn.textContent = "Backup saved";
  setTimeout(() => (exportBtn.textContent = "Download backup"), 1200);
});

importBtn.addEventListener("click", () => {
  importFile.click();
});

importFile.addEventListener("change", async () => {
  const file = importFile.files?.[0];
  if (!file) return;
  try {
    const raw = await file.text();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.notes)) notes = parsed.notes;
    if (Number.isInteger(parsed.moodIndex)) moodSelect.value = String(parsed.moodIndex);
    galaxyMode = Boolean(parsed.galaxyMode);
    ensureNotePositions();
    setMood(Number(moodSelect.value || 0));
    document.body.classList.toggle("galaxy-mode", galaxyMode);
    renderNotes();
    saveState();
  } catch {
    window.alert("That backup file could not be read.");
  } finally {
    importFile.value = "";
  }
});

function rebalanceClusters() {
  const grouped = new Map();
  notes.forEach((note) => {
    const cluster = clusterForTag(note.tag);
    if (!grouped.has(cluster.label)) grouped.set(cluster.label, []);
    grouped.get(cluster.label).push(note);
  });

  const redistributed = [];
  grouped.forEach((groupNotes, label) => {
    const cluster = Object.values(clusterPalette).find((item) => item.label === label) ?? clusterPalette.other;
    const clusterName = cluster.label.toLowerCase();
    const focused = activeCluster === clusterName;
    const spread = focused ? 0.075 : 0.045;
    groupNotes.forEach((note, index) => {
      const jitter = spread + index * 0.01;
      const angle = (Math.PI * 2 * index) / Math.max(groupNotes.length, 1) + clusterClock + (focused ? 0.25 : 0);
      redistributed.push({
        ...note,
        x: cluster.x + Math.cos(angle) * jitter,
        y: cluster.y + Math.sin(angle) * jitter,
      });
    });
  });

  notes = redistributed;
  renderNotes();
  saveState();
}

setInterval(() => {
  if (dragState) return;
  clusterClock += 0.08;
  rebalanceClusters();
}, 9000);

window.addEventListener("pointermove", (event) => {
  const rect = canvas.getBoundingClientRect();
  pointer = {
    x: (event.clientX - rect.left) / rect.width,
    y: (event.clientY - rect.top) / rect.height,
    active: event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom,
  };
  if (dragState) updateDraggedNote(event.clientX, event.clientY);
});

window.addEventListener("pointerleave", () => {
  pointer.active = false;
});

window.addEventListener("pointerup", endDragNote);
window.addEventListener("pointercancel", endDragNote);

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && presentationMode) {
    togglePresentationMode(false);
  }
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "p") {
    event.preventDefault();
    togglePresentationMode();
  }
  if (presentationMode && event.key === "ArrowRight") {
    advancePresentationTour();
  }
});

populateMoodOptions();
ensureNotePositions();
renderNotes();
setMood(Number(moodSelect.value || 0));
presentationDeck.hidden = !presentationMode;
if (presentationMode) startPresentationAutoplay();
resizeCanvas();
window.addEventListener("resize", resizeCanvas);
requestAnimationFrame(draw);
