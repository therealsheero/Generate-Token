const db = require("../models/db");
const { reserveSlot } = require("../services/slot.service");
const { generateDailyToken } = require("../services/token.service");

exports.generateToken = async (req, res) => {
  const {
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
    if (mode === "W") {
      bookingDate = new Date().toISOString().split("T")[0];
    } else {
      if (!selected_date) {
        throw new Error("Appointment date is required");
      }
      bookingDate = selected_date;
    }
    if (mode === "W" && selected_date) {
      throw new Error("Walk-in cannot have appointment date");
    }

    // =========================
    // 4️⃣ RESERVE SLOT
    // =========================
    await reserveSlot(bookingDate, mode);

    // =========================
    // 5️⃣ GENERATE TOKEN
    // =========================
    const token = await generateDailyToken(
      name,
      mobile,
      bookingDate,

      age,
      gender,
      divyang,
      mode
    );

    const priority =
      token.includes("-AP-") || token.includes("-WP-") ? "P" : "N";

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
          date, mode, priority
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
          priority
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
