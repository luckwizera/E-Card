import { Router } from 'express';
import { db } from '../db.js';
import { auth, admin } from '../auth.js';
import { eventSchema, validate } from '../validation.js';

export function calculateConductStatus(marks) { return marks >= 18 ? 'Review' : marks >= 12 ? 'Watch' : 'Good'; }
const router = Router();
router.post('/', auth, admin, validate(eventSchema), (req, res) => {
  const { studentId, type, amount, reason, notifyParent } = req.body;
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
  if (!student) return res.status(404).json({ error: 'Student not found', code: 'STUDENT_NOT_FOUND' });
  const marks = Math.max(0, student.marks + (type === 'Appreciation' ? amount : -amount));
  const status = calculateConductStatus(marks);
  const now = new Date().toISOString();
  db.transaction(() => {
    db.prepare('UPDATE students SET marks = ?, status = ? WHERE id = ?').run(marks, status, studentId);
    db.prepare('INSERT INTO events(student_id,type,amount,reason,created_at,created_by,notified) VALUES(?,?,?,?,?,?,?)').run(studentId, type, amount, reason, now, req.user.id, notifyParent ? 1 : 0);
  })();
  res.json({ studentId, marks, status });
});
export default router;
