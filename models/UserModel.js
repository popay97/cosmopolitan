import mongoose,{model,Schema} from "mongoose";

const UserSchema = new Schema({
    userName:{
        type: String
    },
    password:{
        type: String
    },
    lastLoggedIn:{
        type: Date
    },
    isAdmin:{
        type: Boolean
    },
    isSubcontractor:{
        type: Boolean
    },
    subcontractorCountry:{
        type: String
    },
},{collection:"user",Strings:true,validateBeforeSave:false, timestamps:true});

UserSchema.set('toObject', {virtuals: true});
UserSchema.set('toJSON', {virtuals: true});
export default (mongoose.models.User || mongoose.model("User", UserSchema));
