const CONFIG = window.RECOVERY_OS_CONFIG || {};
const API_BASE = String(CONFIG.apiBase || "").replace(/\/$/, "");
const DRAFT_KEY = "recovery-os-training-dashboard-v4-draft";
const LEGACY_DRAFT_KEY = "recovery-os-training-dashboard-v3-draft";
const SESSION_KEY = "recovery-os-training-dashboard-github-session";
const LOGIN_KEY = "recovery-os-training-dashboard-github-login";

const exercises = [
  {
    id: "warmup",
    order: "01",
    name: "跑步机快走",
    english: "Treadmill",
    prescription: "8–10 分钟",
    rest: "—",
    cue: "身体微热即可，不需要跑。",
    metrics: [
      { key: "duration", label: "实际时长", unit: "分钟" },
      { key: "distance", label: "实际距离", unit: "km" },
    ],
  },
  {
    id: "row",
    order: "02",
    name: "坐姿器械划船",
    english: "Seated Row",
    prescription: "2–3 × 10–12",
    rest: "90 秒",
    cue: "胸口打开，肘向后拉，不耸肩。",
    setCount: 3,
    isNew: true,
    video: "https://www.bilibili.com/video/BV1m2421L7tw/",
  },
  {
    id: "shoulder",
    order: "03",
    name: "坐姿推肩机",
    english: "Shoulder Press",
    prescription: "2 × 10–12",
    rest: "90 秒",
    cue: "背贴靠垫，不塌腰，手肘不锁死。",
    setCount: 2,
    isNew: true,
    video: "https://www.bilibili.com/video/BV1r341127uy/",
  },
  {
    id: "pulldown",
    order: "04",
    name: "高位下拉",
    english: "Lat Pulldown",
    prescription: "2 × 10–12",
    rest: "90 秒",
    cue: "拉到上胸，身体不要大幅后仰。",
    setCount: 2,
  },
  {
    id: "chest",
    order: "05",
    name: "坐姿推胸",
    english: "Chest Press",
    prescription: "2 × 10–12",
    rest: "90 秒",
    cue: "肩膀向后下沉，回程保持控制。",
    setCount: 2,
  },
  {
    id: "legpress",
    order: "06",
    name: "腿举",
    english: "Leg Press",
    prescription: "2 × 10–12",
    rest: "90 秒",
    cue: "仅在腿部无明显酸痛时做；膝盖与脚尖同向。",
    setCount: 2,
    optional: true,
  },
  {
    id: "cooldown",
    order: "07",
    name: "跑步机放松",
    english: "Cool-down Walk",
    prescription: "8–10 分钟",
    rest: "—",
    cue: "轻松走路，让呼吸逐渐恢复。",
    metrics: [
      { key: "duration", label: "实际时长", unit: "分钟" },
      { key: "distance", label: "实际距离", unit: "km" },
    ],
  },
];

const authShell = document.querySelector("#auth-shell");
const appShell = document.querySelector("#app-shell");
const authTitle = document.querySelector("#auth-title");
const authCopy = document.querySelector("#auth-copy");
const authStatus = document.querySelector("#auth-status");
const loginButton = document.querySelector("#github-login");
const signedInLabel = document.querySelector("#signed-in-label");
const exerciseList = document.querySelector("#exercise-list");
const progressCount = document.querySelector("#progress-count");
const progressBar = document.querySelector("#progress-bar");
const historyList = document.querySelector("#history-list");
const historyStatus = document.querySelector("#history-status");
const historyCount = document.querySelector("#history-count");
const saveStatus = document.querySelector("#save-status");

function emptyState() {
  return {
    completed: {},
    sets: Object.fromEntries(
      exercises
        .filter((exercise) => exercise.setCount)
        .map((exercise) => [
          exercise.id,
          Array.from({ length: exercise.setCount }, () => ({ weight: "", reps: "" })),
        ]),
    ),
    metrics: Object.fromEntries(
      exercises
        .filter((exercise) => exercise.metrics)
        .map((exercise) => [
          exercise.id,
          Object.fromEntries(exercise.metrics.map((metric) => [metric.key, ""])),
        ]),
    ),
  };
}

