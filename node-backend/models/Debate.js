import mongoose from 'mongoose';

const debateSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sideA: { type: String, required: true },
  sideB: { type: String, required: true },
  topic: { type: String, required: false },
  timeEnabled: { type: Boolean, default: false },
  timePerSide: { type: Number }, // time in seconds
  scoreA: { type: Number, required: true },
  scoreB: { type: Number, required: true },
  winner: { type: String, enum: ['Side A', 'Side B', 'Draw'], required: true },
  feedback: {
    sideA_feedback: {
      justification: { type: String, required: true },
      improvements: { type: String, required: true }
    },
    sideB_feedback: {
      justification: { type: String, required: true },
      improvements: { type: String, required: true }
    }
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Debate', debateSchema);