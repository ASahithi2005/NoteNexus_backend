import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

// Import routes
import authRoutes from './routes/auth.js';
import courseRoutes from './routes/courses.js';                
import assignmentRoutes from './routes/assignments.js'; 
import courseDetailRoutes from './routes/courseDetail.js';
import courseAggregates from './routes/courseAggregates.js';
import studentsRoutes from './routes/students.js';
import userRoutes from './routes/users.js';
import noteRoutes from './routes/noteRoutes.js';
// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/courseDetail', courseDetailRoutes);
app.use('/api/courseAggregates', courseAggregates);
app.use('/api/students', studentsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notes', noteRoutes);


app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/', (req, res) => {
  res.send('API is running...');
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));




