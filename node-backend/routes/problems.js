import express from 'express';

const router = express.Router();

// Simple in-memory store for demo
let problems = [
  { id: 'p1', title: 'Sum Two Numbers', difficulty: 'easy', description: 'Add two integers.' },
];

router.get('/', (req, res) => {
  res.json({ ok: true, problems });
});

router.get('/:id', (req, res) => {
  const p = problems.find(x => x.id === req.params.id);
  if (!p) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, problem: p });
});

router.post('/', (req, res) => {
  const { title, difficulty, description } = req.body;
  const id = `p${problems.length + 1}`;
  const newP = { id, title, difficulty, description };
  problems.push(newP);
  res.status(201).json({ ok: true, problem: newP });
});

export default router;