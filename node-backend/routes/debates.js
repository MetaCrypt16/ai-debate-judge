import express from 'express';
import auth from '../middleware/auth.js';
import Debate from '../models/Debate.js';
import User from '../models/User.js';
import axios from 'axios';

const router = express.Router();

// Helper function to parse model response


// Get all debates for the authenticated user
router.get('/history', auth, async (req, res) => {
  try {
    const debates = await Debate.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(debates);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Submit a new debate for judging
router.post('/judge', auth, async (req, res) => {
  try {
    const { sideA, sideB ,topic } = req.body;

    if (!sideA || !sideB) {
      return res.status(400).json({ message: 'Both side A and side B arguments are required' });
    }
    console.log("Received debate for topic:",topic);
    console.log("Side A arguments:",sideA);
    console.log("Side B arguments:",sideB); 

    let sideAResponse, sideBResponse;
    try {
      console.log("Sending Side A arguments to model:",sideA);
      console.log("Topic:",topic);
      console.log(process.env.MODEL_URL)
      sideAResponse = await axios.post(process.env.MODEL_URL, { arguments: sideA, topic:topic});
      console.log("Side A model raw response:",sideAResponse.data);
      
    } catch (err) {
      console.error('Error calling model API for side A:', err.message);
      return res.status(500).json({ message: 'Error evaluating side A arguments' });
    }

    // Call model API for side B
    try {
      sideBResponse = await axios.post(process.env.MODEL_URL, { arguments: sideB, topic:topic });
      console.log("Side B model raw response:",sideBResponse.data);
    } catch (err) {
      console.error('Error calling model API for side B:', err.message);
      return res.status(500).json({ message: 'Error evaluating side B arguments' });
    }

    // Validate model outputs
    if (!sideAResponse.data.score || !sideBResponse.data.score) {
      return res.status(500).json({ message: 'Invalid model response - missing persuasiveness scores' });
    }

    // Extract scores and feedback
    const scoreA = sideAResponse.data.score;
    const scoreB = sideBResponse.data.score;

    // Determine winner based on persuasiveness scores
    let winner;
    if (scoreA > scoreB) {
      winner = 'Side A';
    } else if (scoreB > scoreA) {
      winner = 'Side B';
    } else {
      winner = 'Draw';
    }

    // Create feedback object with justification and improvements
    const feedback = {
      sideA_feedback: {
        justification: sideAResponse.data.justification || 'No justification provided',
        improvements: sideAResponse.data.improvements || 'No improvements suggested'
      },
      sideB_feedback: {
        justification: sideBResponse.data.justification || 'No justification provided',
        improvements: sideBResponse.data.improvements || 'No improvements suggested'
      }
    };

    // Create and save the new debate
    const debate = new Debate({
      user: req.user.id,
      topic,
      sideA,
      sideB,
      scoreA,
      scoreB,
      winner,
      feedback
    });

    await debate.save();

    // Return the complete debate data
    res.status(201).json({
      message: 'Debate judged successfully',
      debate: {
        id: debate._id,
        topic,
        sideA,
        sideB,
        scoreA,
        scoreB,
        winner,
        feedback,
        createdAt: debate.createdAt
      }
    });
  } catch (err) {
    console.error('Server error:', err.message);
    res.status(500).json({ message: 'Server error while processing debate' });
  }
});

// Get a specific debate by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const debate = await Debate.findById(req.params.id);
    if (!debate) {
      return res.status(404).json({ msg: 'Debate not found' });
    }

    // Check if the debate belongs to the authenticated user
    if (debate.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    res.json(debate);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Debate not found' });
    }
    res.status(500).send('Server Error');
  }
});

// Delete a debate
router.delete('/:id', auth, async (req, res) => {
  try {
    const debate = await Debate.findById(req.params.id);
    
    if (!debate) {
      return res.status(404).json({ message: 'Debate not found' });
    }

    // Check if user owns the debate
    if (debate.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to delete this debate' });
    }

    await debate.deleteOne();
    res.json({ message: 'Debate deleted successfully' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Debate not found' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
});

export default router;