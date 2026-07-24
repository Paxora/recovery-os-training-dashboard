const STORAGE_KEY = "recovery-os-training-dashboard-v1";
const exerciseCards = [...document.querySelectorAll("[data-exercise]")];
const weightInputs = [...document.querySelectorAll("[data-weight]")];
const watchInputs = [...document.querySelectorAll("[data-watch]")];
const energy = document.querySelector("#energy");
const soreness = document.querySelector("#soreness");
const feedback = document.querySelector("#feedback");
const progressRing = document.querySelector("#progress-ring");
const progressPercent = document.querySelector("#progress-percent");
const progressCount = document.querySelector("#progress-count");
const resetButton = document.querySelector("#reset-training");

const emptyState = () => ({
  completed: {},
  weights: {},
  energy: "未记录",
  soreness: "未记录",
  feedback: "",
  watch: {},
});

let state = emptyState();

try {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) state = { ...state, ...JSON.parse(saved) };
} catch {
  state = emptyState();
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function render() {
  exerciseCards.forEach((card, index) => {
    const id = card.dataset.exercise;
    const done = Boolean(state.completed[id]);
    card.classList.toggle("is-done", done);
    const button = card.querySelector(".check-button");
    button.setAttribute("aria-pressed", String(done));
    button.textContent = done ? "✓" : String(index + 1).padStart(2, "0");
  });

  weightInputs.forEach((input) => {
    input.value = state.weights[input.dataset.weight] || "";
  });

  watchInputs.forEach((input) => {
    input.value = state.watch[input.dataset.watch] || "";
  });

  energy.value = state.energy;
  soreness.value = state.soreness;
  feedback.value = state.feedback;

  const complete = exerciseCards.filter(
    (card) => state.completed[card.dataset.exercise],
  ).length;
  const percent = Math.round((complete / exerciseCards.length) * 100);
  progressRing.style.setProperty("--progress", `${percent * 3.6}deg`);
  progressPercent.textContent = `${percent}%`;
  progressCount.textContent = `${complete} / ${exerciseCards.length}`;
}

exerciseCards.forEach((card) => {
  const button = card.querySelector(".check-button");
  button.addEventListener("click", () => {
    const id = card.dataset.exercise;
    state.completed[id] = !state.completed[id];
    save();
    render();
  });
});

weightInputs.forEach((input) => {
  input.addEventListener("input", () => {
    state.weights[input.dataset.weight] = input.value;
    save();
  });
});

watchInputs.forEach((input) => {
  input.addEventListener("input", () => {
    state.watch[input.dataset.watch] = input.value;
    save();
  });
});

energy.addEventListener("change", () => {
  state.energy = energy.value;
  save();
});

soreness.addEventListener("change", () => {
  state.soreness = soreness.value;
  save();
});

feedback.addEventListener("input", () => {
  state.feedback = feedback.value;
  save();
});

resetButton.addEventListener("click", () => {
  if (window.confirm("清空本次训练的完成状态、重量和反馈？")) {
    state = emptyState();
    save();
    render();
  }
});

render();
