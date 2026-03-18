const express = require("express");
const router = express.Router();

const adminController = require("../controllers/admin.controller");
const adminAuth = require("../middlewares/adminAuth");

router.post("/login", adminController.adminLogin);
router.get("/calendar", adminAuth, adminController.getCalendarOverview);
router.get("/tokens", adminAuth, adminController.getTokensByDate);
router.get("/dashboard", adminAuth, adminController.getDateDashboard);
//router.get("/export-csv", adminAuth, adminController.exportTodayCSV);

module.exports = router;