let state = emptyState();
let sessions = [];
let sessionToken = localStorage.getItem(SESSION_KEY) || "";
let githubLogin = localStorage.getItem(LOGIN_KEY) || "";

try {
  const saved = localStorage.getItem(DRAFT_KEY);
  const legacy = localStorage.getItem(LEGACY_DRAFT_KEY);
  if (saved) {
    state = { ...state, ...JSON.parse(saved) };
  } else if (legacy) {
    const old = JSON.parse(legacy);
    state = {
      ...state,
      completed: old.completed || state.completed,
      sets: old.sets || state.sets,
      metrics: old.metrics || state.metrics,
    };
    saveDraft();
  }
  localStorage.removeItem(LEGACY_DRAFT_KEY);
} catch {
  state = emptyState();
}

function consumeLoginFragment() {
  if (!location.hash.startsWith("#session=")) return;
  const params = new URLSearchParams(location.hash.slice(1));
  const token = params.get("session") || "";
  const login = params.get("login") || "";
  if (token) {
    sessionToken = token;
    githubLogin = login;
    localStorage.setItem(SESSION_KEY, token);
    localStorage.setItem(LOGIN_KEY, login);
  }
  history.replaceState(null, "", `${location.pathname}${location.search}`);
}

function saveDraft() {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(state));
}

