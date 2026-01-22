const express = require("express");
const router = express.Router();
// const db = require("../models/db");
const adminController = require("../controllers/admin.controller");
const adminAuth = require("../middlewares/adminAuth");

// 🔐 LOGIN
router.post("/login", adminController.adminLogin);
router.get("/today", adminAuth, adminController.getTodayTokens);

// ✅ CSV export
router.get("/export-csv", adminAuth,adminController.exportTodayCSV);

module.exports = router;

// 📊 GET TODAY'S TOKENS (ADMIN)
// router.get("/today", (req, res) => {
//   const today = new Date().toISOString().split("T")[0];

//   db.all(
//     `SELECT *
//      FROM tokens
//      WHERE date = ?
//      ORDER BY id ASC`,
//     [today],
//     (err, rows) => {
//       if (err) {
//         return res.status(500).json({ message: "DB error" });
//       }
//       res.json(rows);
//     }
//   );
// });
// ✅ JSON for dashboard
