
"use strict";

// ======================================
// EXPENSE TRACKER — JAVASCRIPT
// ======================================

const STORAGE_KEY = "expenseTrackerExpenses";

const $ = id => document.getElementById(id);

const elements = {
  form: $("expenseForm"),
  name: $("expenseName"),
  amount: $("expenseAmount"),
  category: $("expenseCategory"),
  list: $("expenseList"),
  empty: $("emptyState"),
  total: $("totalAmount"),
  count: $("expenseCount"),
  search: $("searchInput"),
  filter: $("categoryFilter"),
  clear: $("clearAllBtn"),
  nameError: $("nameError"),
  amountError: $("amountError")
};

const categories = {
  "Їжа": {
    icon: "🍔",
    totalId: "foodTotal"
  },
  "Транспорт": {
    icon: "🚗",
    totalId: "transportTotal"
  },
  "Покупки": {
    icon: "🛍️",
    totalId: "shoppingTotal"
  },
  "Інше": {
    icon: "✨",
    totalId: "otherTotal"
  }
};

const moneyFormatter = new Intl.NumberFormat("uk-UA", {
  style: "currency",
  currency: "UAH"
});

const dateFormatter = new Intl.DateTimeFormat("uk-UA", {
  day: "2-digit",
  month: "short",
  year: "numeric"
});

const roundMoney = value =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const formatMoney = value =>
  moneyFormatter.format(value);

// ======================================
// LOCAL STORAGE
// ======================================

function loadExpenses() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    );

    if (!Array.isArray(saved)) return [];

    return saved.filter(item =>
      item &&
      typeof item.id === "string" &&
      typeof item.name === "string" &&
      item.name.trim().length > 0 &&
      typeof item.amount === "number" &&
      Number.isFinite(item.amount) &&
      item.amount > 0 &&
      Object.hasOwn(categories, item.category)
    );
  } catch (error) {
    console.error("Помилка читання даних:", error);
    return [];
  }
}

let expenses = loadExpenses();
let editingId = null;

function saveExpenses() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(expenses)
    );
    return true;
  } catch (error) {
    console.error("Помилка збереження:", error);
    showToast("Не вдалося зберегти дані", "error");
    return false;
  }
}

// ======================================
// СПОВІЩЕННЯ
// ======================================

const toast = document.createElement("div");
toast.className = "app-toast";
toast.setAttribute("role", "status");
toast.setAttribute("aria-live", "polite");
document.body.append(toast);

let toastTimer;

