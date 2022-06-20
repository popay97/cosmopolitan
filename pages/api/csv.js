import {model,Schema} from 'mongoose';
import ReservationSchema from '../../models/ReservationModel'

export default function handler(req, res) {
   /*  const data = req.body;
    let objForSave = {};
    for(let i = 0;i<data.length;i++){
        const found = ReservationSchema.findOne({resId: data[i][0]})
        if(!found){
            let phone;
            if(data[i][4].startsWith("00")){
                phone = "+" + data[i][4].slice(2)
            }
            else{
                phone = "+" + data[i][4]
            }

            objforSave ={
                resId: data[i][0],
                title: data[i][1],
                name: data[i][2],
                surname: data[i][3],
                phone: phone

            }
        }
    } */
    res.status(200).json({ name: 'John Doe' })
  }