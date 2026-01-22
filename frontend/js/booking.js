// // =============================
// // GLOBAL STATE
// // =============================
// const form = document.getElementById("bookingForm");
// const statusText = document.getElementById("status");

// const appointmentSection = document.getElementById("appointmentSection");
// const walkinSection = document.getElementById("walkinSection");
// const calendar = document.getElementById("calendar");
// const slotInfo = document.getElementById("slotInfo");
// const formWrapper = document.getElementById("formWrapper");

// const appointmentBtn = document.getElementById("appointmentBtn");
// const walkinBtn = document.getElementById("walkinBtn");

// let currentMode = null;     // 'A' or 'W'
// let selectedDate = null;

// // hide everything initially
// appointmentSection.style.display = "none";
// walkinSection.style.display = "none";
// formWrapper.style.display = "none";
// slotInfo.style.display = "none";

// async function loadAvailability(disableToday = false) {
//   if (!calendar) return;

//   calendar.innerHTML = "Loading...";

//   try {
//     const query = disableToday ? "?disableToday=true" : "";
//     const res = await fetch(
//       `http://localhost:5000/api/availability${query}`
//     );
//     const data = await res.json();
//     calendar.innerHTML = "";
//     data.forEach(d => {
//       const div = document.createElement("div");
//       div.className = `calendar-day ${
//         d.status === "AVAILABLE"
//           ? "available"
//           : d.status === "FULL"
//           ? "full"
//           : "holiday"
//       }`;

//       const dateObj = new Date(d.date);
//       const readable = dateObj.toLocaleDateString("en-IN", {
//         day: "numeric",
//         month: "short",
//         weekday: "short"
//       });

//       div.innerHTML = `<strong>${readable}</strong>`;

//       if (d.status === "AVAILABLE") {
//         div.addEventListener("click", () => {
//           selectedDate = d.date;

//           document
//             .querySelectorAll(".calendar-day")
//             .forEach(el => el.classList.remove("selected"));

//           div.classList.add("selected");

//           slotInfo.style.display = "block";
//           slotInfo.innerHTML = `
//             📅 <strong>${dateObj.toDateString()}</strong><br/>
//             🟢 ${d.available_slots} slots available
//           `;

//           formWrapper.style.display = "block";
//           statusText.innerText = "Please fill appointment form";
//         });
//       }

//       calendar.appendChild(div);
//     });
//   } catch (err) {
//     calendar.innerHTML = "Unable to load calendar";
//   }
// }

// // =============================
// // WALK-IN AVAILABILITY
// // =============================
// async function loadWalkinAvailability() {

//   try {
//     const res = await fetch("http://localhost:5000/api/walkin-availability");
//     const data = await res.json();

//     if (data.available_slots <= 0) {
//       statusText.innerText =
//         "Walk-in slots full. Redirecting to appointment.";
//       handleAppointmentClick();
//       return;
//     }

//     slotInfo.style.display = "block";
//     slotInfo.innerHTML = `
//       🚶 <strong>Walk-in Today</strong><br/>
//       🟢 ${data.available_slots} / ${data.total_slots} slots available
//     `;
//   } catch {
//     statusText.innerText = "Unable to load walk-in availability";
//   }
// }

// // =============================
// // APPOINTMENT BUTTON
// // =============================
// function handleAppointmentClick() {
//   currentMode = "A";
//   selectedDate = null;

//   appointmentSection.style.display = "block";
//   walkinSection.style.display = "none";
//   formWrapper.style.display = "none";
//   slotInfo.style.display = "none";

//   const disableToday = window.userContext?.inRadius === true;
//   loadAvailability(disableToday);

//   statusText.innerText = disableToday
//     ? "Near office: appointment allowed from tomorrow only."
//     : "Please select appointment date";
// }

// if (appointmentBtn) {
//   appointmentBtn.addEventListener("click", handleAppointmentClick);
// }

// // =============================
// // WALK-IN BUTTON
// // =============================
// function handleWalkinClick() {
//   if (!window.userContext?.inRadius) {
//     statusText.innerText =
//       "❌ Walk-in allowed only within office premises";
//     return;
//   }

//   currentMode = "W";
//   selectedDate = null;

//   walkinSection.style.display = "block";
//   appointmentSection.style.display = "none";
//   formWrapper.style.display = "block";

//   loadWalkinAvailability();

//   statusText.innerText = "Please fill walk-in form";
// }

// if (walkinBtn) {
//   walkinBtn.addEventListener("click", handleWalkinClick);
// }

// // =============================
// // FORM SUBMIT (A + W)
// // =============================
// form.addEventListener("submit", async (e) => {
//   e.preventDefault();

//   if (!currentMode) {
//     statusText.innerText =
//       "Please choose Appointment or Walk-in";
//     return;
//   }

//   const payload = {
//     mode: currentMode,
//     name: document.getElementById("name").value.trim(),
//     mobile: document.getElementById("mobile").value.trim(),
//     aadhaar_last4: document.getElementById("aadhaar").value.trim(),
//     gender: document.getElementById("gender").value,
//     age: Number(document.getElementById("age").value),
//     divyang: document.getElementById("divyang").value,
//     district: document.getElementById("district").value,
//     service_type: document.getElementById("service_type").value,
//     qrc: document.getElementById("qrc").value.trim()
//   };


//   if (currentMode === "A") {
//     if (!selectedDate) {
//       statusText.innerText =
//         "Please select appointment date";
//       return;
//     }
//     payload.selected_date = selectedDate;
//   }

//   statusText.innerText = "Processing...";

//   try {
//     const res = await fetch(
//       "http://localhost:5000/api/generate-token",
//       {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload)
//       }
//     );

//     const result = await res.json();

//     if (!res.ok) {
//       statusText.innerText = result.message;
//       return;
//     }

//     localStorage.setItem(
//       "tokenData",
//       JSON.stringify({ ...payload, ...result })
//     );

//     window.location.href = "confirmation.html";
//   } catch {
//     statusText.innerText = "Server not reachable";
//   }
// });
