console.log("ADMIN JS LOADED");
const adminToken = localStorage.getItem("adminToken");
if (!adminToken) {
  window.location.href = "admin-login.html";
}
let districtChartInstance = null;
const calendar = document.getElementById("calendar");
const table = document.getElementById("tokenTable");
const tableHeading = document.getElementById("tableHeading");
const tbody = table.querySelector("tbody");
const actions = document.getElementById("tableActions");

let currentDate = null;
let currentTableData = [];

function renderSummaryTable(data) {
  const container = document.getElementById("dashboardBoxes");
  container.innerHTML = "";

  let html = `
    <table style="width:100%; border-collapse:collapse; background:white; font-size:12px;">
    <tr>
      <th style="padding:4px; font-weight:bold; text-decoration:underline;">Sr No.</th>
      <th style="padding:4px; font-weight:bold; text-decoration:underline;">Parameter</th>
      <th style="padding:4px; font-weight:bold; text-decoration:underline;">Visited</th>
      <th style="padding:4px; font-weight:bold; text-decoration:underline;">Not Visited</th>
      <th style="padding:4px; font-weight:bold; text-decoration:underline;">Total</th>
    </tr>

  `;

  let sr = 1;

  data.summary.forEach(row => {
    const label = row.mode === "A" ? "Appointments" : "Walk-ins";
    const total = row.total;
    const rowColor = row.mode === "A" ? "background:#e3f2fd;" : "background:#cfff3e0;";

    html += `
      <tr style="${rowColor};">
        <td>${sr++}</td>
        <td><b>${label}</b></td>
        <td style="color:green">${row.visited}</td>
        <td style="color:red">${row.not_visited}</td>
        <td>${total}</td>
      </tr>
    `;
  });
  data.gender.forEach(g => {
    html += `
      <tr style="background: #f1f8e9;">
        <td>${sr++}</td>
        <td>${g.gender}</td>
        <td style="color:green">${g.visited}</td>
        <td style="color:red">${g.not_visited}</td>
        <td>${g.total}</td>
      </tr>
    `;
  });

  html += `
    <tr style ="background: #f3e5f5;">
      <td>${sr++}</td>
      <td>Age 0-5</td>
      <td style="color:green">${data.age.age_0_5_visited}</td>
      <td style="color:red">${data.age.age_0_5_not}</td>
      <td>${data.age.age_0_5}</td>
    </tr>
    <tr style ="background: #f3e5f5;">
      <td>${sr++}</td>
      <td>Age 6-18</td>
      <td style="color:green">${data.age.age_6_18_visited}</td>
      <td style="color:red">${data.age.age_6_18_not}</td>
      <td>${data.age.age_6_18}</td>
    </tr>
    <tr style ="background: #f3e5f5;">
      <td>${sr++}</td>
      <td>Age 18+</td>
      <td style="color:green">${data.age.age_18_plus_visited}</td>
      <td style="color:red">${data.age.age_18_plus_not}</td>
      <td>${data.age.age_18_plus}</td>
    </tr>
  `;

  html += `</table><br><br>`;

 html += `
    <table style="width:100%; border-collapse:collapse; background:white; font-size:12px;">
      <tr>
        <th style="padding:4px; font-weight:bold; text-decoration:underline;">Sr No.</th>
        <th style="padding:4px; font-weight:bold; text-decoration:underline;">Parameter</th>
        <th style="padding:4px; font-weight:bold; text-decoration:underline;">Visited</th>
        <th style="padding:4px; font-weight:bold; text-decoration:underline;">Not Visited</th>
        <th style="padding:4px; font-weight:bold; text-decoration:underline;">Total</th>
      </tr>

  `;
  const serviceColors = [
  "#e8f5e9",
  "#e3f2fd",
  "#fff8e1",
  "#fce4ec",
  "#ede7f6",
  "#e0f7fa"
];

  data.services.forEach((s, index) => {
    const bg = serviceColors[index % serviceColors.length];
    html += `
      <tr style="background:${bg};">
        <td>${index + 1}</td>
        <td>${s.service_type}</td>
        <td style="color:green">${s.visited}</td>
        <td style="color:red">${s.not_visited}</td>
        <td>${s.total}</td>
      </tr>
    `;
  });

  html += `</table>`;
    const ctx = document.getElementById("districtChart");

if (districtChartInstance) {
  districtChartInstance.destroy();
}

if (ctx && data.districts && data.districts.length > 0) {
  districtChartInstance = new Chart(ctx, {
    type: "pie",
    data: {
      labels: data.districts.map(d => d.district),
      datasets: [{
        data: data.districts.map(d => d.total),
        backgroundColor: [
          "#4CAF50",
          "#2196F3",
          "#FF9800",
          "#9C27B0",
          "#F44336",
          "#00BCD4"
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: false,
          text: "Visited Distribution by District"
        }
      }
    }
  });
}

  container.innerHTML = html;
}

async function loadDashboard(date) {
  const res = await fetch(
    `/api/admin/dashboard?date=${date}`,
    {
      headers: { "x-admin-token": adminToken }
    }
  );

  const data = await res.json();
  renderSummaryTable(data);
}


function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function formatDateTime(dt) {
  return new Date(dt + "Z").toLocaleString("en-IN", {
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


function refreshCurrent() {
  if (currentDate) {
    loadTokens(currentDate);
  } else {
    loadCalendar();
  }
}

async function loadCalendar() {
  calendar.innerHTML = "Loading...";

  const res = await fetch("/api/admin/calendar", {
    headers: { "x-admin-token": adminToken }
  });

  if (!res.ok) {
    calendar.innerHTML = "Failed to load calendar";
    return;
  }

  const data = await res.json();

  if (!Array.isArray(data)) {
    console.error("Calendar API did not return array:", data);
    calendar.innerHTML = "Invalid calendar data";
    return;
  }

  calendar.innerHTML = "";

  data.forEach(d => {
    const div = document.createElement("div");
    div.className = "date-box";
    div.innerHTML = `
      <b>${d.date}</b><br>
       Appointment: ${d.appointment_booked}/${d.appointment_total}<br>
       Walk-in: ${d.walkin_booked}/${d.walkin_total}
    `;
    div.onclick = () => loadTokens(d.date);
    calendar.appendChild(div);
  });
}

async function loadTokens(date) {
  
  currentDate = date;
  loadDashboard(date);
  tbody.innerHTML = "Loading...";
  table.style.display = "table";
  tableHeading.innerText = "Token Details for " + formatDate(date);
  tableHeading.style.display = "block";
  actions.style.display = "block";

  const res = await fetch(`/api/admin/tokens?date=${date}`, {
    headers: { "x-admin-token": adminToken }
  });
const data = await res.json();
document.getElementById("dashboardHeading").style.display = "block";
document.getElementById("dashboardHeading").innerText =
  "Dashboard Summary for " + formatDate(date);

currentTableData = data; // ?? store for CSV
  tbody.innerHTML = "";

  data.forEach((row, i) => {
    const tr = document.createElement("tr");

    //if (row.priority === "P") tr.classList.add("priority");
    // if (row.mode === "A") tr.classList.add("appointment");
//    if (row.priority === "P") {
//      tr.classList.add("priority");     // RED
//    } else if (row.mode === "A") {
//      tr.classList.add("appointment");  // YELLOW
//    }
    
    
      const tokenParts = row.token.split("-");
      const tokenCount = tokenParts[0];
      const tokenType  = tokenParts[1];
      const aadhaar    = tokenParts[2];

      if (tokenType === "AP") tr.classList.add("ap");
      else if (tokenType === "WP") tr.classList.add("wp");
      else if (tokenType === "WL") tr.classList.add("wl");
      else if (tokenType === "AN") tr.classList.add("an");
      else if (tokenType === "WN") tr.classList.add("wn");

    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${formatDateTime(row.created_at)}</td>
      <td>${formatDate(row.date)}</td>
      <td>${tokenCount}</td>
      <td>${tokenType}</td>
      <td>${row.token}</td>
      <td>${row.name}</td>
      <td>${row.mobile}</td>
      <td>${row.gender}</td>
      <td>${row.age}</td>
      <td>${row.district}</td>
      <td>${row.service_type}</td>
      <td style="color:${row.visited ? 'green' : 'red'}; font-weight:bold;">
        ${row.visited ? 'Visited' : 'Not Visited'}
      </td>
    `;

    tbody.appendChild(tr);
//    loadTodaySummary();
  });
}

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
    "Service Type",
    "Gender",
    "Age",
    "PWD",
    "District"
  ];

  let csv = header.join(",") + "\n";

  currentTableData.forEach((row, i) => {
    const { count, type, aadhaar } = parseToken(row.token);

    const line = [
      i + 1,
      formatDateTime(row.created_at),
      row.date,
      count,
      type,
      row.token,
      row.name,
      row.mobile,
      row.service_type,
      row.gender,
      row.age,
      row.divyang,
      row.district
    ]
      .map(v => `"${String(v ?? "").replace(/"/g, '""')}"`)
      .join(",");

    csv += line + "\n";
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `tokens_${currentDate}.csv`;
  a.click();

  URL.revokeObjectURL(url);
}

function logout() {
  localStorage.removeItem("adminToken");
  window.location.href = "admin-login.html";
}
loadCalendar();

