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
      required:true,
    },
    responsible: {  // Nuevo campo: responsables
      type: [String], // Array de strings para múltiples responsables
      required: false,
    },
    user: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
    asistentes: [
      {
        type: mongoose.Types.ObjectId,
        ref: "User",
      },
    ],
    estado: {
      type: String,
      enum: ["todas","promocionadas"],
      default: "todas",
    },
  

    isPromoted: {    // Nuevo campo para promoción
      type: Boolean,
      default: false
    },
    // Configuración de la promoción (opcional)
    promotion: {
      startDate: {
        type: Date,
        default: null
      },
      // Fecha de fin de la promoción
      endDate: {
        type: Date,
        default: null 
      },
    }
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Task", taskSchema);