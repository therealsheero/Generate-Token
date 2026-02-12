const express = require("express");
const router = express.Router();

const guardController = require("../controllers/guard.controller");
const guardAuth = require("../middlewares/guardAuth");

router.post("/login", guardController.guardLogin);
router.get("/today", guardAuth, guardController.getTodayTokens);
router.post("/visit", guardAuth, guardController.markVisited);
// router.post("/undo", guardAuth, guardController.undoVisited);
router.post("/undo-visit", guardAuth, guardController.undoVisited);

module.exports = router;
