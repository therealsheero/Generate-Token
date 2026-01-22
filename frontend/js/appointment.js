
const calendar = document.getElementById("calendar");
const slotInfo = document.getElementById("slotInfo");
const formWrapper = document.getElementById("formWrapper");
const form = document.getElementById("bookingForm");
const statusText = document.getElementById("status");

const walkinWasFull = localStorage.getItem("walkinFull") === "true";

let selectedDate = null;
let otpVerified = false;


// sendOtpBtn.onclick = async () => {
//   await fetch("/api/otp/send-otp", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ mobile: mobile.value })
//   });
//   statusText.innerText = "OTP sent";
// };

// verifyOtpBtn.onclick = async () => {
//   const res = await fetch("/api/otp/verify-otp", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({
//       mobile: mobile.value,
//       otp: otp.value
//     })
//   });

//   const result = await res.json();

//   if (!res.ok) {
//     statusText.innerText = result.message;
//     return;
//   }

//   otpVerified = true;
//   statusText.innerText = "✅ Mobile verified";
// };
// function isWithinBookingTimeIST() {
//   const now = new Date();
//   const istTime = new Date(
//     now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
//   );

//   const currentMinutes =
//     istTime.getHours() * 60 + istTime.getMinutes();

//   const start = 13 * 60; // 6:00 AM (as per your middleware comment)
//   const end   = 18 * 60; // 6:00 PM

//   return currentMinutes >= start && currentMinutes <= end;
// }
// window.addEventListener("load", () => {
//   if (!isWithinBookingTimeIST()) {
//     statusText.innerText =
//       "Booking allowed only between 6:00 AM and 6:00 PM/ बुकिंग केवल सुबह 6:00 बजे से शाम 6:00 बजे के बीच ही की जा सकती है।";

//     // Disable calendar clicks
//     document
//       .querySelectorAll(".calendar-day")
//       .forEach(day => {
//         day.style.pointerEvents = "none";
//         day.style.opacity = "0.5";
//       });

//     // Disable generate button
//     const submitBtn = document.querySelector(
//       "#bookingForm button[type='submit']"
//     );
//     if (submitBtn) {
//       submitBtn.disabled = true;
//       submitBtn.style.opacity = "0.6";
//       submitBtn.style.cursor = "not-allowed";
//     }
//   }
// });

function isValidIndianMobile(mobile) {
  // must be 10 digits and start with 6, 7, 8, or 9
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

    // 🚨 HANDLE WALK-IN FULL REDIRECT CASE
    if (walkinWasFull) {
      statusText.innerText =
        "ℹ️ Walk-in slots are full. Appointment booking available from tomorrow.";

      disableTodayInCalendar();

      // clear flag so refresh doesn't keep disabling
      localStorage.removeItem("walkinFull");
    }

  } catch {
    calendar.innerHTML = "Unable to load calendar";
  }
}

// =============================
// FORM SUBMIT (APPOINTMENT)
// =============================
form.addEventListener("submit", async (e) => {
  e.preventDefault();
//   if (!otpVerified) {
//   statusText.innerText = "Please verify OTP first";
//   return;
// }
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
    mode: "A", // ✅ FIXED
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

// =============================
// INIT
// =============================
loadAvailability();
