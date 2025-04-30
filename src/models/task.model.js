import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    place: {  // Nuevo campo: lugar de la actividad
      type: String,
      required: false,
    },
    responsible: {  // Nuevo campo: responsables
      type: [String], // Array de strings para múltiples responsables
      required: false,
    },
    user: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Task", taskSchema);
