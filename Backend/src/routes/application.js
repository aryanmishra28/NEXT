const express = require("express");
const router = express.Router();
const { applyJob } = require("../controllers/applicationController");
const auth = require("../middleware/auth");

router.post("/apply", auth, applyJob);

module.exports = router;
