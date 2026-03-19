// ================= CONFIG =================
const API_URL = "https://pg-management-backend.vercel.app/api";

// ================= AUTH FETCH =================
async function authFetch(url, options = {}) {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Please login first!");
    window.location.href = "index.html";
    return;
  }

  options.headers = options.headers || {};
  options.headers["Content-Type"] = "application/json";
  options.headers["Authorization"] = `Bearer ${token}`;

  try {
    const res = await fetch(url, options);

    // If token expired or unauthorized
    if (res.status === 401) {
      alert("Session expired. Please login again.");
      logout();
      return;
    }

    return res;
  } catch (err) {
    console.error("Network error:", err);
    alert("Network error. Please try again.");
  }
}

// ================= LOGOUT =================
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  window.location.href = "index.html";
}

// ================= REDIRECT BY ROLE =================
function checkRole(allowedRoles = ["tenant", "admin"]) {
  const role = localStorage.getItem("role");
  if (!role || !allowedRoles.includes(role)) {
    alert("Access denied. Please login.");
    logout();
  }
}

// ================= UTIL =================
function formatDate(date) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString();
}

// ================= PAGE INIT CHECK =================
// Automatically check login role and redirect if necessary
document.addEventListener("DOMContentLoaded", () => {
  const currentPath = window.location.pathname;

  // If tenant page, check tenant role
  if (currentPath.includes("tenant.html")) checkRole(["tenant"]);
  // If admin page, check admin role
  if (currentPath.includes("admin.html")) checkRole(["admin"]);
});
