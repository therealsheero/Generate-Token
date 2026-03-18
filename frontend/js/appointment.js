document.addEventListener("DOMContentLoaded", () => {
const calendar = document.getElementById("calendar");
const slotInfo = document.getElementById("slotInfo");
const formWrapper = document.getElementById("formWrapper");
const form = document.getElementById("bookingForm");
const statusText = document.getElementById("status");
const walkinWasFull = localStorage.getItem("walkinFull") === "true";

let selectedDate = null;
 function getDeviceId() {
   let deviceId = localStorage.getItem("device_id");

   if (!deviceId) {
     deviceId =
       "DEV-" +
       crypto.randomUUID(); 
     localStorage.setItem("device_id", deviceId);
   }

   return deviceId;
 }
function disableAppointmentSubmit(msg) {
  const submitBtn = document.querySelector("#bookingForm button[type='submit']");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.style.opacity = "0.6";
    submitBtn.style.cursor = "not-allowed";
  }

  if (statusText && msg) {
    statusText.innerText = msg;
  }
}

function isAppointmentTimeAllowed() {
  const now = new Date();
  const ist = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );

  const mins = ist.getHours() * 60 + ist.getMinutes();
  return mins >= 6 * 60 && mins <= 23 * 60; // 6 AM – 11 PM
}

if (!isAppointmentTimeAllowed()) {
  const statusText = document.getElementById("status");
  // if (statusText) {
  //   statusText.innerText =
  //     "Appointment booking allowed only between 6:00 AM and 11:00 PM";
  statusText.innerText =
        "Booking allowed only between 6:00 AM and 11:00 PM/ बुकिंग केवल सुबह 6:00 बजे से शाम 11:00 बजे के बीच ही की जा सकती है";
  disableAppointmentSubmit();
  //}
}
function isValidIndianMobile(mobile) {
  //validate mobile number format
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
function shouldDisableTodayAppointment() {
  const now = new Date();
  const ist = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );

  const mins = ist.getHours() * 60 + ist.getMinutes();
  return mins > 16 * 60; //block at 4:00pm as office closes as 6:00pm :)
}


async function loadAvailability() {
  calendar.innerHTML = "Loading...";

  try {
    const res = await fetch("/api/availability?disableToday=true");
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
      div.innerHTML = `
        <strong>${dateObj.toDateString()}</strong><br>
        <small>${d.available_slots}/${d.appointment_total} slots</small>
      `;


//      if (d.status === "AVAILABLE") {
//        div.onclick = () => {
//          selectedDate = d.date;
        const todayStr = new Date().toISOString().split("T")[0];
        const disableToday = shouldDisableTodayAppointment();

        if (
          d.status === "AVAILABLE" &&
          !(disableToday && d.date === todayStr)
        ) {
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
      if (disableToday && d.date === todayStr) {
        div.classList.add("disabled");
        div.innerHTML += "<br><small>Closed for today</small>";
      }

    });
    if (walkinWasFull) {
      statusText.innerText =
        "Walk-in slots are full. Appointment booking available from tomorrow.";

      disableTodayInCalendar();

      localStorage.removeItem("walkinFull");
    }

  } catch (err){
    console.error(err);
    calendar.innerHTML = "Unable to load calendar";
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
localStorage.removeItem("tokenData");
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
    device_id: getDeviceId(),
    selected_date: selectedDate,
    name: document.getElementById("name").value.trim(),
    mobile: mobileValue,
    aadhaar_last4: document.getElementById("aadhaar").value.trim(),
    gender: document.getElementById("gender").value,
    age: Number(document.getElementById("age").value),
//    divyang: document.getElementById("divyang").value,
    district: document.getElementById("district").value,
    service_type: document.getElementById("service_type").value,
    qrc: document.getElementById("qrc").value.trim()
  };

  statusText.innerText = "Processing...";
  localStorage.removeItem("tokenData");

  try {
    const res = await fetch("/api/generate-token", {
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

  } catch (err){
    statusText.innerText = "Server not reachable";
  }
});

loadAvailability();
});
