import 'dotenv/config';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import bcrypt from 'bcryptjs';
import { db } from '../server/db.js';

const rl = readline.createInterface({ input, output });
try {
  const name = (await rl.question('Administrator name: ')).trim();
  const email = (await rl.question('Administrator email: ')).trim().toLowerCase();
  const password = await rl.question('Administrator password (min 8 chars): ', { hideEchoBack: true });
  if (!name || !email || password.length < 8) throw new Error('Name, email and an 8+ character password are required');
  const hash = await bcrypt.hash(password, 12);
  db.prepare('INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,?)').run(name, email, hash, 'admin');
  console.log(`Administrator ${email} created.`);
} finally {
  rl.close();
  db.close();
}
