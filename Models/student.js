import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "student" }, 
  joinedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }]
});

const Student = mongoose.model("Student", studentSchema);
export default Student;
