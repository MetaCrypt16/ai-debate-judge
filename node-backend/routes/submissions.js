import express from 'express';

const router = express.Router();

// In-memory submissions for demo
let submissions = [];

router.post('/', (req, res) => {
  const { problemId, code, language, userId } = req.body;
  const id = `s${submissions.length + 1}`;
  const newSub = { id, problemId, code, language, userId, status: 'queued', result: null };
  submissions.push(newSub);

  // In a real app push to judge worker here; we'll simulate immediate accepted
  setTimeout(() => {
    newSub.status = 'done';
    newSub.result = { verdict: 'Accepted', stdout: '3\n' };
  }, 1500);

  res.status(202).json({ ok: true, submission: newSub });
});

router.get('/:id', (req, res) => {
  const s = submissions.find(x => x.id === req.params.id);
  if (!s) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, submission: s });
});

export default router;