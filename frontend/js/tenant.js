// ================= ROLE PROTECTION =================
checkRole(["tenant"]);

// ================= SECTION SWITCH =================
function showSection(sectionId) {
  document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
  document.getElementById(sectionId).classList.add('active');

  if (sectionId === 'paymentsSection') loadPayments();
  if (sectionId === 'complaintsSection') loadComplaints();
  if (sectionId === 'noticeSection') loadNotice();
  if (sectionId === 'alertsSection') loadAlerts();
  if (sectionId === 'foodSection') loadFoodOrders();


}

// ================= LOAD ON PAGE LOAD =================
document.addEventListener('DOMContentLoaded', loadTenantDetails);

// ================= TENANT DASHBOARD =================
async function loadTenantDetails() {
  try {
    const res = await authFetch(`${API_BASE}/tenants/dashboard`);
    if (!res) return;
    const data = await res.json();

    document.getElementById("t_name").innerText = data.name || "-";
document.getElementById("t_phone").innerText = data.phone || "-";
document.getElementById("t_room").innerText = data.room_no || "-";
document.getElementById("t_joining").innerText = formatDate(data.joining_date);
document.getElementById("t_vacate").innerText = formatDate(data.vacate_date);
// ===== Calculate Fixed Tenure =====
if (data.joining_date && data.vacate_date) {
  const joining = new Date(data.joining_date);
  const vacate = new Date(data.vacate_date);

  const totalDays = Math.ceil(
    (vacate - joining) / (1000 * 60 * 60 * 24)
  );

  const totalMonths = Math.floor(totalDays / 30);

  document.getElementById("t_tenure").innerText =
    totalMonths > 0 ? totalMonths + " months" : totalDays + " days";

  // ===== Calculate Remaining Days (Auto Decreasing) =====
  const today = new Date();
  const remainingDays = Math.ceil(
    (vacate - today) / (1000 * 60 * 60 * 24)
  );

  document.getElementById("t_remaining").innerText =
    remainingDays > 0 ? remainingDays + " days" : "Completed";
} else {
  document.getElementById("t_tenure").innerText = "-";
  document.getElementById("t_remaining").innerText = "-";
}


  } catch (err) {
    console.error(err);
    alert("Failed to load tenant details");
  }
}

// ================= COMPLAINTS =================
const complaintForm = document.getElementById('complaintForm');
complaintForm.addEventListener('submit', async e => {
  e.preventDefault();
  const data = {
    title: document.getElementById('complaintTitle').value.trim(),
    description: document.getElementById('complaintDesc').value.trim()
  };
  try {
    const res = await authFetch(`${API_BASE}/complaints/create`, {
      method: 'POST', body: JSON.stringify(data)
    });
    const result = await res.json();
    if (res.ok) {
      alert('Complaint submitted!');
      complaintForm.reset();
      loadComplaints();
    } else alert(result.message || 'Error submitting complaint');
  } catch (err) {
    console.error(err);
    alert('Failed to submit complaint');
  }
});

async function loadComplaints() {
  try {
    const res = await authFetch(`${API_BASE}/complaints/my`);
    const complaints = await res.json();
    if (!Array.isArray(complaints)) return;
    document.getElementById('complaintList').innerHTML = complaints.map(c => `
      <div class="complaint-card">
        <strong>${c.title}</strong> - ${c.status}<br/>
        ${c.description}<br/>
        <small>Created: ${new Date(c.created_at).toLocaleString()}</small>
      </div>
    `).join('');
  } catch (err) {
    console.error(err);
    alert('Failed to load complaints');
  }
}

// ================= PAYMENTS =================
async function loadPayments() {
  try {
    const res = await authFetch(`${API_BASE}/tenants/payments`);
    const payments = await res.json();
    const container = document.getElementById('paymentHistory');
    if (!Array.isArray(payments) || payments.length === 0) {
      container.innerHTML = "<p>No payments found.</p>";
      return;
    }
    container.innerHTML = payments.map(p => `
      <div class="payment-card">
        <strong>₹${p.amount}</strong> - ${p.status}<br/>
        Mode: ${p.payment_mode}<br/>
        Ref: ${p.reference_id || "N/A"}<br/>
        <small>${new Date(p.created_at).toLocaleString()}</small>
      </div>
    `).join('');
  } catch (err) {
    console.error(err);
    alert("Failed to load payments");
  }
}

const paymentForm = document.getElementById('paymentForm');
paymentForm.addEventListener('submit', async e => {
  e.preventDefault();
  const data = {
    amount: document.getElementById('amount').value,
    payment_mode: document.getElementById('payment_mode').value,
    reference_id: document.getElementById('reference_id').value
  };
  try {
    const res = await authFetch(`${API_BASE}/tenants/payments`, {
      method: 'POST', body: JSON.stringify(data)
    });
    const result = await res.json();
    if (res.ok) {
      alert("Payment submitted successfully!");
      paymentForm.reset();
      loadPayments();
    } else alert(result.message || "Payment failed");
  } catch (err) {
    console.error(err);
    alert("Payment error");
  }
});

