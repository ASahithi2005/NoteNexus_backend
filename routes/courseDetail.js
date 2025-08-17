import express from 'express';
import auth from '../middleware/auth.js';
import Course from '../Models/Course.js';
import Mentor from '../Models/Mentor.js';
import Student from '../Models/student.js';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dest = 'uploads/';
    const section = req.params.section;

    if (section === 'assignments') {
      dest += req.user.role === 'mentor'
        ? 'assignments/questions'
        : 'assignments/answers';
    } else if (section === 'notes') {
      dest += 'notes';
    } else if (section === 'syllabus') {
      dest += 'syllabus';
    } else {
      dest += 'others';
    }

    // Ensure directory exists
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/\s+/g, '-');
    cb(null, `${timestamp}-${safeName}`);
  },
});
const upload = multer({ storage });

// Helper to manually populate uploadedBy with Mentor or Student name
async function populateUploadedBy(files) {
  return Promise.all(
    files.map(async (file) => {
      if (!file.uploadedBy) return file;

      if (file.uploadedByModel === 'Mentor') {
        const mentor = await Mentor.findById(file.uploadedBy).select('name');
        file.uploadedBy = mentor;
      } else if (file.uploadedByModel === 'Student') {
        const student = await Student.findById(file.uploadedBy).select('name');
        file.uploadedBy = student;
      }
      return file;
    })
  );
}

/**
 * GET /api/courseDetail/:id
 * Get course details with uploader names populated manually
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ msg: 'Course not found' });

    const isMentor = req.user.role === 'mentor' && course.createdBy.toString() === req.user.id;
    const isStudent = req.user.role === 'student' && course.studentsEnrolled.some(s => s.toString() === req.user.id);

    if (!isMentor && !isStudent) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    course.syllabus = await populateUploadedBy(course.syllabus || []);
    course.notes = await populateUploadedBy(course.notes || []);
    course.assignments = await populateUploadedBy(course.assignments || []);

    res.status(200).json(course);
  } catch (err) {
    console.error('Get Course Detail Error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

/**
 * POST /api/courseDetail/:id/:section
 * Upload files for syllabus, notes, or assignments
 */
router.post('/:id/:section', auth, upload.single('file'), async (req, res) => {
  try {
    const { id, section } = req.params;
    if (!['syllabus', 'notes', 'assignments'].includes(section)) {
      return res.status(400).json({ msg: 'Invalid section. Must be syllabus, notes, or assignments.' });
    }

    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ msg: 'Course not found' });

    const isMentor = req.user.role === 'mentor' && course.createdBy.toString() === req.user.id;
    const isStudent = req.user.role === 'student' && course.studentsEnrolled.some(s => s.toString() === req.user.id);

    // Permission checks
    if ((section === 'syllabus' || section === 'notes') && !isMentor) {
      return res.status(403).json({ msg: 'Only mentors can upload syllabus or notes.' });
    }
    if (section === 'assignments' && !isMentor && !isStudent) {
      return res.status(403).json({ msg: 'Only enrolled students or mentors can upload assignments.' });
    }

    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }

    const fileType = section === 'assignments'
      ? (isMentor ? 'question' : 'answer')
      : 'file';

    course[section] = course[section] || [];
    course[section].push({
      title: req.body.title || req.file.originalname,
      fileUrl: req.file.path.replace(/\\/g, '/'),
      uploadedBy: req.user.id,
      uploadedByModel: req.user.role === 'mentor' ? 'Mentor' : 'Student',
      role: req.user.role,
      type: fileType,
      uploadedAt: new Date(),
    });

    await course.save();

    // Manually populate after saving
    course.syllabus = await populateUploadedBy(course.syllabus || []);
    course.notes = await populateUploadedBy(course.notes || []);
    course.assignments = await populateUploadedBy(course.assignments || []);

    res.status(200).json(course);
  } catch (err) {
    console.error('File Upload Error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

/**
 * PUT /api/courseDetail/:id/description
 * Mentor updates course description
 */
router.put('/:id/description', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { description } = req.body;

    if (!description) {
      return res.status(400).json({ msg: 'Description is required' });
    }

    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ msg: 'Course not found' });

    if (!(req.user.role === 'mentor' && course.createdBy.toString() === req.user.id)) {
      return res.status(403).json({ msg: 'Only the mentor can update description' });
    }

    course.description = description;
    await course.save();

    res.status(200).json(course);
  } catch (err) {
    console.error('Update Description Error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

/**
 * DELETE /api/courseDetail/:id/:section/:index
 * Mentor or student deletes a file from syllabus, notes, or assignments
 */
router.delete('/:id/:section/:index', auth, async (req, res) => {
  try {
    const { id, section, index } = req.params;
    if (!['syllabus', 'notes', 'assignments'].includes(section)) {
      return res.status(400).json({ msg: 'Invalid section.' });
    }

    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ msg: 'Course not found' });

    const idx = parseInt(index, 10);
    if (isNaN(idx) || idx < 0 || idx >= (course[section]?.length || 0)) {
      return res.status(400).json({ msg: 'Invalid index.' });
    }

    const fileEntry = course[section][idx];

    const isMentor = req.user.role === 'mentor' && course.createdBy.toString() === req.user.id;
    const isStudentOwner = req.user.role === 'student' && fileEntry.uploadedBy.toString() === req.user.id;

    if ((section === 'syllabus' || section === 'notes') && !isMentor) {
      return res.status(403).json({ msg: 'Only mentors can delete syllabus or notes.' });
    }
    if (section === 'assignments' && !isMentor && !isStudentOwner) {
      return res.status(403).json({ msg: 'Only mentors or the student who uploaded can delete this assignment.' });
    }

    // Delete physical file if exists
    if (fileEntry?.fileUrl) {
      let filePath = fileEntry.fileUrl;
      if (!filePath.startsWith('uploads')) {
        filePath = null;
      }
      if (filePath) {
        const fsPath = path.resolve(filePath);
        fs.unlink(fsPath, err => {
          if (err) console.warn('Could not delete file:', fsPath, err);
        });
      }
    }

    course[section].splice(idx, 1);
    await course.save();

    // Manually populate after delete
    course.syllabus = await populateUploadedBy(course.syllabus || []);
    course.notes = await populateUploadedBy(course.notes || []);
    course.assignments = await populateUploadedBy(course.assignments || []);

    res.status(200).json(course);
  } catch (err) {
    console.error('Delete File Error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

export default router;
