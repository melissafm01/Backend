import mongoose, { Types } from "mongoose";

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    task: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task",
        required: true,
    },
    daysBefore: {
        type: Number,
        required: true,
    },
    type: {
        type: String,
        enum: ["recordatorio", "confirmación"],
        default: "recordatorio"
    },

    lastSentDate: {
        type: Date,
        default: null
    },
    sentCount: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Índice compuesto para evitar duplicados
notificationSchema.index({ user: 1, task: 1, daysBefore: 1 }, { unique: true });

export default mongoose.model("Notification", notificationSchema);