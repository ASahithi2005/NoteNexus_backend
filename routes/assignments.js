import express from 'express';
import auth from '../middleware/auth.js';

const router = express.Router();

let assignments = []; // You can replace with DB model later

router.post('/create', auth, (req, res) => {
  if (req.user.role !== 'mentor') return res.status(403).json({ msg: 'Unauthorized' });

  const { title, description, courseId } = req.body;
  const assignment = { id: Date.now(), title, description, courseId };
  assignments.push(assignment);

  res.status(201).json(assignment);
});

router.get('/:courseId', auth, (req, res) => {
  const courseAssignments = assignments.filter(a => a.courseId === req.params.courseId);
  res.json(courseAssignments);
});

export default router;
