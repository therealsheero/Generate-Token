const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/booking.controller");
const timeWindow = require("../middlewares/timeWindow.middleware");

router.post("/generate-token", timeWindow, bookingController.generateToken);

module.exports = router;
