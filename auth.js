// ================= CONFIG =================
// Ensure there is NO trailing slash at the end of the URL
const API_BASE = "https://pg-management-backend-6fcn.onrender.com/api";

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
const dobLabel = document.getElementById("dobLabel"); // ✅ ADDED
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

// ================= INITIAL STATE =================
if (nameInput) nameInput.style.display = "none";
if (phoneInput) phoneInput.style.display = "none";
if (dobInput) dobInput.style.display = "none";
if (dobLabel) dobLabel.style.display = "none"; // ✅ ADDED
// ================= DOB MAX DATE (13+ restriction) =================
const today = new Date();
const minAgeDate = new Date(
  today.getFullYear() - 13,
  today.getMonth(),
  today.getDate()
);

const formattedDate = minAgeDate.toISOString().split("T")[0];
if (dobInput) dobInput.setAttribute("max", formattedDate);

// ================= ROLE TOGGLE =================
tenantBtn.addEventListener("click", () => {
  currentRole = "tenant";
  tenantBtn.classList.add("active");
  adminBtn.classList.remove("active");
  toggleModeText.style.display = "block"; 
  resetForm();
});

adminBtn.addEventListener("click", () => {
  currentRole = "admin";
  adminBtn.classList.add("active");
  tenantBtn.classList.remove("active");
  isRegisterMode = false;
  toggleModeText.style.display = "none"; 
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
  if (dobLabel) dobLabel.style.display = isRegisterMode ? "block" : "none"; // ✅ ADDED

  messageEl.innerText = "";
});

// ================= FORM SUBMIT =================
authForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  messageEl.innerText = "Processing...";
  messageEl.style.color = "blue";

  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();
  const dob = dobInput.value; 
  // 🔥 AGE VALIDATION (13+)
if (isRegisterMode && currentRole === "tenant") {
  if (!dob) {
    messageEl.style.color = "red";
    messageEl.innerText = "Date of Birth is required";
    return;
  }

  const birthDate = new Date(dob);
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  const actualAge =
    monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ? age - 1
      : age;

  if (actualAge < 13) {
    messageEl.style.color = "red";
    messageEl.innerText = "You must be at least 13 years old";
    return;
  }
}
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    messageEl.style.color = "red";
    messageEl.innerText = "Email and password are required";
    return;
  }

  let endpoint = "";
  let payload = {};

  if (currentRole === "tenant") {
    endpoint = isRegisterMode ? "/auth/register" : "/auth/login";
    payload = isRegisterMode
      ? { name, phone, dob, email, password }
      : { email, password };
  } else {
    endpoint = "/auth/admin/login";
    payload = { email, password };
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      messageEl.style.color = "red";
      messageEl.innerText = data.message || "Authentication failed";
      return;
    }

    if (isRegisterMode && currentRole === "tenant") {
      messageEl.style.color = "green";
      messageEl.innerText = "Registration successful. Please login.";
      resetForm();
      return;
    }

    // SUCCESSFUL LOGIN
    localStorage.setItem("token", data.token);
    localStorage.setItem("role", currentRole);
    window.location.href = currentRole === "tenant" ? "tenant.html" : "admin.html";

  } catch (err) {
    messageEl.style.color = "red";
    messageEl.innerText = "Connection error. Check if backend is awake.";
    console.error("Fetch Error:", err);
  }
});

// ================= RESET =================
function resetForm() {
  isRegisterMode = false;
  authForm.reset();
  toggleModeText.innerText = "Register";
  authForm.querySelector("button").innerText = "Login";
  nameInput.style.display = "none";
  phoneInput.style.display = "none";
  dobInput.style.display = "none";
  if (dobLabel) dobLabel.style.display = "none"; // ✅ ADDED
  messageEl.innerText = "";
}
