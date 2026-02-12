const guardToken = localStorage.getItem("guardToken");
if (!guardToken) {
  window.location.href = "guard-login.html";
}

const tbody = document.querySelector("#tokenTable tbody");
let currentTableData = [];
function isUndoAllowed(visitedAt) {
  if (!visitedAt) return false;

  const visitedTime = new Date(visitedAt + "Z").getTime();
  const now = Date.now();
  const diffMinutes = (now - visitedTime) / 60000;

  return diffMinutes <= 10;
}

async function undoVisited(tokenId) {
  await fetch("/api/guard/undo-visit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-guard-token": guardToken
    },
    body: JSON.stringify({ token_id: tokenId })
  });

  loadTokens(); // refresh
}


// =======================
// DATE FORMATTERS (IST FIXED)
// =======================
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function formatDateTime(dt) {
  return new Date(dt+ "Z").toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
}

function parseToken(token) {
  const parts = token.split("-");
  return {
    count: parts[0],     // 001
    type: parts[1],      // WN / AP / WL
    aadhaar: parts[2]    // 1234
  };
}

// =======================
// LOAD TODAY TOKENS ONLY
// =======================
async function loadTokens() {
  tbody.innerHTML = "<tr><td colspan='13'>Loading...</td></tr>";

  const res = await fetch("/api/guard/today", {
    headers: { "x-guard-token": guardToken }
  });

  if (!res.ok) {
    alert("Session expired");
    logout();
    return;
  }

  const data = await res.json();
  currentTableData = data;
  tbody.innerHTML = "";
  const total = data.length;
  const visited = data.filter(r => r.visited === 1).length;
  const pending = total - visited;

  data.forEach((row, i) => {
    const tr = document.createElement("tr");

    const { count, type } = parseToken(row.token);
    tr.classList.add(type.toLowerCase()); // ap / an / wp / wn / wl
    let visitedCell = "";
//    tr.innerHTML = `
//      <td>${i + 1}</td>
//      <td>${formatDateTime(row.created_at)}</td>
//      <td>${formatDate(row.date)}</td>
//      <td>${count}</td>
//      <td>${type}</td>
//      <td>${row.token}</td>
//      <td>${row.name}</td>
//      <td>${row.mobile}</td>
//      <td>${row.gender}</td>
//      <td>${row.age}</td>
//      <td>${row.district}</td>
//      <td>${row.service_type}</td>
//    `;
if (row.visited === 1) {
  if (isUndoAllowed(row.visited_at)) {
    visitedCell = `
      ? 
      <button style="margin-left:6px;font-size:11px;"
              onclick="undoVisited(${row.id})">
        Undo
      </button>
    `;
  } else {
    visitedCell = "?";
  }
} else {
  visitedCell = `<input type="checkbox" onclick="markVisited(${row.id})">`;
}


    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${formatDateTime(row.created_at)}</td>
      <td>${formatDate(row.date)}</td>
      <td>${count}</td>
      <td>${type}</td>
      <td>${row.token}</td>
      <td>${row.name}</td>
      <td>${row.mobile}</td>
      <td>${row.gender}</td>
      <td>${row.age}</td>
      <td>${row.district}</td>
      <td>${row.service_type}</td>
      <td style="text-align:center">${visitedCell}</td>
    `;

    tbody.appendChild(tr);
  });
}
async function markVisited(tokenId) {
  await fetch("/api/guard/visit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-guard-token": guardToken
    },
    body: JSON.stringify({ token_id: tokenId })
  });

  // refresh table (real-time feel)
  loadTokens();
}

// =======================
// CSV DOWNLOAD (TODAY ONLY)
// =======================
function downloadCSV() {
  if (!currentTableData.length) {
    alert("No data to export");
    return;
  }

  const header = [
    "S.No",
    "Token Created",
    "Appointment / Walk-in Date",
    "Token Count",
    "Token Type",
    "Full Token",
    "Name",
    "Mobile",
    "Gender",
    "Age",
    "PWD",
    "District",
    "Service"
  ];

  let csv = header.join(",") + "\n";

  currentTableData.forEach((row, i) => {
    const { count, type, aadhaar } = parseToken(row.token);

    const line = [
      i + 1,
      formatDateTime(row.created_at),
      formatDate(row.date),
      count,
      type,
      row.token,
      row.name,
      row.mobile,
      row.gender,
      row.district,
      row.service_type
    ]
      .map(v => `"${String(v ?? "").replace(/"/g, '""')}"`)
      .join(",");

    csv += line + "\n";
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `guard_tokens_today.csv`;
  a.click();

  URL.revokeObjectURL(url);
}

// =======================
// LOGOUT
// =======================
function logout() {
  localStorage.removeItem("guardToken");
  window.location.href = "guard-login.html";
}

// =======================
// INIT
// =======================
loadTokens();

