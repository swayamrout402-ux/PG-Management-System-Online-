// ================= SECTION SWITCH =================
document.querySelectorAll(".nav-buttons button").forEach(btn => {
    btn.addEventListener("click", () => {
        const sectionId = btn.dataset.section;

        document.querySelectorAll(".section").forEach(sec =>
            sec.classList.remove("active")
        );

        document.getElementById(sectionId).classList.add("active");

        if (sectionId === "tenantsSection") loadTenants();
        if (sectionId === "paymentsSection") loadPayments();
        if (sectionId === "complaintsSection") loadComplaints();
        if (sectionId === "noticesSection") loadNotices();
        if (sectionId === "roomsSection") loadRooms();
        if (sectionId === "foodSection") loadFoodOrders();
    });
});

// ================= LOGOUT =================
document.getElementById("logoutBtn").addEventListener("click", logout);

// ================= PAGE LOAD =================
document.addEventListener("DOMContentLoaded", () => {
    loadTenants();
    loadPayments();
    loadComplaints();
    loadNotices();
    loadFoodOrders();
});

// ================= HELPERS =================
function calculateRemainingDays(vacateDate) {
    if (!vacateDate) return "-";

    const today = new Date();
    const vacate = new Date(vacateDate);

    const diffTime = vacate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays + " days" : "Expired";
}

// ================= TENANTS =================
async function loadTenants() {
    const res = await authFetch(`${API_BASE}/admin/tenants`);
    const tenants = await res.json();
    const tbody = document.querySelector("#tenantsTable tbody");
    tbody.innerHTML = "";

    tenants.forEach(t => {
        tbody.innerHTML += `
        <tr>
            <td>#${t.tenant_id}</td>
            <td>${t.name}</td>
            <td>${t.email}</td>
            <td>${t.phone}</td>
            <td>${t.room_no || "-"}</td>
            <td>${formatDate(t.joining_date)}</td>
            <td>${formatDate(t.vacate_date)}</td>
            <td>${calculateRemainingDays(t.vacate_date)}</td>
            <td>
                <input type="text" id="room_${t.tenant_id}">
                <button class="assignBtn" data-id="${t.tenant_id}">Assign</button>
            </td>
        </tr>`;
    });

    document.querySelectorAll(".assignBtn").forEach(btn => {
        btn.onclick = () => assignRoom(btn.dataset.id);
    });
}

async function assignRoom(tenantId) {
    const room_no = document.getElementById(`room_${tenantId}`).value.trim();
    if (!room_no) return alert("Enter room number");

    try {
        const res = await authFetch(`${API_BASE}/admin/tenants/${tenantId}/room`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ room_no })
        });

        const data = await res.json();

        if (!res.ok) return alert(data.message || "Failed");

        const row = document.querySelector(`#room_${tenantId}`).closest("tr");
        row.children[4].textContent = data.room_no;

        document.getElementById(`room_${tenantId}`).value = "";

        alert(`Room ${data.room_no} assigned successfully`);
    } catch (err) {
        console.error(err);
        alert("Error");
    }
}

// ================= PAYMENTS =================
async function loadPayments() {
    const res = await authFetch(`${API_BASE}/admin/payments`);
    const payments = await res.json();
    const tbody = document.querySelector("#paymentsTable tbody");
    tbody.innerHTML = "";

    payments.forEach(p => {
        tbody.innerHTML += `
        <tr data-id="${p.payment_id}">
            <td>${p.tenant_name}</td>
            <td>${p.room_no || "-"}</td>
            <td>₹${p.amount}</td>
            <td>${p.payment_mode}</td>
            <td class="payment-status">
                ${p.status}
                ${p.status === "PENDING"
                    ? `<br><button class="confirmPaymentBtn" data-id="${p.payment_id}">Confirm</button>`
                    : ""}
            </td>
            <td>${formatDate(p.created_at)}</td>
        </tr>`;
    });

    document.querySelectorAll(".confirmPaymentBtn").forEach(btn => {
        btn.onclick = () => confirmPayment(btn.dataset.id);
    });
}

async function confirmPayment(paymentId) {
    const res = await authFetch(`${API_BASE}/admin/payments/${paymentId}/confirm`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
    });

    const data = await res.json();
    const row = document.querySelector(`tr[data-id='${paymentId}']`);
    row.querySelector(".payment-status").innerHTML = data.status;
}

// ================= COMPLAINTS =================
async function loadComplaints() {
    const res = await authFetch(`${API_BASE}/admin/complaints`);
    const complaints = await res.json();
    const tbody = document.querySelector("#complaintsTable tbody");
    tbody.innerHTML = "";

    complaints.forEach(c => {
        tbody.innerHTML += `
        <tr>
          <td>#${c.tenant_id}</td>
          <td>${c.tenant_name}</td>
          <td>${c.room_no || "-"}</td>
          <td>${c.title}</td>
          <td>${c.description}</td>
          <td>${c.status}</td>
          <td>${formatDate(c.created_at)}</td>
          <td>
            ${c.status === "OPEN"
              ? `<button class="resolveBtn" data-id="${c.complaint_id}">Resolve</button>`
              : "-"}
          </td>
        </tr>`;
    });

    document.querySelectorAll(".resolveBtn").forEach(btn => {
        btn.onclick = () => resolveComplaint(btn.dataset.id);
    });
}

async function resolveComplaint(id) {
    await authFetch(`${API_BASE}/admin/complaints/${id}/resolve`, { method: "PUT" });
    loadComplaints();
}

