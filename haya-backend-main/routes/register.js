const express = require("express");
const router = express.Router();
const registerController = require("../controllers/registerController");

router.post("/", registerController.handleNewBusiness);
router.get("/verify-email/:token", registerController.handleVerifyEmail);

module.exports = router;
