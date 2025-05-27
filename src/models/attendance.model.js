import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false, // Para usuarios logueados
  },
  name: {
    type: String,
    required: function() { return !this.user; }, // Requerido para invitados
  },
  email: {
    type: String,
    required: function() { return !this.user; }, // Requerido para invitados
   lowercase: true,
   trime: true,
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Task",
    required: true
  },
  date: {
    type: Date,
    default: Date.now,
  },
  confirmed: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true, 
  // asegura  que no hayan duplicados
  statics: {
    async registerAttendance(data){
      
      const existing = await this.findOne({ 
        $or:[
          { user: data.user, task: data.task },
          { email: data.email, task: data.task }
        ]
       });
      if (existing) {
        throw new Error("Ya confirmaste asistencia a esta tarea");
      }
      return this.create(data);
    }
  }

});

export default mongoose.model("Attendance", attendanceSchema);
