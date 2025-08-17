import mongoose from "mongoose";

const fileSchema = new mongoose.Schema({
  title: { type: String, required: true },           // file title or original name
  fileUrl: { type: String, required: true },         // path/url to the file
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, refPath: 'uploadedByModel', required: true }, // uploader ID
  uploadedByModel: { type: String, enum: ['Mentor', 'Student'], required: true }, // ref model
  role: { type: String, enum: ['mentor', 'student'], required: true },           // uploader role
  type: { type: String, enum: ['question', 'answer', 'file'], default: 'file' }, // file type (assignments only)
  uploadedAt: { type: Date, default: Date.now },
  summary: {
    type: String,
    default: undefined // present only if added
  }
});

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Mentor" },
  mentorName: { type: String, required: true },
  color: { type: String, required: true },
  colorName: { type: String, required: true },
  studentsEnrolled: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }],

  syllabus: [fileSchema],
  notes: [fileSchema],
  assignments: [fileSchema],  // holds both questions and answers
});

const Course = mongoose.model("Course", courseSchema);
export default Course;
