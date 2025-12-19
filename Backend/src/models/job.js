const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    company: { type: String, required: true },
    location: { type: String, required: true },
    type: {
      type: String,
      enum: ["Internship", "Full-time", "Part-time"],
      required: true,
    },
    salary: String,
    skills: [String],
    description: String,
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    deadline: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", jobSchema);
