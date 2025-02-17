import asyncHandler from 'express-async-handler'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { User } from '../models/user.model.js'

function generateToken(userId) {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1800s' });
}

export const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
        res.status(401).json({ 'message': 'Unauthorized' });
        return;
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
        res.status(401).json({ 'message': 'Unauthorized' });
        return;
    }

    const token = generateToken(user._id);

    const userObj = user.toObject();
    res.status(200).json({
        id: userObj._id,
        username: userObj.username,
        email: userObj.email,
        token
    });
    });

    export const registerUser = asyncHandler(async (req, res) => {
    const { name, username, email, password } = req.body;

    if (!name || !username || !email || !password) {
        res.status(400).json({ 'error': 'All fields are required'});
        return;
    }

    const existingUser = await User.exists({ username: { $regex: username, $options: 'i' }});
    if (existingUser) {
        res.status(409).json({ 'error': 'Username already taken'});
        return;
    }

    const existingEmail = await User.exists({ email });
    if(existingEmail) {
        res.status(409).json({ 'error': 'Email already in use' });
        return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({ name, username, email , password: hashedPassword });

    res.status(201).json({ 'message': 'Successfully registered' });
});
