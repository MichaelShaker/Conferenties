const express = require("express");
const { register, login, unsubscribe } = require("../controllers/authController");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/unsubscribe", unsubscribe);

module.exports = router;
