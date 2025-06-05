import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Task",
    required: true
  },
  date: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: true });

// Índices únicos compuestos
attendanceSchema.index(
  { user: 1, task: 1 },
  { unique: true, partialFilterExpression: { user: { $type: "objectId" } } }
);
attendanceSchema.index(
  { email: 1, task: 1 },
  { unique: true, partialFilterExpression: { email: { $type: "string" } } }
);

export default mongoose.model("Attendance", attendanceSchema);