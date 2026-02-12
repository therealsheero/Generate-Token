const db = require("../models/db");
const { reserveSlot } = require("../services/slot.service");
const { generateDailyToken } = require("../services/token.service");

function normalizeDistrict(d) {
  return d.split("/")[0].trim();
}
function isWeekend(dateStr) {
  const d = new Date(dateStr);
  const day = d.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}
function isGazettedHoliday(dateStr) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT 1 FROM holidays WHERE date = ?`,
      [dateStr],
      (err, row) => {
        if (err) return reject(err);
        resolve(!!row);
      }
    );
  });
}
exports.generateToken = async (req, res) => {
  const {
    device_id,
    name,
    mobile,
    aadhaar_last4,
    age,
    gender,
    divyang,
    district,
    service_type,
    qrc,
    mode,          // 'A' or 'W'
    selected_date  // required only for Appointment
  } = req.body;

  if (!name || !mobile || !aadhaar_last4 || !qrc || !district || !mode) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  const mobileRegex = /^[6-9][0-9]{9}$/;

  if (!mobileRegex.test(mobile)) {
    return res.status(400).json({
      message: "Invalid mobile number. Must start with 6,7,8,9"
    });
  }
  const qrcRegex = /^S[A-Za-z0-9]+000$/;
  if(!qrcRegex.test(qrc)){
    return res.status(400).json({ message: "Invalid QRC format. Must start with S and end with 000."});
  }
  try {
    // =========================
    // BEGIN TRANSACTION
    // =========================
    await new Promise((resolve, reject) =>
      db.run("BEGIN TRANSACTION", err => err ? reject(err) : resolve())
    );

    // =========================
    // 1️⃣ DUPLICATE QRC CHECK
    // =========================
    const qrcExists = await new Promise((resolve, reject) => {
      db.get(
        "SELECT id FROM tokens WHERE qrc = ?",
        [qrc],
        (err, row) => err ? reject(err) : resolve(!!row)
      );
    });

    if (qrcExists) {
      throw new Error("This QRC has already been used");
    }
    const qrcCountForMobile = await new Promise((resolve,reject)=>{ db.get("SELECT COUNT(DISTINCT qrc) AS count FROM tokens WHERE mobile =?",[mobile],(err,row)=>(err ?reject(err):resolve(row.count)));
    });
    if(qrcCountForMobile >=2){ 
     throw new Error("Only 2 QRCs allowed per mobile number.");
    }
    // =========================
    // 2️⃣ MOBILE LIMIT CHECK
    // =========================
    const tokenCount = await new Promise((resolve, reject) => {
      db.get(
        "SELECT COUNT(*) AS count FROM tokens WHERE mobile = ?",
        [mobile],
        (err, row) => err ? reject(err) : resolve(row.count)
      );
    });

    if (tokenCount >= 3) {
      throw new Error("Maximum 3 tokens allowed per mobile number");
    }

    // =========================
    // 3️⃣ DETERMINE DATE
    // =========================
    let bookingDate;
//    if (mode === "W") {
//      bookingDate = new Date().toISOString().split("T")[0];
//    } else {
//      if (!selected_date) {
//        throw new Error("Appointment date is required");
//      }
//      bookingDate = selected_date;
//    }
//    if (mode === "W" && selected_date) {
//      throw new Error("Walk-in cannot have appointment date");
//    }
    if (mode === "W") {
      bookingDate = new Date().toISOString().split("T")[0];
      const isWeekendDay = isWeekend(bookingDate);
      const isHoliday = await isGazettedHoliday(bookingDate);
      if (isWeekendDay || isHoliday) {
        throw new Error("Walk-in tokens cannot be generated on holidays");
      }
      if (selected_date) {
        throw new Error("Walk-in cannot have appointment date");
      }
    } else {
      if (!selected_date) {
        throw new Error("Appointment date is required");
      }
      bookingDate = selected_date;
    }
    const deviceTokenExists = await new Promise((resolve, reject) => {
  db.get(
    `
    SELECT id
    FROM tokens
    WHERE device_id = ?
      AND date = ?
    `,
    [device_id, bookingDate],
    (err, row) => {
      if (err) reject(err);
      else resolve(!!row);
    }
  );
});

if (deviceTokenExists) {
  throw new Error(
    "Only one token per device is allowed per day"
  );
}

    // =========================
    // 4️⃣ RESERVE SLOT
    // =========================
    await reserveSlot(bookingDate, mode);

    // =========================
    // 5️⃣ GENERATE TOKEN
    // =========================
//    const{ token, priority } = await generateDailyToken(
//      name,
//      mobile,
//      bookingDate,
//      age,
//      gender,
//      divyang,
//      mode
//    );
    const cleanDistrict = normalizeDistrict(district);
const longDistance = [
    "Baghpat",
    "Bijnor",
    "Bulandshahr",
    "Gautam Buddha Nagar",
    "Ghaziabad",
    "Gorakhpur",
    "Hapur",
    "Lalitpur",
    "Meerut",
    "Muzaffarnagar",
    "Pilibhit",
    "Saharanpur",
    "Shamli",
    "Sonbhadra",
    "Varanasi"
].includes(cleanDistrict);

let tokenType;

// AP / AN
if (mode === "A") {
  // tokenType = divyang === "Yes" ? "AP" : "AN";
  tokenType = (age <=5 || age >= 60) ? "AP" : "AN";
  tokenType = (gender === "Female" && age >= 55) ? "AP" : "AN";
} else {
  // WALK-IN
  if (longDistance) {
    tokenType = "WL";
  }
  // } else if (divyang === "Yes") {
  //   tokenType = "WP";
  // }
  else if(age <= 5 || age >= 60){
    tokenType = "WP";
  }  
  else if(gender === "Female" && (age <=5 || age >=55)){
    tokenType = "WP";
  }
  else {
    tokenType = "WN";
  }
}
    const { token, priority } = await generateDailyToken(
      name,
      mobile,
      aadhaar_last4,
      bookingDate,
      age,
      gender,
      divyang,
      mode,
      tokenType
    );

    //const priority =
      //token.includes("-AP-") || token.includes("-WP-") ? "P" : "N";

    // =========================
    // 6️⃣ INSERT TOKEN
    // =========================
    await new Promise((resolve, reject) => {
      db.run(
        `
        INSERT INTO tokens
        (
          token, name, mobile, aadhaar_last4,
          age, gender, divyang,
          district, service_type, qrc,
          date, mode, priority,device_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          token,
          name,
          mobile,
          aadhaar_last4,
          age,
          gender,
          divyang,
          district,
          service_type,
          qrc,
          bookingDate,
          mode,
          priority,
          device_id
        ],
        err => err ? reject(err) : resolve()
      );
    });

    // =========================
    // COMMIT
    // =========================
    await new Promise((resolve, reject) =>
      db.run("COMMIT", err => err ? reject(err) : resolve())
    );

    res.status(201).json({
      message: "Token generated successfully",
      token,
      date: bookingDate,
      mode,
      priority
    });

  } catch (err) {
    // =========================
    // ROLLBACK
    // =========================
    await new Promise(resolve =>
      db.run("ROLLBACK", () => resolve())
    );

    console.error("Booking failed:", err.message);
    res.status(400).json({ message: err.message });
  }
};
