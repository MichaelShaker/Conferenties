const express = require("express");
const { getChurches } = require("../controllers/churchController");

const router = express.Router();

router.get("/", getChurches);

module.exports = router;