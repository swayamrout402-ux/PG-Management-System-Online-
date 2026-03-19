// ================= CONFIG =================
const API_BASE = "http://localhost:5000/api";

let currentRole = "tenant"; // tenant | admin
let isRegisterMode = false;

// ================= ELEMENTS =================
const tenantBtn = document.getElementById("tenantBtn");
const adminBtn = document.getElementById("adminBtn");
const authForm = document.getElementById("authForm");
const toggleModeText = document.getElementById("toggleMode");
const messageEl = document.getElementById("message");

const nameInput = document.getElementById("name");
const phoneInput = document.getElementById("phone");
const dobInput = document.getElementById("dob");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

// ================= INITIAL STATE =================
nameInput.style.display = "none";
phoneInput.style.display = "none";
dobInput.style.display = "none";

// ================= ROLE TOGGLE =================
tenantBtn.addEventListener("click", () => {
  currentRole = "tenant";
  tenantBtn.classList.add("active");
  adminBtn.classList.remove("active");
  toggleModeText.style.display = "block"; // Tenant can register
  resetForm();
});

adminBtn.addEventListener("click", () => {
  currentRole = "admin";
  adminBtn.classList.add("active");
  tenantBtn.classList.remove("active");

  // ADMIN LOGIN ONLY
  isRegisterMode = false;
  toggleModeText.style.display = "none"; // No register option
  resetForm();
});

// ================= LOGIN / REGISTER TOGGLE =================
toggleModeText.addEventListener("click", () => {
  if (currentRole === "admin") return;

  isRegisterMode = !isRegisterMode;

  toggleModeText.innerText = isRegisterMode ? "Login" : "Register";
  authForm.querySelector("button").innerText = isRegisterMode ? "Register" : "Login";

  nameInput.style.display = isRegisterMode ? "block" : "none";
  phoneInput.style.display = isRegisterMode ? "block" : "none";
  dobInput.style.display = isRegisterMode ? "block" : "none";

  messageEl.innerText = "";
});

// ================= FORM SUBMIT =================
authForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  messageEl.innerText = "";
  messageEl.style.color = "red";

  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();
  const dob = dobInput.value; // YYYY-MM-DD
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    messageEl.innerText = "Email and password are required";
    return;
  }

  if (isRegisterMode && currentRole === "tenant") {
    if (!name) {
      messageEl.innerText = "Name is required";
      return;
    }
    if (!phone) {
      messageEl.innerText = "Phone is required";
      return;
    }
    if (!dob) {
      messageEl.innerText = "Date of Birth is required";
      return;
    }
    // Optional: Validate DOB format YYYY-MM-DD
    const dobRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dobRegex.test(dob)) {
      messageEl.innerText = "Invalid Date of Birth format";
      return;
    }
  }

  let endpoint = "";
  let payload = {};

  // ================= TENANT =================
  if (currentRole === "tenant") {
    endpoint = isRegisterMode ? "/auth/register" : "/auth/login";
    payload = isRegisterMode
      ? { name, phone, dob, email, password }
      : { email, password };
  }

  // ================= ADMIN =================
  if (currentRole === "admin") {
    endpoint = "/auth/admin/login"; // LOGIN ONLY
    payload = { email, password };
  }

  try {
    const res = await fetch(API_BASE + endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      messageEl.innerText = data.message || "Authentication failed";
      return;
    }

    // ================= TENANT REGISTER SUCCESS =================
    if (isRegisterMode && currentRole === "tenant") {
      messageEl.style.color = "green";
      messageEl.innerText = "Registration successful. Please login.";
      resetForm();
      return;
    }

    // ================= LOGIN SUCCESS =================
    localStorage.setItem("token", data.token);
    localStorage.setItem("role", currentRole);

    window.location.href = currentRole === "tenant" ? "tenant.html" : "admin.html";

  } catch (err) {
    messageEl.innerText = "Server error. Try again.";
    console.error(err);
  }
});

// ================= HELPERS =================
function resetForm() {
  isRegisterMode = false;
  authForm.reset();
  toggleModeText.innerText = "Register";
  authForm.querySelector("button").innerText = "Login";
  nameInput.style.display = "none";
  phoneInput.style.display = "none";
  dobInput.style.display = "none";
  messageEl.innerText = "";
  messageEl.style.color = "red";
}
