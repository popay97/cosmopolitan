import bcrypt from 'bcryptjs';
import User from '../../models/UserModel.js';
import jwt from 'jsonwebtoken';
export default async function handler(req, res) {
    const { username, password } = req.body;
    const user = await User.findOne({ userName: username }).lean();
    if (!user) {
        return res.status(401).json({ message: 'Invalid username or password' });
    }
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid username or password' });
    }
    const token = jwt.sign({ username: user.userName, isAdmin: user.isAdmin, isSubcontractor: user.isSubcontractor, subcontractorCountry: user.subcontractorCountry }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return res.status(200).json({access_token: token});
}
  