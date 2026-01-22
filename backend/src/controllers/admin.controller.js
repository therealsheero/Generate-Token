const db = require("../models/db");
const { ADMIN_USERNAME, ADMIN_PASSWORD } =
  require("../utils/admin.config");
exports.getTodayTokens = (req, res) => {
  const today = new Date().toISOString().split("T")[0];

  db.all(
    `SELECT *
     FROM tokens
     WHERE date = ?
     ORDER BY id ASC`,
    [today],
    (err, rows) => {
      if (err) {
        console.error(err)
        return res.status(500).json({ message: "DB error" });
      }
      res.json(rows);
    }
  );
};

exports.exportTodayCSV = (req, res) => {
  const today = new Date().toISOString().split("T")[0];

  db.all(
    `
    SELECT
      date,
      token,
      qrc,
      name,
      mobile,
      district,
      service_type,
      gender,
      age,
      divyang,
      priority
    FROM tokens
    WHERE date = ?
    ORDER BY id ASC
    `,
    [today],
    (err, rows) => {
      if (err) {
        return res.status(500).send("DB error");
      }

      // CSV HEADER
      let csv =
        "Date,Token,QRC,Name,Mobile,District,Service Type,Gender,Age,PWD,Priority\n";

      rows.forEach(r => {
        csv +=
          `"${r.date}","${r.token}","${r.qrc}","${r.name}","${r.mobile}",` +
          `"${r.district}","${r.service_type}","${r.gender}",` +
          `"${r.age}","${r.divyang}","${r.priority}"\n`;
      });

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=tokens_${today}.csv`
      );

      res.send(csv);
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
      token: "ADMIN_AUTH_TOKEN" // simple token
    });
  }

  res.status(401).json({ message: "Invalid credentials" });
};

