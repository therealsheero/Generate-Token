
const calendar = document.getElementById("calendar");
const slotInfo = document.getElementById("slotInfo");
const formWrapper = document.getElementById("formWrapper");
const form = document.getElementById("bookingForm");
const statusText = document.getElementById("status");

const walkinWasFull = localStorage.getItem("walkinFull") === "true";

let selectedDate = null;
let otpVerified = false;



function isValidIndianMobile(mobile) {
  return /^[6-9]\d{9}$/.test(mobile);
}

function disableTodayInCalendar() {
  const today = new Date().toISOString().split("T")[0];

  document.querySelectorAll(".calendar-day").forEach(day => {
    if (day.dataset.date === today) {
      day.classList.add("disabled");
      day.onclick = null;
      day.innerHTML += "<br><small>Walk-in only</small>";
    }
  });
}


async function loadAvailability() {
  calendar.innerHTML = "Loading...";

  try {
    const res = await fetch("http://localhost:5000/api/availability");
    const data = await res.json();

    calendar.innerHTML = "";

    data.forEach(d => {
      const div = document.createElement("div");
      div.dataset.date = d.date;

      div.className = `calendar-day ${
        d.status === "AVAILABLE"
          ? "available"
          : d.status === "FULL"
          ? "full"
          : "holiday"
      }`;

      const dateObj = new Date(d.date);
      // div.innerHTML = `<strong>${dateObj.toDateString()}</strong>`;
      div.innerHTML = `
        <strong>${dateObj.toDateString()}</strong><br>
        <small>${d.available_slots}/${d.appointment_total} slots</small>
      `;


      if (d.status === "AVAILABLE") {
        div.onclick = () => {
          selectedDate = d.date;

          document
            .querySelectorAll(".calendar-day")
            .forEach(el => el.classList.remove("selected"));

          div.classList.add("selected");

          slotInfo.style.display = "block";
          slotInfo.innerHTML = `
            🟢 <strong>${d.available_slots}</strong> /
            <strong>${d.appointment_total}</strong>
            appointment slots available
          `;

          formWrapper.style.display = "block";
          statusText.innerText = "Please fill appointment form";
        };
      }

      calendar.appendChild(div);
    });

    if (walkinWasFull) {
      statusText.innerText =
        "ℹ️ Walk-in slots are full. Appointment booking available from tomorrow.";

      disableTodayInCalendar();

      localStorage.removeItem("walkinFull");
    }

  } catch {
    calendar.innerHTML = "Unable to load calendar";
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  console.log("🚀 SUBMIT CLICKED");
  const mobileValue = document.getElementById("mobile").value.trim();

  if (!isValidIndianMobile(mobileValue)) {
    statusText.innerText =
      "❌ Enter a valid Indian mobile number (starts with 6–9)";
    return;
  }

  if (!selectedDate) {
    statusText.innerText = "Please select appointment date";
    return;
  }

  const payload = {
    mode: "A", 
    selected_date: selectedDate,
    name: document.getElementById("name").value.trim(),
    mobile: mobileValue,
    aadhaar_last4: document.getElementById("aadhaar").value.trim(),
    gender: document.getElementById("gender").value,
    age: Number(document.getElementById("age").value),
    divyang: document.getElementById("divyang").value,
    district: document.getElementById("district").value,
    service_type: document.getElementById("service_type").value,
    qrc: document.getElementById("qrc").value.trim()
  };

  statusText.innerText = "Processing...";

  try {
    const res = await fetch("http://localhost:5000/api/generate-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await res.json();

    if (!res.ok) {
      statusText.innerText = result.message;
      return;
    }

    localStorage.setItem(
      "tokenData",
      JSON.stringify({ ...payload, ...result })
    );

    window.location.href = "confirmation.html";

  } catch {
    statusText.innerText = "Server not reachable";
  }
});

loadAvailability();
