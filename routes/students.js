import express from 'express';
import Student from '../Models/student.js'; // Adjust path if needed
import auth from '../middleware/auth.js';    // optional, if you want to protect the route

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const students = await Student.find({}, 'name email joinedCourses').populate('joinedCourses', 'title');
    // Only select name, email, joinedCourses fields; populate joinedCourses with course titles

    res.status(200).json(students);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
