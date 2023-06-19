const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.post("/", authController.handleLogin);
router.post("/forgot-password", authController.handleForgotPassword);
router.post("/reset-password/:token", authController.handleResetPassword);

module.exports = router;
