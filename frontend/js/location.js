const statusEl = document.getElementById("locationStatus");
// ⛔ STOP location check if booking is closed
if (window.bookingAllowed === false) {
  console.log("Booking closed — skipping geolocation");
  // Do NOT touch locationStatus again
  return;
}

window.userContext = {
  inRadius: false
};

async function checkLocation() {
  if (!navigator.geolocation) {
    statusEl.innerText = "❌ Geolocation not supported";
    return;
  }

  statusEl.innerText = "📍 Checking your location...";

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const res = await fetch("http://localhost:5000/api/location-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        })
      });

      const data = await res.json();

      window.userContext.inRadius = data.distance_meters <= 100;

      statusEl.innerText =
        `📍 Distance: ${data.distance_meters} meters`;
      
      console.log("USER CONTEXT:", window.userContext);
    },
    () => {
      statusEl.innerText = "❌ Location permission denied";
    },
    { enableHighAccuracy: true }
  );
}

window.addEventListener("load", checkLocation);
