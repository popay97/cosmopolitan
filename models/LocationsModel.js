import mongoose, { model, Schema } from "mongoose";

const LocationsSchema = new Schema({
    code: {
        type: String,
    },
    hotel: {
        type: String,
    },
    destination: {
        type: String,
    },
},
    {
        collection: "Locations",
        Strings: true,
        validateBeforeSave: false,
        timestamps: true,
    });

LocationsSchema.set("toObject", { virtuals: true });
LocationsSchema.set("toJSON", { virtuals: true });

export default (mongoose.models.Locations || mongoose.model("Locations", LocationsSchema));
