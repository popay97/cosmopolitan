import bcrypt from 'bcryptjs';
import User from '../../../models/UserModel.js';
export default async function handler(req, res) {
    const { username, password, isAdmin, isSubcontractor,subcontractorCountry } = req.body;
    const user = await User.findOne({ userName: username });
    if (user) {
        return res.status(400).json({ message: 'User already exists' });
    }
    else{
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = new User({
            userName: username,
            password: hashedPassword,
            isAdmin: isAdmin,
            isSubcontractor: isSubcontractor,
            subcontractorCountry: subcontractorCountry
        });
        try {
            await newUser.save();  
            return res.status(201).json({ message: 'User created' });
        } catch (error) {
            return res.status(500).json({ error });
        }
    }

}
  