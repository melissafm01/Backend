import mongoose, { Types } from "mongoose";


const notificationSchema = new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    task:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task",
        required: true,
    },
    daysBefore:{
        type: Number,
        required: true,
    },
});

export default mongoose.model("Notification", notificationSchema);