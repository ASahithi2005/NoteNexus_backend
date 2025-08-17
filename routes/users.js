// routes/users.js
import express from 'express';
import bcrypt from 'bcryptjs';
import Student from '../Models/student.js';
import Mentor from '../Models/Mentor.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Helper to choose the right model
function getUserModel(role) {
  return role === 'mentor' ? Mentor : Student;
}

/**
 * GET /api/users/me
 * Get current user’s profile (student or mentor)
 */
router.get('/me', auth, async (req, res) => {
  try {
    const Model = getUserModel(req.user.role);
    let query = Model.findById(req.user.id).select('-password');
    // only students have joinedCourses
    if (req.user.role === 'student') {
      query = query.populate('joinedCourses', 'title');
    }
    const user = await query;
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * PUT /api/users/me
 * Update current user’s name/email
 */
router.put('/me', auth, async (req, res) => {
  try {
    const { name, email } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;

    const Model = getUserModel(req.user.role);
    let query = Model.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (req.user.role === 'student') {
      query = query.populate('joinedCourses', 'title');
    }

    const user = await query;
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * PUT /api/users/change-password
 * Change password for current user
 */
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Both fields are required' });
    }

    const Model = getUserModel(req.user.role);
    const user = await Model.findById(req.user.id).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * DELETE /api/users/me
 * Delete current user’s account
 */
router.delete('/me', auth, async (req, res) => {
  try {
    const Model = getUserModel(req.user.role);
    const user = await Model.findByIdAndDelete(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Account deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
