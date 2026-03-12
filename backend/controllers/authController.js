import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../database/connection.js';
import { unauthorized } from '../utils/errors.js';
import { getEnv } from '../utils/env.js';

const env = getEnv();

export async function login(req, res) {
  const { email, password } = req.body;

  const result = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
  const user = result.rows[0];

  if (!user) {
    throw unauthorized('Invalid credentials.');
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    throw unauthorized('Invalid credentials.');
  }

  const token = jwt.sign(
    { id: user.id, role: user.role, supervisor_id: user.supervisor_id },
    env.jwtSecret,
    { expiresIn: '8h' }
  );

  return res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
}

export async function registerSupervisor(req, res) {
  const { name, email, password } = req.body;
  const passwordHash = await bcrypt.hash(password, 12);

  const result = await query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, 'supervisor')
     RETURNING id, name, email, role`,
    [name.trim(), email.toLowerCase(), passwordHash]
  );

  return res.status(201).json(result.rows[0]);
}
