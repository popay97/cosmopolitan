import { String } from "mongodb";
import mongoose,{model,Schema} from "mongoose";

const ReservationSchema = new Schema({
    resId:{
        type: String
    },
    title:{
        type: String
    },  
    name:{
        type: String
    },
    surname:{
        type: String
    },
    phone :{
        type: String
    },
    adults: Number,
    children: Number,
    infants: Number,
    booked: {
        type: Date
    },
    userCd:{
        type: String
    },
    arrivalAirport: {
        type: String
    },
    arrivalDate: Date,
    arrivalFlight: {
        number: String,
        arrTime: String,
        depTime: String,
        depAirport: String,
    },
    depDate: Date,
    departureFlight:{
        number: String,
        depAirport: String,
        arrAirport: String,
        depTime: String,
        arrTime: String

    },
    transferCd: String,
    transferType: String,
    accomCd: String,
    accom: String,
    resort: String,
    room: String,
    country: String

},{collection:"passanger",Strings:true,validateBeforeSave:false});

ReservationSchema.set('toObject', {virtuals: true});
ReservationSchema.set('toJSON', {virtuals: true});
export default model("Reservations",ReservationSchema)