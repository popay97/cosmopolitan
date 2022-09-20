import bcrypt from 'bcryptjs';
import User from '../../models/UserModel.js';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    const { username, password } = req.body;
    const user = await User.findOne({ userName: username });
    if (!user) {
        return res.status(401).json({ message: 'Invalid username or password' });
    }
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid username or password' });
    }
    const token = jwt.sign(JSON.parse(user), process.env.JWT_SECRET);
    return res.status(200).json({access_token: token});
}
  