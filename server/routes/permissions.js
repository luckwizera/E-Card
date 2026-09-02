import { Router } from 'express';
import crypto from 'node:crypto';
import { db } from '../db.js';
import { auth, admin } from '../auth.js';
import { permissionSchema, permissionStatusSchema, validate } from '../validation.js';

const router = Router();
router.post('/', auth, admin, validate(permissionSchema), (req, res) => {
  const { studentId, reason, outTime, backTime } = req.body;
  if (!db.prepare('SELECT 1 FROM students WHERE id = ?').get(studentId)) return res.status(404).json({ error: 'Student not found', code: 'STUDENT_NOT_FOUND' });
  const code = `EC-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  db.prepare('INSERT INTO permissions VALUES(?,?,?,?,?,?,?)').run(code, studentId, reason, outTime, backTime, 'Pending', new Date().toISOString());
  res.status(201).json(db.prepare('SELECT * FROM permissions WHERE code = ?').get(code));
});
router.get('/', auth, (req, res) => {
  const rows = req.user.role === 'student' ? db.prepare('SELECT * FROM permissions WHERE student_id = ? ORDER BY created_at DESC').all(req.user.studentId) : db.prepare('SELECT * FROM permissions ORDER BY created_at DESC').all();
  res.json(rows);
});
router.patch('/:code', auth, admin, validate(permissionStatusSchema), (req, res) => {
  db.prepare('UPDATE permissions SET status = ? WHERE code = ?').run(req.body.status, req.params.code);
  const row = db.prepare('SELECT * FROM permissions WHERE code = ?').get(req.params.code);
  if (!row) return res.status(404).json({ error: 'Permission card not found', code: 'PERMISSION_NOT_FOUND' });
  res.json(row);
});
export default router;
