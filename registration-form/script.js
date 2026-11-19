
const form = document.getElementById("registrationForm");

const username = document.getElementById("username");
const email = document.getElementById("email");
const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirmPassword");
const terms = document.getElementById("terms");

const formMessage = document.getElementById("formMessage");
const progressFill = document.getElementById("progressFill");
const progressText = document.getElementById("progressText");
const formProgress = document.getElementById("formProgress");

const strengthFill = document.getElementById("strengthFill");
const strengthText = document.getElementById("strengthText");
const usernameCounter = document.getElementById("usernameCounter");

const fields = [username, email, password, confirmPassword];

// Повідомлення про помилки
function showError(input, message) {
  const error = document.getElementById(input.id + "Error");

  error.textContent = message;
  input.classList.add("invalid");
  input.classList.remove("valid");
  input.setAttribute("aria-invalid", "true");
}

function showValid(input) {
  const error = document.getElementById(input.id + "Error");

  error.textContent = "";
  input.classList.remove("invalid");
  input.classList.add("valid");
  input.setAttribute("aria-invalid", "false");
}

function clearFieldState(input) {
  const error = document.getElementById(input.id + "Error");

  error.textContent = "";
  input.classList.remove("invalid", "valid");
  input.removeAttribute("aria-invalid");
}

// Перевірка імені
function validateUsername() {
  const value = username.value.trim();

  if (value.length < 3) {
    showError(username, "Ім'я повинно містити мінімум 3 символи.");
    return false;
  }

  showValid(username);
  return true;
}

// Перевірка email
function validateEmail() {
  const value = email.value.trim();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(value)) {
    showError(email, "Введіть правильну email-адресу.");
    return false;
  }

  showValid(email);
  return true;
}

// Перевірка пароля
function validatePassword() {
  if (password.value.length < 8) {
    showError(password, "Пароль повинен містити мінімум 8 символів.");
    return false;
  }

  showValid(password);
  return true;
}

// Підтвердження пароля
function validateConfirmPassword() {
  if (!confirmPassword.value) {
    showError(confirmPassword, "Підтвердіть пароль.");
    return false;
  }

  if (confirmPassword.value !== password.value) {
    showError(confirmPassword, "Паролі не збігаються.");
    return false;
  }

  showValid(confirmPassword);
  return true;
}

// Перевірка умов
function validateTerms() {
  const error = document.getElementById("termsError");

  if (!terms.checked) {
    error.textContent = "Потрібно погодитися з умовами.";
    terms.setAttribute("aria-invalid", "true");
    return false;
  }

  error.textContent = "";
  terms.setAttribute("aria-invalid", "false");
  return true;
}

// Правила та надійність пароля
function updatePasswordStrength() {
  const value = password.value;

  const rules = [
    {
      id: "ruleLength",
      passed: value.length >= 8
    },
    {
      id: "ruleUppercase",
      passed: /[A-ZА-ЯІЇЄҐ]/.test(value)
    },
    {
      id: "ruleNumber",
      passed: /\d/.test(value)
    },
    {
      id: "ruleSpecial",
      passed: /[^A-Za-zА-Яа-яІіЇїЄєҐґ0-9]/.test(value)
    }
  ];

  let score = 0;

  rules.forEach(rule => {
    const element = document.getElementById(rule.id);
    const icon = element.querySelector(".rule-icon");

    element.classList.toggle("completed", rule.passed);
    icon.textContent = rule.passed ? "✓" : "○";

    if (rule.passed) score++;
  });

  strengthFill.className = "";

  if (!value) {
    strengthFill.style.width = "0%";
    strengthText.textContent = "Не введено";
    return;
  }

  strengthFill.style.width = `${score * 25}%`;

  if (score <= 1) {
    strengthFill.classList.add("weak");
    strengthText.textContent = "Слабкий";
  } else if (score <= 3) {
    strengthFill.classList.add("medium");
    strengthText.textContent = "Середній";
  } else {
    strengthFill.classList.add("strong");
    strengthText.textContent = "Сильний";
  }
}