// ================= NOTICES =================
async function loadNotices() {
    const res = await authFetch(`${API_BASE}/admin/notices`);
    const notices = await res.json();
    const tbody = document.querySelector("#noticesTable tbody");
    tbody.innerHTML = "";

    notices.forEach(n => {
        tbody.innerHTML += `
        <tr>
          <td>#${n.tenant_id}</td>
          <td>${n.tenant_name}</td>
          <td>${n.room_no || "-"}</td>
          <td>${formatDate(n.vacate_date)}</td>
          <td>${n.reason}</td>
          <td>
            ${n.status}
            ${n.status === "PENDING"
              ? `<br><button class="approveNoticeBtn" data-id="${n.notice_id}">Approve</button>`
              : ""}
          </td>
        </tr>`;
    });

    document.querySelectorAll(".approveNoticeBtn").forEach(btn => {
        btn.onclick = () => approveNotice(btn.dataset.id);
    });
}

async function approveNotice(id) {
    await authFetch(`${API_BASE}/admin/notices/${id}/approve`, { method: "PUT" });
    loadNotices();
    loadTenants();
}

// ================= FOOD =================
async function loadFoodOrders() {
    const res = await authFetch(`${API_BASE}/admin/food`);
    const orders = await res.json();

    const tbody = document.querySelector("#foodTable tbody");
    tbody.innerHTML = "";

    orders.forEach(o => {
        tbody.innerHTML += `
        <tr>
          <td>#${o.tenant_id}</td>
          <td>${o.tenant_name}</td>
          <td>${o.room_no}</td>
          <td>${o.meal_time}</td>
          <td>${o.veg}</td>
          <td>${o.non_veg}</td>
          <td>${formatDate(o.created_at)}</td>
        </tr>`;
    });
}

// ================= ROOMS =================
async function loadRooms() {
    const res = await authFetch(`${API_BASE}/admin/rooms`);
    const rooms = await res.json();

    const tbody = document.getElementById("roomsTable");

    tbody.innerHTML = rooms.map(r => `
        <tr>
            <td>${r.room_no}</td>
            <td>${r.room_type}</td>
            <td>${r.capacity}</td>
            <td>${r.occupied}</td>
            <td>${r.remaining}</td>
            <td>
                <button onclick="viewRoom(${r.room_id})">Details</button>
            </td>
        </tr>
    `).join("");
}

// ================= ROOM DETAILS =================
async function viewRoom(roomId) {
    const res = await authFetch(`${API_BASE}/admin/rooms/${roomId}`);
    const tenants = await res.json();

    const tbody = document.getElementById("roomDetailsTable");

    if (!Array.isArray(tenants) || tenants.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6">No tenants</td></tr>`;
    } else {
        tbody.innerHTML = tenants.map(t => `
        <tr>
          <td>#${t.tenant_id}</td>
          <td>${t.name}</td>
          <td>${t.phone}</td>
          <td>${formatDate(t.joining_date)}</td>
          <td>${formatDate(t.vacate_date)}</td>
          <td>
            <button onclick="removeTenant(${t.tenant_id})">Remove</button>
          </td>
        </tr>
        `).join("");
    }

    document.querySelectorAll(".section").forEach(sec =>
        sec.classList.remove("active")
    );
    document.getElementById("roomDetailsSection").classList.add("active");
}

function goBackToRooms() {
    document.querySelectorAll(".section").forEach(sec =>
        sec.classList.remove("active")
    );
    document.getElementById("roomsSection").classList.add("active");
    loadRooms();
}

// ================= REMOVE TENANT =================
async function removeTenant(tenantId) {
    if (!confirm("Remove tenant?")) return;

    const res = await authFetch(`${API_BASE}/admin/tenants/${tenantId}/remove-room`, {
        method: "PUT"
    });

    const data = await res.json();
    if (!res.ok) return alert(data.message);

    alert("Removed");
    goBackToRooms();
}

// ================= ADD ROOM =================
async function addRoom() {
    const room_no = document.getElementById("room_no").value.trim();
    const room_type = document.getElementById("room_type").value;
    const capacity = document.getElementById("capacity").value;

    if (!room_no || !capacity) return alert("All fields required");

    const res = await authFetch(`${API_BASE}/admin/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room_no, room_type, capacity })
    });

    const data = await res.json();
    if (!res.ok) return alert(data.message);

    alert("Room added");
    loadRooms();
}
// ================= ALERT BUTTON FIX =================
document.addEventListener("DOMContentLoaded", () => {
    const sendBtn = document.getElementById("sendAlertBtn");

    if (sendBtn) {
        sendBtn.addEventListener("click", sendAlert);
    }
});
// ================= SEND ALERT =================
async function sendAlert() {
    const tenantId = document.getElementById("alertTenantId").value;
    const alertType = document.getElementById("alertType").value;
    const message = document.getElementById("alertMessage").value.trim();
    const statusDiv = document.getElementById("alertStatus");

    if (!tenantId || !message) {
        statusDiv.innerHTML = "<p style='color:red'>All fields are required</p>";
        return;
    }

    try {
        const res = await authFetch(`${API_BASE}/admin/alerts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                tenant_id: tenantId,
                alert_type: alertType,
                message: message
            })
        });

        const data = await res.json();

        if (!res.ok) {
            statusDiv.innerHTML = `<p style='color:red'>${data.message}</p>`;
            return;
        }

        statusDiv.innerHTML = "<p style='color:green'>Alert sent successfully!</p>";

        document.getElementById("alertTenantId").value = "";
        document.getElementById("alertMessage").value = "";

    } catch (err) {
        console.error(err);
        statusDiv.innerHTML = "<p style='color:red'>Failed to send alert</p>";
    }
}
