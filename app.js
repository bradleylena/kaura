/* ===============================
   CORE REFERENCES
=============================== */
const app = document.querySelector(".app");
const welcome = document.getElementById("welcome");
const garden = document.getElementById("garden");
const journal = document.getElementById("journal");
const moodButtons = document.querySelectorAll(".mood-bar button[data-mood]");
const letGoBtn = document.getElementById("letGo");

const currentDayEl = document.getElementById("currentDay");
const prevDayBtn = document.getElementById("prevDay");
const nextDayBtn = document.getElementById("nextDay");

/* ===============================
   STATE
=============================== */
let activeMood = null;
let dayOffset = 0;

const MOODS = {
  calm: { color: "#f2a8c9", shape: "flower" },
  happy: { color: "#f7b267", shape: "tulip" },
  heavy: { color: "#a8d5ba", shape: "leaf" },
  love: { color: "#e68aa4", shape: "heart" },
};

/* ===============================
   HELPERS
=============================== */
function selectMood(mood) {
  activeMood = mood;
  moodButtons.forEach((btn) =>
    btn.classList.toggle("active", btn.dataset.mood === mood)
  );
}
function haptic(pattern) {
  if ("vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

function getDayKey(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split("T")[0];
}

function getDayLabel(offset = 0) {
  if (offset === 0) return "Today";
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/* ===============================
   WELCOME FLOW (SINGLE SOURCE)
=============================== */
document.querySelectorAll(".action-card").forEach((card) => {
  card.addEventListener("click", () => {
    welcome.style.display = "none";
    app.style.display = "flex";
    app.classList.remove("writing");

    if (card.dataset.action === "plant") {
      selectMood("calm");
    }

    if (card.dataset.action === "journal") {
      app.classList.add("writing");

      const book = document.querySelector(".book");
      if (book) {
        book.style.animation = "none";
        book.offsetHeight; // reflow
        book.style.animation = "";
      }

      requestAnimationFrame(() => journal.focus());
    }
  });
});

/* ===============================
   LOAD DAY
=============================== */
function loadDay() {
  const key = getDayKey(dayOffset);

  if (currentDayEl) {
    currentDayEl.textContent = getDayLabel(dayOffset);
  }

  journal.value = localStorage.getItem(`journal-${key}`) || "";

  garden.querySelectorAll(".plant").forEach((p) => p.remove());

  const plants = JSON.parse(localStorage.getItem(`garden-${key}`) || "[]");
  plants.forEach((p) => renderPlant(p.x, p.y, p.mood, false));
}

/* ===============================
   DAY NAVIGATION
=============================== */
if (prevDayBtn && nextDayBtn) {
  prevDayBtn.addEventListener("click", () => {
    dayOffset--;
    loadDay();
  });

  nextDayBtn.addEventListener("click", () => {
    dayOffset++;
    loadDay();
  });
}

/* ===============================
   JOURNAL
=============================== */
journal.addEventListener("input", () => {
  localStorage.setItem(`journal-${getDayKey(dayOffset)}`, journal.value);
});

/* ===============================
   MOOD SELECTION
=============================== */
moodButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    app.classList.remove("writing");
    selectMood(btn.dataset.mood);
  });
});

/* ===============================
   GARDEN INTERACTION
=============================== */
garden.addEventListener("click", (e) => {
  if (!activeMood) return;

  const rect = garden.getBoundingClientRect();
  renderPlant(e.clientX - rect.left, e.clientY - rect.top, activeMood, true);
});

function renderPlant(x, y, mood, save) {
  const { color, shape } = MOODS[mood];

  const plant = document.createElement("div");
  plant.className = `plant ${shape}`;
  plant.style.left = `${x}px`;
  plant.style.top = `${y}px`;
  plant.style.background = color;

  garden.appendChild(plant);

  if (!save) return;

  const key = getDayKey(dayOffset);
  const data = JSON.parse(localStorage.getItem(`garden-${key}`) || "[]");
  data.push({ x, y, mood });
  localStorage.setItem(`garden-${key}`, JSON.stringify(data));
}

/* ===============================
   LET GO (UNDO)
=============================== */
letGoBtn.addEventListener("click", () => {
  const key = getDayKey(dayOffset);
  const data = JSON.parse(localStorage.getItem(`garden-${key}`) || "[]");

  if (!data.length) return;

  data.pop();
  localStorage.setItem(`garden-${key}`, JSON.stringify(data));

  const plants = garden.querySelectorAll(".plant");
  plants[plants.length - 1]?.remove();
});

/* ===============================
   INIT
=============================== */
loadDay();
/* ===============================
   BREATHING
=============================== */
const breatheScreen = document.getElementById("breathe");
const breatheText = document.getElementById("breathe-text");
const exitBreathe = document.getElementById("exitBreathe");

let breatheInterval = null;

function startBreathing() {
  app.style.display = "none";
  welcome.style.display = "none";
  breatheScreen.style.display = "grid";

  const phases = [
    { text: "Inhale", duration: 4000, haptic: [20] },
    { text: "Hold", duration: 2000, haptic: null },
    { text: "Exhale", duration: 6000, haptic: [40, 60, 40] },
  ];

  let index = 0;
  breatheText.textContent = phases[0].text;
  haptic(phases[0].haptic);

  breatheInterval = setTimeout(runPhase, phases[0].duration);

  function runPhase() {
    index = (index + 1) % phases.length;
    const phase = phases[index];

    breatheText.textContent = phase.text;
    haptic(phase.haptic);

    breatheInterval = setTimeout(runPhase, phase.duration);
  }
}

function stopBreathing() {
  clearTimeout(breatheInterval);
  breatheScreen.style.display = "none";
  app.style.display = "flex";
}

/* Hook into Welcome */
document.querySelectorAll(".action-card").forEach((card) => {
  card.addEventListener("click", () => {
    if (card.dataset.action === "breathe") {
      startBreathing();
    }
  });
});

exitBreathe.addEventListener("click", stopBreathing);
/* ===============================
   GLOBAL BACK NAVIGATION
=============================== */
const backFromApp = document.getElementById("backFromApp");

function goToWelcome() {
  app.style.display = "none";
  breatheScreen.style.display = "none";
  welcome.style.display = "grid";

  app.classList.remove("writing");
  activeMood = null;

  moodButtons.forEach((btn) => btn.classList.remove("active"));
}

if (backFromApp) {
  backFromApp.addEventListener("click", goToWelcome);
}

exitBreathe.addEventListener("click", goToWelcome);
