AI_JUDGE_APP - Backend

Node + Express scaffold for the AI Judge app.

Quick start (PowerShell):

cd backend; npm install
# create a .env file with MONGO_URI if you want MongoDB
npm run dev

Available routes:
- GET  / -> status
- POST /api/auth/register -> register (placeholder)
- POST /api/auth/login -> login (placeholder)
- GET  /api/problems -> list problems
- POST /api/problems -> create problem
- POST /api/submissions -> submit code
- GET  /api/submissions/:id -> get submission

Notes:
- This scaffold uses in-memory stores for problems/submissions for demo.
- Add real authentication, persistent DB models, and a secure judge worker for production.

Quick commands (PowerShell):

cd c:\Users\mohdh\OneDrive\Desktop\AI_JUDGE_25\backend; npm install; npm run dev

Recommended next steps:
- Add `models/` with Mongoose schemas for User, Problem, Submission.
- Replace placeholder auth with JWT + bcrypt.
- Implement a sandboxed judge worker (Docker, chroot, or external service).
