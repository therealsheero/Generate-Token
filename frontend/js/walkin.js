const slotInfo = document.getElementById("slotInfo");
const statusText = document.getElementById("status");
const infoText = document.getElementById("infoText");
const form = document.getElementById("bookingForm");
const formWrapper = document.getElementById("formWrapper");

const distance = Number(localStorage.getItem("distance_meters") || 9999);
let otpVerified = false;



function isValidIndianMobile(mobile) {
  return /^[6-9]\d{9}$/.test(mobile);
}

if (distance > 100) {
  infoText.innerText = "❌ Walk-in allowed only inside office premises";
  formWrapper.style.display = "none";
} else {
  infoText.innerText = "✅ You are inside office premises";
  formWrapper.style.display = "block";
}

async function loadWalkinAvailability() {
  try {
    const res = await fetch("http://localhost:5000/api/walkin-availability");
    const data = await res.json();

    if (data.available_slots <= 0) {
     
      localStorage.setItem("walkinFull", "true");

      statusText.innerText =
        "❌ Walk-in slots are full. Redirecting to appointment booking...";

      setTimeout(() => {
        window.location.href = "appointment.html";
      }, 1500);

      return;
    }

   
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


form.addEventListener("submit", async (e) => {
  e.preventDefault();

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