function showToast(message, type = "success") {
  clearTimeout(toastTimer);

  toast.textContent = message;
  toast.className = `app-toast ${type} show`;

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// ======================================
// ВАЛІДАЦІЯ
// ======================================

function setError(input, errorElement, message) {
  input.classList.toggle("invalid", Boolean(message));
  errorElement.textContent = message;

  if (message) {
    input.setAttribute("aria-invalid", "true");
  } else {
    input.removeAttribute("aria-invalid");
  }
}

function validateForm() {
  let valid = true;

  const name = elements.name.value.trim();
  const rawAmount = elements.amount.value.trim();
  const amount = Number(rawAmount);

  setError(elements.name, elements.nameError, "");
  setError(elements.amount, elements.amountError, "");

  if (!name) {
    setError(
      elements.name,
      elements.nameError,
      "Введіть назву витрати"
    );
    valid = false;
  }

  if (
    !rawAmount ||
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    setError(
      elements.amount,
      elements.amountError,
      "Введіть суму більшу за нуль"
    );
    valid = false;
  } else if (
    !Number.isSafeInteger(Math.round(amount * 100)) ||
    Math.abs(amount * 100 - Math.round(amount * 100)) > 0.000001
  ) {
    setError(
      elements.amount,
      elements.amountError,
      "Використовуйте не більше 2 знаків після коми"
    );
    valid = false;
  }

  if (!Object.hasOwn(categories, elements.category.value)) {
    showToast("Виберіть правильну категорію", "error");
    valid = false;
  }

  return valid;
}

elements.name.addEventListener("input", () => {
  setError(elements.name, elements.nameError, "");
});

elements.amount.addEventListener("input", () => {
  setError(elements.amount, elements.amountError, "");
});

// ======================================
// ДОДАВАННЯ ТА РЕДАГУВАННЯ
// ======================================

const submitButton = elements.form.querySelector(
  'button[type="submit"]'
);

function resetForm() {
  editingId = null;
  elements.form.reset();
  submitButton.textContent = "+ Додати витрату";

  setError(elements.name, elements.nameError, "");
  setError(elements.amount, elements.amountError, "");
}

elements.form.addEventListener("submit", event => {
  event.preventDefault();

  if (!validateForm()) return;

  const name = elements.name.value.trim();
  const amount = roundMoney(Number(elements.amount.value));
  const category = elements.category.value;

  if (editingId) {
    const index = expenses.findIndex(
      item => item.id === editingId
    );

    if (index === -1) {
      resetForm();
      showToast("Витрату не знайдено", "error");
      return;
    }

    const updated = expenses.map(item =>
      item.id === editingId
        ? { ...item, name, amount, category }
        : item
    );

    const previous = expenses;
    expenses = updated;

    if (!saveExpenses()) {
      expenses = previous;
      return;
    }

    showToast("Витрату оновлено");
  } else {
    const expense = {
      id: crypto.randomUUID(),
      name,
      amount,
      category,
      date: new Date().toISOString()
    };

    const previous = expenses;
    expenses = [expense, ...expenses];

    if (!saveExpenses()) {
      expenses = previous;
      return;
    }

    showToast("Витрату успішно додано");
  }

  resetForm();
  renderExpenses();
  elements.name.focus();
});

function editExpense(id) {
  const expense = expenses.find(item => item.id === id);
  if (!expense) return;

  editingId = id;

  elements.name.value = expense.name;
  elements.amount.value = expense.amount;
  elements.category.value = expense.category;

  submitButton.textContent = "💾 Зберегти зміни";

  elements.form.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });

  elements.name.focus();
}

function deleteExpense(id) {
  const previous = expenses;

  expenses = expenses.filter(item => item.id !== id);

  if (!saveExpenses()) {
    expenses = previous;
    return;
  }

  if (editingId === id) resetForm();

  renderExpenses();
  showToast("Витрату видалено");
}

// ======================================
// СОРТУВАННЯ
// ======================================

const toolbar = document.querySelector(".toolbar");

const sortBox = document.createElement("div");
sortBox.className = "filter-box";

const sortLabel = document.createElement("label");
sortLabel.htmlFor = "sortExpenses";
sortLabel.textContent = "Сортування";

const sortSelect = document.createElement("select");
sortSelect.id = "sortExpenses";

const sortOptions = [
  ["newest", "Спочатку нові"],
  ["oldest", "Спочатку старі"],
  ["high", "Найдорожчі"],
  ["low", "Найдешевші"],
  ["name", "За назвою"]
];

sortOptions.forEach(([value, label]) => {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  sortSelect.append(option);
});

sortBox.append(sortLabel, sortSelect);
toolbar.append(sortBox);

sortSelect.addEventListener("change", renderExpenses);

// ======================================
// СТАТИСТИКА
// ======================================

function updateStatistics() {
  const totalCents = expenses.reduce(
    (sum, item) => sum + Math.round(item.amount * 100),
    0
  );

  const total = totalCents / 100;

  elements.total.textContent = formatMoney(total);
  elements.count.textContent = expenses.length;

  Object.entries(categories).forEach(([name, config]) => {
    const categoryCents = expenses
      .filter(item => item.category === name)
      .reduce(
        (sum, item) => sum + Math.round(item.amount * 100),
        0
      );

    const categoryTotal = categoryCents / 100;

    const target = $(config.totalId);
    target.textContent = formatMoney(categoryTotal);

    // Відсоток від загальних витрат
    const percent = totalCents > 0
      ? Math.round(categoryCents / totalCents * 100)
      : 0;

    target.title = `${percent}% від усіх витрат`;
  });
}

// ======================================
// КАРТКА ВИТРАТИ
// ======================================

