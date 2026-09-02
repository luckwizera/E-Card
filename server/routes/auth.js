import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { signUser, auth } from '../auth.js';
import { loginSchema, validate } from '../validation.js';

const router = Router();
router.post('/login', validate(loginSchema), (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(req.body.email);
  if (!user || !bcrypt.compareSync(req.body.password, user.password_hash)) return res.status(401).json({ error: 'Invalid credentials', code: 'LOGIN_FAILED' });
  res.cookie('ecard', signUser(user), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 8 * 60 * 60 * 1000 });
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, studentId: user.student_id } });
});
router.post('/logout', (req, res) => { res.clearCookie('ecard'); res.json({ ok: true }); });
router.get('/me', auth, (req, res) => res.json(req.user));
export default router;
