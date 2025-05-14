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
    place: {  
      type: String,
      required: true,
    },
    responsible: {  
      type: [String], 
      required: false,
    },
    user: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
   
    isPromoted: {    // Nuevo campo para promoción
      type: Boolean,
      default: false
    },
   
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