function createExpenseCard(expense) {
  const card = document.createElement("article");
  card.className = "expense-item";

  const info = document.createElement("div");
  info.className = "expense-info";

  const title = document.createElement("h3");
  title.textContent = expense.name;

  const details = document.createElement("p");

  const date = expense.date
    ? new Date(expense.date)
    : null;

  const dateText = date && !Number.isNaN(date.getTime())
    ? dateFormatter.format(date)
    : "Дата невідома";

  details.textContent =
    `${categories[expense.category].icon} ` +
    `${expense.category} • ${dateText}`;

  info.append(title, details);

  const actions = document.createElement("div");
  actions.className = "expense-actions";

  const amount = document.createElement("span");
  amount.className = "expense-amount";
  amount.textContent = formatMoney(expense.amount);

  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.className = "delete-btn edit-btn";
  editButton.textContent = "✏️";
  editButton.title = "Редагувати";
  editButton.setAttribute(
    "aria-label",
    `Редагувати витрату ${expense.name}`
  );

  editButton.addEventListener("click", () => {
    editExpense(expense.id);
  });

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "delete-btn";
  deleteButton.textContent = "🗑️";
  deleteButton.title = "Видалити";
  deleteButton.setAttribute(
    "aria-label",
    `Видалити витрату ${expense.name}`
  );

  deleteButton.addEventListener("click", () => {
    deleteExpense(expense.id);
  });

  actions.append(amount, editButton, deleteButton);
  card.append(info, actions);

  return card;
}

// ======================================
// ФІЛЬТРАЦІЯ ТА ПОШУК
// ======================================

function getFilteredExpenses() {
  const search = elements.search.value
    .trim()
    .toLocaleLowerCase("uk-UA");

  const category = elements.filter.value;

  const filtered = expenses.filter(item => {
    const matchesSearch = item.name
      .toLocaleLowerCase("uk-UA")
      .includes(search);

    const matchesCategory =
      category === "all" ||
      item.category === category;

    return matchesSearch && matchesCategory;
  });

  switch (sortSelect.value) {
    case "oldest":
      filtered.sort((a, b) =>
        Date.parse(a.date || 0) - Date.parse(b.date || 0)
      );
      break;

    case "high":
      filtered.sort((a, b) => b.amount - a.amount);
      break;

    case "low":
      filtered.sort((a, b) => a.amount - b.amount);
      break;

    case "name":
      filtered.sort((a, b) =>
        a.name.localeCompare(b.name, "uk")
      );
      break;

    default:
      filtered.sort((a, b) =>
        Date.parse(b.date || 0) - Date.parse(a.date || 0)
      );
  }

  return filtered;
}

// ======================================
// ОНОВЛЕННЯ ІНТЕРФЕЙСУ
// ======================================

function renderExpenses() {
  const filtered = getFilteredExpenses();

  elements.list.replaceChildren();

  const fragment = document.createDocumentFragment();

  filtered.forEach(expense => {
    fragment.append(createExpenseCard(expense));
  });

  elements.list.append(fragment);

  const isEmpty = filtered.length === 0;
  elements.empty.hidden = !isEmpty;

  if (isEmpty) {
    const heading = elements.empty.querySelector("h3");
    const description = elements.empty.querySelector("p");

    if (expenses.length === 0) {
      heading.textContent = "Поки що витрат немає";
      description.textContent = "Додай свою першу витрату!";
    } else {
      heading.textContent = "Нічого не знайдено";
      description.textContent =
        "Спробуй змінити пошук або категорію.";
    }
  }

  elements.clear.disabled = expenses.length === 0;

  updateStatistics();
}

// ======================================
// ПОДІЇ
// ======================================

elements.search.addEventListener(
  "input",
  renderExpenses
);

elements.filter.addEventListener(
  "change",
  renderExpenses
);

// Очищення всіх витрат
elements.clear.addEventListener("click", () => {
  if (expenses.length === 0) return;

  const confirmed = confirm(
    `Видалити всі витрати (${expenses.length})? ` +
    "Цю дію неможливо скасувати."
  );

  if (!confirmed) return;

  const previous = expenses;
  expenses = [];

  if (!saveExpenses()) {
    expenses = previous;
    return;
  }

  resetForm();
  renderExpenses();
  showToast("Усі витрати очищено");
});

// ======================================
// ЗАПУСК
// ======================================

renderExpenses();
