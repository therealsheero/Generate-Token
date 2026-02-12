const db = require("../models/db");
const { ADMIN_USERNAME, ADMIN_PASSWORD } =
  require("../utils/admin.config");
const MASTER_SERVICES = [
  "DoB",
  "Name",
  "Aadhaar Suspended",
  "Advised to visit RO",
  "Gender",
  "None of the above"
];
exports.getTokensByDate = (req, res) => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ message: "Date required" });
  }

  db.all(
    `
    SELECT
      *,
      substr(token, -6, 3) AS token_count,
      substr(token, -2) AS token_type
    FROM tokens
    WHERE date = ?
    ORDER BY id ASC
    `,
    [date],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ message: "DB error" });
      }
      res.json(rows);
    }
  );
};


exports.adminLogin = (req, res) => {
  const { username, password } = req.body;

  if (
    username === ADMIN_USERNAME &&
    password === ADMIN_PASSWORD
  ) {
    return res.json({
      success: true,
      token: "ADMIN_TOKEN" 
    });
  }

  res.status(401).json({ message: "Invalid credentials" });
};
exports.getCalendarOverview = (req, res) => {
  const today = new Date();
  const start = new Date(today);
  const end = new Date(today);

  start.setDate(today.getDate() - 2);
  end.setDate(today.getDate() + 30);

  const startDate = start.toISOString().split("T")[0];
  const endDate = end.toISOString().split("T")[0];

  db.all(
    `
    SELECT
      date,
      appointment_booked,
      appointment_total,
      walkin_booked,
      walkin_total
    FROM daily_slots
    WHERE date BETWEEN ? AND ?
    ORDER BY date ASC
    `,
    [startDate, endDate],
    (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "DB error" });
      }
      res.json(rows);
    }
  );
};

exports.getDateDashboard = (req, res) => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ message: "Date required" });
  }

  // =========================
  // APPOINTMENT + WALKIN
  // =========================
  const summaryQuery = `
    SELECT
      mode,
      COUNT(*) AS total,
      SUM(CASE WHEN visited = 1 THEN 1 ELSE 0 END) AS visited,
      SUM(CASE WHEN visited = 0 THEN 1 ELSE 0 END) AS not_visited
    FROM tokens
    WHERE date = ?
    GROUP BY mode
  `;

  // =========================
  // GENDER
  // =========================
  const genderQuery = `
  SELECT
    gender,
    COUNT(*) AS total,
    SUM(CASE WHEN visited = 1 THEN 1 ELSE 0 END) AS visited,
    SUM(CASE WHEN visited = 0 THEN 1 ELSE 0 END) AS not_visited
  FROM tokens
  WHERE date = ?
  GROUP BY gender
`;


  // =========================
  // AGE GROUPS
  // =========================
  const ageQuery = `
  SELECT
    SUM(CASE WHEN age BETWEEN 0 AND 5 THEN 1 ELSE 0 END) AS age_0_5,
    SUM(CASE WHEN age BETWEEN 0 AND 5 AND visited = 1 THEN 1 ELSE 0 END) AS age_0_5_visited,
    SUM(CASE WHEN age BETWEEN 0 AND 5 AND visited = 0 THEN 1 ELSE 0 END) AS age_0_5_not,

    SUM(CASE WHEN age BETWEEN 6 AND 18 THEN 1 ELSE 0 END) AS age_6_18,
    SUM(CASE WHEN age BETWEEN 6 AND 18 AND visited = 1 THEN 1 ELSE 0 END) AS age_6_18_visited,
    SUM(CASE WHEN age BETWEEN 6 AND 18 AND visited = 0 THEN 1 ELSE 0 END) AS age_6_18_not,

    SUM(CASE WHEN age > 18 THEN 1 ELSE 0 END) AS age_18_plus,
    SUM(CASE WHEN age > 18 AND visited = 1 THEN 1 ELSE 0 END) AS age_18_plus_visited,
    SUM(CASE WHEN age > 18 AND visited = 0 THEN 1 ELSE 0 END) AS age_18_plus_not
  FROM tokens
  WHERE date = ?
`;


  // =========================
  // SERVICE TYPES
  // =========================
  const serviceQuery = `
    SELECT
      service_type,
      COUNT(*) AS total,
      SUM(CASE WHEN visited = 1 THEN 1 ELSE 0 END) AS visited,
      SUM(CASE WHEN visited = 0 THEN 1 ELSE 0 END) AS not_visited
    FROM tokens
    WHERE date = ?
    GROUP BY service_type
  `;
  const districtQuery = `
    SELECT
      district,
      COUNT(*) AS total
    FROM tokens
    WHERE date = ?
    AND visited = 1
    GROUP BY district
  `;

  db.all(summaryQuery, [date], (err, summaryRows) => {
    if (err) return res.status(500).json({ message: "DB error" });

    db.all(genderQuery, [date], (err, genderRows) => {
      if (err) return res.status(500).json({ message: "DB error" });

      db.get(ageQuery, [date], (err, ageRow) => {
        if (err) return res.status(500).json({ message: "DB error" });

        db.all(serviceQuery, [date], (err, serviceRows) => {
          if (err) return res.status(500).json({ message: "DB error" });
          
        db.all(districtQuery, [date], (err, districtRows) => {
              if (err) return res.status(500).json({ message: "DB error" });

          res.json({
            summary: summaryRows,
            gender: genderRows,
            age: ageRow,
            services: serviceRows,
            districts: districtRows
          });
          });
        });
      });
    });
  });
};


