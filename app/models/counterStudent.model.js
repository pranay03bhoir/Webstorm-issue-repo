const mongoose = require("mongoose");

const counterStudentSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 },
});

const Counter = mongoose.model("CounterStudent", counterStudentSchema);
module.exports = Counter;
