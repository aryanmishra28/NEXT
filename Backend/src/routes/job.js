const express = require("express");
const router = express.Router();
const { getJobs, postJob } = require("../controllers/jobsController");
const auth = require("../middleware/auth"); // JWT middleware

router.get("/", getJobs);
router.post("/", auth, postJob);

module.exports = router;
