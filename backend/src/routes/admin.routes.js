const express = require("express");
const router = express.Router();

const adminController = require("../controllers/admin.controller");
const adminAuth = require("../middlewares/adminAuth");

router.post("/login", adminController.adminLogin);

// ✅ CALENDAR OVERVIEW (MISSING BEFORE)
router.get("/calendar", adminAuth, adminController.getCalendarOverview);

// ✅ TOKENS BY DATE
router.get("/tokens", adminAuth, adminController.getTokensByDate);
router.get("/dashboard", adminAuth, adminController.getDateDashboard);
// ✅ EXPORT CSV
//router.get("/export-csv", adminAuth, adminController.exportTodayCSV);

module.exports = router;
