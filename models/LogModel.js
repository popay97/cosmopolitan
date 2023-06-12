import mongoose, { model, Schema } from "mongoose";

const LogSchema = new Schema({
    type: {
        type: String,
    },
    dateTimeStamp: {
        type: Date,
    },
    message: {
        type: String,
    },
},
    {
        collection: "Log",
        Strings: true,
        validateBeforeSave: false,
        timestamps: true,
    });

LogSchema.set("toObject", { virtuals: true });
LogSchema.set("toJSON", { virtuals: true });
export default (mongoose.models.Log || mongoose.model("Log", LogSchema));
