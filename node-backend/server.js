import dotenv from 'dotenv';
dotenv.config();
import https from 'https';
import axios from 'axios';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

import authRoutes from './routes/auth.js';
import debateRoutes from './routes/debates.js';
import problemsRoutes from './routes/problems.js';
import submissionsRoutes from './routes/submissions.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/debates', debateRoutes);
app.use('/api/problems', problemsRoutes);
app.use('/api/submissions', submissionsRoutes);

// Health check route
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'AI Debate Judge API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something broke!' });
});

async function start() {
  try {
    console.log('Starting server...',process.env.MONGODB_URI);
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai-debate-judge';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    app.listen(PORT, () => console.log(`Server listening on port ${PORT}`))
  } catch (err) {
    console.error('Failed to start server', err)
    process.exit(1)
  }
}

start()