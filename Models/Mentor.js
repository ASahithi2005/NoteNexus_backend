import mongoose from "mongoose";

const mentorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "mentor" }, 
  createdCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }]
});

const Mentor = mongoose.model("Mentor", mentorSchema);
export default Mentor;
