import { Router } from 'express';
import { db } from '../db.js';
import { auth, admin } from '../auth.js';

const router = Router();
router.get('/', auth, admin, (req, res) => res.json(db.prepare('SELECT id,name,class_name AS class,marks,status,parent_email,parent_phone FROM students ORDER BY name').all()));
router.get('/:id/history', auth, (req, res) => {
  if (req.user.role === 'student' && req.user.studentId !== req.params.id) return res.status(403).json({ error: 'Forbidden', code: 'FORBIDDEN' });
  res.json(db.prepare('SELECT * FROM events WHERE student_id = ? ORDER BY created_at DESC').all(req.params.id));
});
export default router;