// ================= VACATE NOTICE =================
const noticeForm = document.getElementById('noticeForm');
noticeForm.addEventListener('submit', async e => {
  e.preventDefault();
  const data = {
    vacate_date: document.getElementById('vacate_date').value,
    reason: document.getElementById('vacate_reason').value.trim()
  };
  try {
    const res = await authFetch(`${API_BASE}/tenants/notice`, {
      method: 'POST', body: JSON.stringify(data)
    });
    const result = await res.json();
    if (res.ok) {
      alert('Vacate notice sent successfully');
      noticeForm.reset();
      loadNotice();
    } else alert(result.message || 'Failed to send notice');
  } catch (err) {
    console.error(err);
    alert('Error sending vacate notice');
  }
});

async function loadNotice() {
  const container = document.getElementById('noticeStatus');
  try {
    const res = await authFetch(`${API_BASE}/tenants/notice`);
    const notice = await res.json();
    if (!notice) {
      container.innerHTML = `<p>No vacate notice sent yet.</p>`;
      noticeForm.style.display = "block";
      return;
    }
    noticeForm.style.display = "none";
    container.innerHTML = `
      <div class="notice-card">
        <strong>Vacate Date:</strong> ${formatDate(notice.vacate_date)}<br/>
        <strong>Status:</strong> ${notice.status}<br/>
        <strong>Reason:</strong> ${notice.reason}<br/>
        <small>Submitted: ${new Date(notice.created_at).toLocaleString()}</small>
      </div>
    `;
  } catch (err) {
    console.error(err);
    container.innerHTML = `<p>Error loading notice</p>`;
  }
}
// ================= ALERTS =================
async function loadAlerts() {
  const container = document.getElementById("alertsList");

  try {
    const res = await authFetch(`${API_BASE}/tenants/alerts`);
    const alerts = await res.json();

    if (!Array.isArray(alerts) || alerts.length === 0) {
      container.innerHTML = "<p>No alerts found.</p>";
      return;
    }

    container.innerHTML = alerts.map(a => `
      <div class="alert-card">
        <strong>Type:</strong> ${a.alert_type}<br/>
        <strong>Message:</strong> ${a.message}<br/>
        <small>${new Date(a.created_at).toLocaleString()}</small>
      </div>
    `).join("");

  } catch (err) {
    console.error(err);
    container.innerHTML = "<p>Error loading alerts</p>";
  }
}
document.getElementById("orderFoodBtn")
    .addEventListener("click", placeFoodOrder);

async function placeFoodOrder() {
    const meal_time = document.getElementById("mealTime").value;
    const mealType = document.getElementById("mealType").value;
    const quantity = parseInt(document.getElementById("quantity").value);

    const statusDiv = document.getElementById("foodStatus");

    if (!meal_time || !mealType || !quantity || quantity <= 0) {
        statusDiv.innerHTML = "<p style='color:red'>All fields are required</p>";
        return;
    }

    let veg = 0;
    let non_veg = 0;

    if (mealType === "VEG") {
        veg = quantity;
    } else {
        non_veg = quantity;
    }

    try {
        const res = await authFetch(`${API_BASE}/food/add`, {
            method: "POST",
            body: JSON.stringify({
                meal_time,
                veg,
                non_veg
            })
        });

        const data = await res.json();

        if (!res.ok) {
            statusDiv.innerHTML = `<p style="color:red">${data.message || "Failed to place order"}</p>`;
            return;
        }

        statusDiv.innerHTML = `<p style="color:green">${data.message}</p>`;

        // Reset form
        document.getElementById("mealTime").value = "";
        document.getElementById("mealType").value = "";
        document.getElementById("quantity").value = "";

        // 🔥 Reload orders list after placing order
        loadFoodOrders();

    } catch (err) {
        console.error(err);
        statusDiv.innerHTML = "<p style='color:red'>Server error</p>";
    }
}
async function loadFoodOrders() {
    try {
        const res = await authFetch(`${API_BASE}/food/my`);
        const orders = await res.json();

        const container = document.getElementById("foodHistory");

        if (!Array.isArray(orders) || orders.length === 0) {
            container.innerHTML = "<p>No food orders yet.</p>";
            return;
        }

        container.innerHTML = orders.map(o => `
            <div class="food-card">
                <strong>${o.meal_time}</strong><br/>
                Veg: ${o.veg} | Non-Veg: ${o.non_veg}<br/>
                <small>${new Date(o.created_at).toLocaleString()}</small>
            </div>
        `).join("");

    } catch (err) {
        console.error(err);
        document.getElementById("foodHistory").innerHTML =
            "<p>Error loading food orders</p>";
    }
}



