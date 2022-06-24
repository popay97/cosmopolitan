import mongoose,{model,Schema} from "mongoose";

const ReservationSchema = new Schema({
    resId:{
        type: String
    },
    status: {
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
    arrivalAirport: {
        type: String
    },
    arrivalDate: Date,
    arrivalFlight: {
        number: String,
        arrTime: String,
        depAirport: String,
    },
    depDate: Date,
    departureFlight:{
        number: String,
        arrAirport: String,
        depTime: String,
    },
    transfer: String,
    accomCd: String,
    accom: String,
    resort: String,
    price: Number,
},{collection:"reservation",Strings:true,validateBeforeSave:false});

ReservationSchema.set('toObject', {virtuals: true});
ReservationSchema.set('toJSON', {virtuals: true});
export default model("Reservations",ReservationSchema)