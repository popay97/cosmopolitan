import mongoose,{model,Schema} from "mongoose";

const ReservationSchema = new Schema({
    resId:{
        type: String
    },
    Title: {

    }

},{collection:"passanger",timestamps:true,validateBeforeSave:false});

ReservationSchema.set('toObject', {virtuals: true});
ReservationSchema.set('toJSON', {virtuals: true});
export default model("Reservations",ReservationSchema)