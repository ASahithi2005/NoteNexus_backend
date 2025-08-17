import express from 'express';
import Course from '../Models/Course.js';
import auth from '../middleware/auth.js';
import Mentor from '../Models/Mentor.js';
import Student from '../Models/student.js';

const router = express.Router();

// Create a new course (Mentor only)
router.post('/create', auth, async (req, res) => {
  try {
    if (req.user.role !== 'mentor') {
      return res.status(403).json({ msg: 'Unauthorized' });
    }

    const { title, description, color, colorName } = req.body;
    if (!title || !description || !color || !colorName) {
      return res.status(400).json({ msg: 'Missing required fields' });
    }

    const mentor = await Mentor.findById(req.user.id);
    if (!mentor) {
      return res.status(404).json({ msg: 'Mentor not found' });
    }

    const course = new Course({
      title,
      description,
      createdBy: req.user.id,
      mentorName: mentor.name,
      color,
      colorName,
    });

    await course.save();

    // Link course to mentor's createdCourses array
    await Mentor.findByIdAndUpdate(req.user.id, {
      $push: { createdCourses: course._id },
    });

    return res.status(201).json(course);
  } catch (err) {
    console.error('Create Course Error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Delete a course (mentor only, only creator can delete)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'mentor') {
      return res.status(403).json({ msg: 'Unauthorized' });
    }

    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ msg: 'Course not found' });
    }

    // Only creator mentor can delete
    if (course.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to delete this course' });
    }

    // Remove course
    await Course.findByIdAndDelete(req.params.id);

    // Remove course reference from mentor's createdCourses array
    await Mentor.findByIdAndUpdate(req.user.id, {
      $pull: { createdCourses: req.params.id },
    });

    // Optional: You might want to also remove the course from students' joinedCourses arrays
    // This is up to your design, here's an example:
    // await Student.updateMany(
    //   { joinedCourses: req.params.id },
    //   { $pull: { joinedCourses: req.params.id } }
    // );

    return res.json({ msg: 'Course deleted successfully' });
  } catch (err) {
    console.error('Delete Course Error:', err);
    return res.status(500).json({ error: err.message });
  }
});


// Student joins a course
router.post('/join/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ msg: 'Unauthorized' });
    }

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ msg: 'Course not found' });
    }

    // Prevent duplicate join
    if (!course.studentsEnrolled.includes(req.user.id)) {
      course.studentsEnrolled.push(req.user.id);
      await course.save();

      await Student.findByIdAndUpdate(req.user.id, {
        $push: { joinedCourses: course._id },
      });
    }

    return res.json({ msg: 'Joined course successfully' });
  } catch (err) {
    console.error('Join Course Error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Get all courses with join info for students
router.get('/', auth, async (req, res) => {
  try {
    const courses = await Course.find().select(
      'title description mentorName color colorName studentsEnrolled createdBy'
    );

    if (req.user.role === 'student') {
      // Add joined field for students
      const responseCourses = courses.map(course => {
        const joined = course.studentsEnrolled.some(
          (s) => s.toString() === req.user.id
        );
        return {
          _id: course._id,
          title: course.title,
          description: course.description,
          mentorName: course.mentorName,
          color: course.color,
          colorName: course.colorName,
          createdBy: course.createdBy,
          joined,
        };
      });
      return res.json(responseCourses);
    }

    // For mentors or other roles, return full courses without joined flag
    return res.json(courses);
  } catch (err) {
    console.error('Fetch Courses Error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Get all students enrolled in a course (mentor only)
router.get('/:id/students', auth, async (req, res) => {
  try {
    if (req.user.role !== 'mentor') {
      return res.status(403).json({ msg: 'Unauthorized' });
    }

    const course = await Course.findById(req.params.id).populate(
      'studentsEnrolled',
      'name email'
    );

    if (!course) {
      return res.status(404).json({ msg: 'Course not found' });
    }

    if (course.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to view students of this course' });
    }

    return res.json({ students: course.studentsEnrolled });
  } catch (err) {
    console.error('Fetch Enrolled Students Error:', err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