function setView(name) {
  document.querySelectorAll("[data-view]").forEach((view) => {
    view.hidden = view.dataset.view !== name;
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showAuth(title, copy, status = "") {
  authTitle.textContent = title;
  authCopy.textContent = copy;
  authStatus.textContent = status;
  authShell.hidden = false;
  appShell.hidden = true;
}

function showApp() {
  authShell.hidden = true;
  appShell.hidden = false;
  signedInLabel.textContent = githubLogin ? `已登录 · @${githubLogin}` : "已登录";
  renderExercises();
}

async function api(path, options = {}) {
  if (!API_BASE) throw new Error("云端保存服务尚未发布。");
  const headers = new Headers(options.headers || {});
  if (sessionToken) headers.set("Authorization", `Bearer ${sessionToken}`);
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (response.status === 401 || response.status === 403) {
    sessionToken = "";
    localStorage.removeItem(SESSION_KEY);
    throw new Error("登录已失效，请重新使用 GitHub 登录。");
  }
  return response;
}

function exerciseTemplate(exercise) {
  const badges = [
    exercise.isNew ? '<span class="badge">新动作</span>' : "",
    exercise.optional ? '<span class="badge neutral">视酸痛决定</span>' : "",
  ].join("");
  const video = exercise.video
    ? `<a href="${exercise.video}" target="_blank" rel="noreferrer">中文教学视频 ↗</a>`
    : "";
  const sets = exercise.setCount
    ? `<div class="set-table">
        <div class="set-head"><span></span><span>重量</span><span>次数</span></div>
        ${state.sets[exercise.id]
          .map(
            (set, index) => `<div class="set-row">
              <strong>第 ${index + 1} 组</strong>
              <label>
                <input data-set="${exercise.id}" data-index="${index}" data-key="weight"
                  value="${escapeAttribute(set.weight)}" inputmode="decimal" placeholder="—"
                  aria-label="${exercise.name}第${index + 1}组重量" />
                <small>kg</small>
              </label>
              <input data-set="${exercise.id}" data-index="${index}" data-key="reps"
                value="${escapeAttribute(set.reps)}" inputmode="numeric" placeholder="—"
                aria-label="${exercise.name}第${index + 1}组次数" />
            </div>`,
          )
          .join("")}
      </div>`
    : "";
  const metrics = exercise.metrics
    ? `<div class="metric-entry-grid">
        ${exercise.metrics
          .map(
            (metric) => `<label>
              <span>${metric.label}</span>
              <div>
                <input data-metric="${exercise.id}" data-key="${metric.key}"
                  value="${escapeAttribute(state.metrics[exercise.id]?.[metric.key] || "")}"
                  inputmode="decimal" placeholder="—" />
                <small>${metric.unit}</small>
              </div>
            </label>`,
          )
          .join("")}
      </div>`
    : "";
  const done = Boolean(state.completed[exercise.id]);
  return `<article class="exercise-card ${done ? "is-done" : ""}">
    <button type="button" class="order-button" data-complete="${exercise.id}"
      aria-pressed="${done}" aria-label="${done ? "取消完成" : "标记完成"} ${exercise.name}">
      ${done ? "✓ 已完成" : exercise.order}
    </button>
    <div class="exercise-title">
      <div>
        <div class="badges">${badges}</div>
        <h2>${exercise.name}</h2>
        <p>${exercise.english}</p>
      </div>
      ${video}
    </div>
    <div class="prescription-grid">
      <div><span>训练量</span><strong>${exercise.prescription}</strong></div>
      <div><span>组间休息</span><strong>${exercise.rest}</strong></div>
    </div>
    ${sets}
    ${metrics}
    <p class="cue">${exercise.cue}</p>
  </article>`;
}

function escapeAttribute(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderExercises() {
  exerciseList.innerHTML = exercises.map(exerciseTemplate).join("");
  const completed = exercises.filter((exercise) => state.completed[exercise.id]).length;
  progressCount.textContent = `${completed} / ${exercises.length}`;
  progressBar.style.width = `${Math.round((completed / exercises.length) * 100)}%`;

  document.querySelectorAll("[data-complete]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.complete;
      state.completed[id] = !state.completed[id];
      saveDraft();
      renderExercises();
    });
  });
  document.querySelectorAll("[data-set]").forEach((input) => {
    input.addEventListener("input", () => {
      state.sets[input.dataset.set][Number(input.dataset.index)][input.dataset.key] = input.value;
      saveDraft();
    });
  });
  document.querySelectorAll("[data-metric]").forEach((input) => {
    input.addEventListener("input", () => {
      state.metrics[input.dataset.metric][input.dataset.key] = input.value;
      saveDraft();
    });
  });
}

function displayDate(value) {
  const parts = String(value).split("-");
  return parts.length === 3 ? `${Number(parts[1])}月${Number(parts[2])}日` : value;
}

function setSummary(set) {
  return [set.weight ? `${set.weight} kg` : "", set.reps ? `${set.reps} 次` : ""]
    .filter(Boolean)
    .join(" × ");
}

function metricSummary(metrics = {}) {
  const units = { duration: "分钟", distance: "km" };
  return Object.entries(metrics)
    .filter(([, value]) => value)
    .map(([key, value]) => `${value} ${units[key] || ""}`.trim())
    .join(" · ");
}

function renderHistory() {
  historyCount.textContent = `${sessions.length} 次`;
  historyStatus.hidden = sessions.length > 0;
  historyStatus.textContent = sessions.length ? "" : "完成训练并保存后，记录会显示在这里。";
  historyList.innerHTML = sessions
    .map((session, sessionIndex) => {
      const percentage = session.totalCount
        ? Math.round((session.completedCount / session.totalCount) * 100)
        : 0;
      return `<article class="history-card">
        <button type="button" class="history-toggle" data-history="${sessionIndex}" aria-expanded="false">
          <div><h2>${displayDate(session.sessionDate)}</h2><span>${escapeAttribute(session.sessionLabel)}</span></div>
          <div class="history-result"><strong>${percentage}% 完成</strong><span>⌄</span></div>
        </button>
        <div class="history-detail" data-history-detail="${sessionIndex}" hidden>
          ${(session.exercises || [])
            .map((exercise) => {
              const recordedSets = (exercise.sets || []).filter((set) => set.weight || set.reps);
              const summary = recordedSets.length
                ? recordedSets.map(setSummary).join(" · ")
                : metricSummary(exercise.metrics) || exercise.prescription || "未记录";
              return `<div class="history-exercise">
                <span>${escapeAttribute(exercise.name)}</span>
                <strong>${escapeAttribute(summary)}</strong>
              </div>`;
            })
            .join("")}
        </div>
      </article>`;
    })
    .join("");

  document.querySelectorAll("[data-history]").forEach((button) => {
    button.addEventListener("click", () => {
      const detail = document.querySelector(`[data-history-detail="${button.dataset.history}"]`);
      const expanded = !detail.hidden;
      detail.hidden = expanded;
      button.setAttribute("aria-expanded", String(!expanded));
      button.querySelector(".history-result span").textContent = expanded ? "⌄" : "⌃";
    });
  });
}

async function loadHistory() {
  historyStatus.hidden = false;
  historyStatus.textContent = "正在读取训练历史…";
  historyList.innerHTML = "";
  try {
    const response = await api("/api/training-sessions", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "训练历史读取失败。");
    sessions = data.sessions || [];
    renderHistory();
  } catch (error) {
    historyStatus.hidden = false;
    historyStatus.textContent = error instanceof Error ? error.message : "训练历史读取失败。";
    historyStatus.classList.add("error");
  }
}

function localDateString() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function saveSession() {
  const button = document.querySelector("#save-session");
  button.disabled = true;
  button.textContent = "正在保存…";
  saveStatus.textContent = "";
  try {
    const response = await api("/api/training-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionDate: localDateString(),
        sessionLabel: "第 2 次入馆",
        exercises: exercises.map((exercise) => ({
          id: exercise.id,
          name: exercise.name,
          english: exercise.english,
          prescription: exercise.prescription,
          rest: exercise.rest,
          completed: Boolean(state.completed[exercise.id]),
          sets: state.sets[exercise.id] || [],
          metrics: state.metrics[exercise.id] || {},
        })),
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "训练记录保存失败。");
    state = emptyState();
    saveDraft();
    saveStatus.textContent = "训练记录已保存。";
    await loadHistory();
    setView("history");
  } catch (error) {
    saveStatus.textContent = error instanceof Error ? error.message : "训练记录保存失败。";
  } finally {
    button.disabled = false;
    button.textContent = "结束并保存";
  }
}

async function initializeAuth() {
  consumeLoginFragment();
  if (!API_BASE) {
    showAuth("云端服务尚未发布", "GitHub 登录和历史记录服务正在配置中。");
    loginButton.removeAttribute("href");
    loginButton.setAttribute("aria-disabled", "true");
    return;
  }
  if (!sessionToken) {
    showAuth("登录训练 Dashboard", "使用你的 GitHub 账号登录。训练记录会按账号隔离并保存到云端历史。");
    return;
  }
  showAuth("正在检查登录状态", "请稍候。");
  try {
    const response = await api("/api/me", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "登录验证失败。");
    githubLogin = data.user?.login || githubLogin;
    localStorage.setItem(LOGIN_KEY, githubLogin);
    showApp();
    await loadHistory();
  } catch (error) {
    showAuth(
      "登录已失效",
      "请重新使用获准访问的 GitHub 账号登录。",
      error instanceof Error ? error.message : "",
    );
  }
}

document.querySelector("#open-history").addEventListener("click", async () => {
  setView("history");
  await loadHistory();
});
document.querySelector("#reset-training").addEventListener("click", () => {
  if (!window.confirm("清空本次训练的完成状态和动作记录？")) return;
  state = emptyState();
  saveDraft();
  renderExercises();
});
document.querySelectorAll("[data-open-view]").forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.openView));
});

document.querySelector("#save-session").addEventListener("click", saveSession);
document.querySelector("#sign-out").addEventListener("click", () => {
  sessionToken = "";
  githubLogin = "";
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(LOGIN_KEY);
  showAuth("登录训练 Dashboard", "使用你的 GitHub 账号登录。训练记录会按账号隔离并保存到云端历史。");
});

void initializeAuth();
