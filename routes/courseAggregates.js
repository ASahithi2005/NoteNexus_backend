import express from 'express';
import Course from '../Models/Course.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/assignments', auth, async (req, res) => {
  try {
    const assignments = await Course.aggregate([
      { $unwind: "$assignments" },
      { $match: { "assignments.type": "question" } },
      {
        $project: {
          _id: "$assignments._id",
          title: "$assignments.title",
          fileUrl: "$assignments.fileUrl",
          uploadedAt: "$assignments.uploadedAt",
          courseTitle: "$title"
        }
      },
      { $sort: { uploadedAt: -1 } }
    ]);

    res.status(200).json(assignments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get('/notes', auth, async (req, res) => {
  try {
    const notes = await Course.aggregate([
      { $unwind: "$notes" },
      // Match any note type; you can filter here if needed, e.g. "type": "file"
      {
        $project: {
          _id: "$notes._id",
          title: "$notes.title",
          fileUrl: "$notes.fileUrl",
          uploadedAt: "$notes.uploadedAt",
          courseTitle: "$title"
        }
      },
      { $sort: { uploadedAt: -1 } }
    ]);

    res.status(200).json(notes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
