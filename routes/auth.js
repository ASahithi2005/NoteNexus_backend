import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Student from '../Models/student.js';
import Mentor from '../Models/Mentor.js';

const router = express.Router();

// Sign-up route
router.post('/signin', async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const existingUser = await (role === 'mentor' ? Mentor : Student).findOne({ email });
    if (existingUser) return res.status(400).json({ msg: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser =
      role === 'mentor'
        ? new Mentor({ name, email, password: hashedPassword, role })
        : new Student({ name, email, password: hashedPassword, role });

    await newUser.save();

    const token = jwt.sign({ id: newUser._id, role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: newUser._id, name: newUser.name, email: newUser.email, role } });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Login route
router.post('/login', async (req, res) => {
  const { email, password, role } = req.body;
  try {
    const user = await (role === 'mentor' ? Mentor : Student).findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

export default router;
