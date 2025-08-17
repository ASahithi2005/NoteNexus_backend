import express from 'express';
import Note from '../Models/Note.js';
import auth from '../middleware/auth.js'; // Your existing middleware to verify user

const router = express.Router();

// Create Note
router.post('/add', auth, async (req, res) => {
  try {
    const { title, description } = req.body;
    const newNote = new Note({
      userId: req.user.id,
      title,
      description
    });
    await newNote.save();
    res.status(201).json(newNote);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get Notes for a user
router.get('/', auth, async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.user.id });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update Note
router.put('/:id', auth, async (req, res) => {
  try {
    const updatedNote = await Note.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    );
    res.json(updatedNote);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete Note
router.delete('/:id', auth, async (req, res) => {
  try {
    await Note.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    res.json({ message: 'Note deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
