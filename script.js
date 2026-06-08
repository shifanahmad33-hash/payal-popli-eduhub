const navToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");
const themeToggle = document.querySelector(".theme-toggle");

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  if (!themeToggle) return;
  const isDark = theme === "dark";
  themeToggle.textContent = isDark ? "☀" : "☾";
  themeToggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
}

const savedTheme = localStorage.getItem("payalTheme");
const preferredTheme = window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
applyTheme(savedTheme || preferredTheme);

if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    localStorage.setItem("payalTheme", nextTheme);
    applyTheme(nextTheme);
  });
}

const subjectColors = {
  Accountancy: "#e8dcff",
  Economics: "#dff8ef",
  "Business Studies": "#fff0c2",
  Maths: "#dbeafe",
  English: "#ffe4ed",
  Other: "#eceff5"
};

const customSubjectPalette = ["#e8dcff", "#dff8ef", "#fff0c2", "#dbeafe", "#ffe4ed", "#e0f2fe", "#fce7f3", "#dcfce7"];

function createId() {
  return window.crypto?.randomUUID?.() || `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getSubjectColor(subject) {
  if (subjectColors[subject]) return subjectColors[subject];
  const hash = [...subject].reduce((total, char) => total + char.charCodeAt(0), 0);
  return customSubjectPalette[hash % customSubjectPalette.length];
}

function getStored(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function setStored(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function initDoubts() {
  const form = document.querySelector("#doubtForm");
  const list = document.querySelector("#answerList");
  const search = document.querySelector("#doubtSearch");
  const count = document.querySelector("#doubtCount");
  if (!form || !list || !search || !count) return;

  let doubts = getStored("payalDoubts", [
    {
      id: createId(),
      subject: "Accountancy",
      question: "How do I identify debit and credit entries in journal questions?",
      answer: "Mock response: Start by identifying the account affected, classify it, then apply the golden rule. Your doubt has been submitted and will be answered shortly.",
      bookmarked: true,
      date: "Sample"
    }
  ]);

  function render() {
    const query = search.value.trim().toLowerCase();
    const filtered = doubts.filter((item) =>
      `${item.subject} ${item.question} ${item.answer}`.toLowerCase().includes(query)
    );
    count.textContent = `${doubts.filter((item) => item.bookmarked).length} saved`;
    list.innerHTML = filtered.length
      ? filtered.map((item) => `
        <article class="answer-card ${item.bookmarked ? "bookmarked" : ""}">
          <div class="answer-top">
            <div>
              <div class="answer-meta">${item.subject} • ${item.date}</div>
              <h3>${escapeHtml(item.question)}</h3>
            </div>
            <button class="bookmark-btn" data-id="${item.id}" type="button" aria-label="Bookmark doubt">${item.bookmarked ? "★" : "☆"}</button>
          </div>
          <p>${escapeHtml(item.answer)}</p>
        </article>
      `).join("")
      : `<p class="answer-meta">No doubts match your search yet.</p>`;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const subject = document.querySelector("#subject").value;
    const question = document.querySelector("#question").value.trim();
    if (!question) return;
    doubts.unshift({
      id: createId(),
      subject,
      question,
      answer: "Your doubt has been submitted and will be answered shortly. Payal Popli mam will add a detailed explanation soon.",
      bookmarked: false,
      date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" })
    });
    setStored("payalDoubts", doubts);
    form.reset();
    render();
  });

  list.addEventListener("click", (event) => {
    const button = event.target.closest(".bookmark-btn");
    if (!button) return;
    doubts = doubts.map((item) => item.id === button.dataset.id ? { ...item, bookmarked: !item.bookmarked } : item);
    setStored("payalDoubts", doubts);
    render();
  });

  search.addEventListener("input", render);
  render();
}

function initTimetable() {
  const table = document.querySelector("#timetable");
  const quote = document.querySelector("#dailyQuote");
  const addGoalBtn = document.querySelector("#addGoalBtn");
  const printBtn = document.querySelector("#printBtn");
  const goalList = document.querySelector("#goalList");
  if (!table || !quote || !addGoalBtn || !printBtn || !goalList) return;

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const slots = ["6-7 AM", "7-8 AM", "4-5 PM", "5-6 PM", "6-7 PM", "7-8 PM", "8-9 PM"];
  const quotes = [
    "Small steps every day create big scores.",
    "Revise once today so your future self breathes easier.",
    "Concept clarity is the best shortcut.",
    "A planned hour beats a worried evening.",
    "Keep showing up. Marks follow method.",
    "Practice turns confusion into confidence.",
    "Study with focus, rest without guilt."
  ];
  let schedule = getStored("payalTimetable", {});
  let goals = getStored("payalGoals", []);

  quote.textContent = quotes[new Date().getDay() % quotes.length];

  function renderTable() {
    const header = `<tr><th>Time</th>${days.map((day) => `<th>${day}</th>`).join("")}</tr>`;
    const rows = slots.map((slot) => `
      <tr>
        <td>${slot}</td>
        ${days.map((day) => {
          const key = `${day}-${slot}`;
          const value = schedule[key] || "";
          const color = value ? getSubjectColor(value) : subjectColors.Other;
          return `<td class="slot-cell" data-key="${key}" title="Click to add a subject or task">
            ${value ? `<span class="slot-subject" style="background:${color}">${escapeHtml(value)}</span>` : ""}
          </td>`;
        }).join("")}
      </tr>
    `).join("");
    table.innerHTML = header + rows;
  }

  function renderGoals() {
    goalList.innerHTML = goals.map((goal, index) => `
      <span class="goal-chip">${escapeHtml(goal)} <button type="button" data-goal="${index}" aria-label="Remove goal">×</button></span>
    `).join("");
  }

  table.addEventListener("click", (event) => {
    const cell = event.target.closest(".slot-cell");
    if (!cell) return;
    const current = schedule[cell.dataset.key] || "";
    const value = prompt("Add subject or task for this slot:", current);
    if (value === null) return;
    const cleanValue = value.trim();
    if (cleanValue) {
      schedule[cell.dataset.key] = cleanValue;
    } else {
      delete schedule[cell.dataset.key];
    }
    setStored("payalTimetable", schedule);
    renderTable();
  });

  addGoalBtn.addEventListener("click", () => {
    const goal = prompt("Set today's study goal:");
    if (!goal || !goal.trim()) return;
    goals.push(goal.trim());
    setStored("payalGoals", goals);
    renderGoals();
  });

  goalList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-goal]");
    if (!button) return;
    goals.splice(Number(button.dataset.goal), 1);
    setStored("payalGoals", goals);
    renderGoals();
  });

  printBtn.addEventListener("click", () => window.print());
  renderTable();
  renderGoals();
}

function initResources() {
  const grid = document.querySelector("#resourceGrid");
  const filters = document.querySelectorAll(".filter-btn");
  if (!grid || !filters.length) return;

  const resources = [
    ["Books", "Accountancy Practice Companion", "Chapter-wise solved illustrations and ledger practice for commerce students.", "Buy Now"],
    ["Books", "Economics Concept Map Book", "Compact notes for micro, macro, graphs, and quick pre-exam revision.", "Buy Now"],
    ["Online Courses", "Class 12 Commerce Booster", "Recorded lessons, topic tests, and guided revision checkpoints.", "Enroll Now"],
    ["Online Courses", "Maths Confidence Sprint", "A structured course for formulas, examples, and timed problem solving.", "Enroll Now"],
    ["Study Tools", "Digital Formula & Terms Deck", "Flashcards for definitions, formulas, and tricky concept checks.", "Buy Now"],
    ["Study Tools", "Weekly Study Planner Kit", "Printable trackers for goals, chapters, test dates, and revision cycles.", "Buy Now"],
    ["Mock Test Series", "Accountancy Final Mock Series", "Timed papers with marking-style answer review and improvement focus.", "Enroll Now"],
    ["Mock Test Series", "Commerce Full Syllabus Tests", "Mixed-subject practice tests for board-style exam readiness.", "Enroll Now"]
  ];

  function render(category = "All") {
    grid.innerHTML = resources
      .filter(([itemCategory]) => category === "All" || itemCategory === category)
      .map(([itemCategory, title, description, action]) => `
        <article class="resource-card" data-category="${itemCategory}">
          <span>${itemCategory}</span>
          <h3>${title}</h3>
          <p>${description}</p>
          <a class="btn secondary" href="#">${action}</a>
        </article>
      `).join("");
  }

  filters.forEach((button) => {
    button.addEventListener("click", () => {
      filters.forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      render(button.dataset.filter);
    });
  });

  render();
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  }[char]));
}

initDoubts();
initTimetable();
initResources();
