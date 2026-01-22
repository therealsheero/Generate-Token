// alert("JS FILE LOADED");
// console.log("FORM:", document.getElementById("bookingForm"));
// console.log("STATUS:", document.getElementById("status"));

const slotInfo = document.getElementById("slotInfo");
const statusText = document.getElementById("status");
const infoText = document.getElementById("infoText");
const form = document.getElementById("bookingForm");
const formWrapper = document.getElementById("formWrapper");

const distance = Number(localStorage.getItem("distance_meters") || 9999);
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

//     formWrapper.style.display = "none";
//     slotInfo.style.display = "none";
//   }
// });

function isValidIndianMobile(mobile) {
  // must be 10 digits and start with 6, 7, 8, or 9
  return /^[6-9]\d{9}$/.test(mobile);
}

if (distance > 100) {
  infoText.innerText = "❌ Walk-in allowed only inside office premises";
  formWrapper.style.display = "none";
} else {
  infoText.innerText = "✅ You are inside office premises";
  formWrapper.style.display = "block";
}

// =============================
// LOAD WALK-IN AVAILABILITY
// =============================
async function loadWalkinAvailability() {
  try {
    const res = await fetch("http://localhost:5000/api/walkin-availability");
    const data = await res.json();

    if (data.available_slots <= 0) {
      // 🔴 WALK-IN FULL → redirect to appointment
      localStorage.setItem("walkinFull", "true");

      statusText.innerText =
        "❌ Walk-in slots are full. Redirecting to appointment booking...";

      setTimeout(() => {
        window.location.href = "appointment.html";
      }, 1500);

      return;
    }

    // ✅ slots available
    localStorage.removeItem("walkinFull");

    slotInfo.innerHTML = `
      🟢 <strong>${data.available_slots}</strong> / ${data.total_slots}
      walk-in slots available today
    `;

    formWrapper.style.display = "block";

  } catch {
    slotInfo.innerText = "Unable to load walk-in availability";
  }
}


// =============================
// FORM SUBMIT
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

  const payload = {
    mode: "W",
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

    // ✅ CRITICAL FIX
    localStorage.setItem(
      "tokenData",
      JSON.stringify({ ...payload, ...result })
    );

    window.location.href = "confirmation.html";

  } catch {
    statusText.innerText = "Server not reachable";
  }
});

loadWalkinAvailability();