// Прогрес заповнення форми
function updateProgress() {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const checks = [
    username.value.trim().length >= 3,
    emailPattern.test(email.value.trim()),
    password.value.length >= 8,
    confirmPassword.value.length > 0 &&
      confirmPassword.value === password.value,
    terms.checked
  ];

  const completed = checks.filter(Boolean).length;
  const percent = Math.round((completed / checks.length) * 100);

  progressFill.style.width = `${percent}%`;
  progressText.textContent = `${percent}%`;
  formProgress.setAttribute("aria-valuenow", percent);
}

// Лічильник символів
function updateUsernameCounter() {
  usernameCounter.textContent = `${username.value.length}/30`;
}

// Показати або приховати пароль
document.querySelectorAll(".toggle-password").forEach(button => {
  button.addEventListener("click", () => {
    const target = document.getElementById(button.dataset.target);
    const isHidden = target.type === "password";

    target.type = isHidden ? "text" : "password";
    button.textContent = isHidden ? "🙈" : "👁";
    button.setAttribute(
      "aria-label",
      isHidden ? "Приховати пароль" : "Показати пароль"
    );
    button.setAttribute("aria-pressed", String(isHidden));
  });
});

// Перевірки під час введення
username.addEventListener("input", () => {
  updateUsernameCounter();

  if (username.value) validateUsername();
  else clearFieldState(username);

  updateProgress();
});

email.addEventListener("input", () => {
  if (email.value) validateEmail();
  else clearFieldState(email);

  updateProgress();
});

password.addEventListener("input", () => {
  updatePasswordStrength();

  if (password.value) validatePassword();
  else clearFieldState(password);

  if (confirmPassword.value) {
    validateConfirmPassword();
  }

  updateProgress();
});

confirmPassword.addEventListener("input", () => {
  if (confirmPassword.value) validateConfirmPassword();
  else clearFieldState(confirmPassword);

  updateProgress();
});

terms.addEventListener("change", () => {
  validateTerms();
  updateProgress();
});

// Відправлення форми
form.addEventListener("submit", event => {
  event.preventDefault();

  const results = [
    validateUsername(),
    validateEmail(),
    validatePassword(),
    validateConfirmPassword(),
    validateTerms()
  ];

  const isValid = results.every(Boolean);

  formMessage.className = "form-message";

  if (!isValid) {
    formMessage.textContent =
      "Будь ласка, виправте помилки у формі.";
    formMessage.classList.add("error-message");

    const firstInvalid = form.querySelector(
      'input[aria-invalid="true"]'
    );

    if (firstInvalid) firstInvalid.focus();
    return;
  }

  formMessage.textContent =
    `🎉 Вітаємо, ${username.value.trim()}! ` +
    "Демонстраційну реєстрацію успішно завершено.";

  formMessage.classList.add("success");

  // Дані не надсилаються на сервер і не зберігаються.
});

// Очищення форми
form.addEventListener("reset", () => {
  // Стан полів скидаємо після стандартного reset.
  queueMicrotask(() => {
    fields.forEach(clearFieldState);

    const termsError = document.getElementById("termsError");
    termsError.textContent = "";
    terms.removeAttribute("aria-invalid");

    document.querySelectorAll(".toggle-password").forEach(button => {
      const target = document.getElementById(button.dataset.target);
      target.type = "password";
      button.textContent = "👁";
      button.setAttribute("aria-label", "Показати пароль");
      button.setAttribute("aria-pressed", "false");
    });

    formMessage.textContent = "";
    formMessage.className = "form-message";

    updateUsernameCounter();
    updatePasswordStrength();
    updateProgress();
  });
});

// Початковий стан
updateUsernameCounter();
updatePasswordStrength();
updateProgress();
