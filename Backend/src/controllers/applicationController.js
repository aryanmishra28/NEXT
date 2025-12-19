const Application = require("../models/application");
const User = require("../models/user");

// Apply to a job
exports.applyJob = async (req, res) => {
  try {
    const { jobId } = req.body;

    // prevent duplicate application
    const alreadyApplied = await Application.findOne({
      job: jobId,
      applicant: req.user.id,
    });

    if (alreadyApplied) {
      return res.status(400).json({
        success: false,
        message: "You already applied to this job",
      });
    }

    const application = await Application.create({
      job: jobId,
      applicant: req.user.id,
    });

    // increase application count for dashboard
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { applicationsCount: 1 },
    });

    res.status(201).json({
      success: true,
      message: "Job applied successfully",
      application,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
