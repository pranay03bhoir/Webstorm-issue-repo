const mongoose = require("mongoose");
const Counter = require("./counterStudent.model");
const studentSchema = new mongoose.Schema(
  {
    studentId: { type: String, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    contact: { type: String, required: true },
    parentsContact: [{ type: String, required: true }],
    address: { type: String, required: true },
    currentStd: { type: String, default: "" },
    role: { type: String, default: "student" },
    isVerified: { type: Boolean, default: false },
    isAdmitted: { type: Boolean, default: false },
    profileImage: { type: String, default: "" }, // Stored in AWS S3
    subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subject" }],
    batches: [{ type: mongoose.Schema.Types.ObjectId, ref: "Batch" }],
    attendance: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Attendance",
      },
    ],
    scores: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Score",
      },
    ],
    refreshToken: { type: String, default: "" },
    admissionYear: { type: Number, required: true },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

studentSchema.index({ name: "text", email: "text", studentId: "text" });

studentSchema.pre("save", async function (next) {
  if (!this.studentId) {
    const year = this.admissionYear;
    const counter = await Counter.findOneAndUpdate(
      {
        name: `Student-${year}`,
      },
      { $inc: { seq: 1 } },
      { new: true, upsert: true, runValidators: true }
    );
    this.studentId = `STU-${year}-${String(counter.seq).padStart(4, "0")}`;
  }
  next();
});

module.exports = mongoose.model("Student", studentSchema);
