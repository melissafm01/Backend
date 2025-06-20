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
      required:true,
    },
    responsible: { 
      type: [String], 
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
    image:
      {
        type: String,
        default: null, // Campo para la URL de la imagen
      },
    estado: {
      type: String,
      enum: ["todas","promocionadas"],
      default: "todas",
    },

    status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },

  approvedAt: Date,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  rejectedAt: Date,
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  rejectionReason: String,

    isPromoted: {    //campo para promoción
      type: Boolean,
      default: false
    },
     promotion: {
      startDate: {
        type: Date,
        default: null
      },
   
      endDate: {
        type: Date,
        default: null 
      },
    }
  },
  {
    timestamps: true,
      toJSON: {
    virtuals: true
  }
  });

  // Índices para búsquedas rápidas
taskSchema.index({ title: 'text', description: 'text', place: 'text' });
taskSchema.index({ status: 1, isPromoted: 1 });
taskSchema.index({ date: 1 });
taskSchema.index({ user: 1 });

// Virtual para contar asistentes
taskSchema.virtual('attendeesCount', {
  ref: 'Attendance',
  localField: '_id',
  foreignField: 'task',
  count: true
});

export default mongoose.model("Task", taskSchema);