import bcrypt from 'bcryptjs';
import { query, withTransaction } from '../database/connection.js';
import { badRequest, notFound } from '../utils/errors.js';

export async function createOfficer(req, res) {
  const { name, email, password } = req.body;
  const passwordHash = await bcrypt.hash(password, 12);

  const created = await withTransaction(async (client) => {
    const user = await client.query(
      `INSERT INTO users (name, email, password_hash, role, supervisor_id)
       VALUES ($1, $2, $3, 'officer', $4)
       RETURNING id, name, email`,
      [name.trim(), email.toLowerCase(), passwordHash, req.user.id]
    );

    await client.query(
      `INSERT INTO officers (user_id, supervisor_id)
       VALUES ($1, $2)`,
      [user.rows[0].id, req.user.id]
    );

    return user.rows[0];
  });

  return res.status(201).json(created);
}

export async function createAgent(req, res) {
  const { name, email, password, commissionPerPerson } = req.body;
  const passwordHash = await bcrypt.hash(password, 12);

  const created = await withTransaction(async (client) => {
    const user = await client.query(
      `INSERT INTO users (name, email, password_hash, role, supervisor_id)
       VALUES ($1, $2, $3, 'agent', $4)
       RETURNING id, name, email`,
      [name.trim(), email.toLowerCase(), passwordHash, req.user.id]
    );

    await client.query(
      `INSERT INTO agents (user_id, commission_per_person, created_by_supervisor)
       VALUES ($1, $2, $3)`,
      [user.rows[0].id, Number(commissionPerPerson), req.user.id]
    );

    return user.rows[0];
  });

  return res.status(201).json(created);
}

export async function updateAgentCommission(req, res) {
  const { agentId } = req.params;
  const { commissionPerPerson } = req.body;
  const parsedAgentId = Number(agentId);
  if (!Number.isInteger(parsedAgentId) || parsedAgentId <= 0) {
    throw badRequest('Invalid agent id.');
  }

  const updated = await query(
    `UPDATE agents
     SET commission_per_person = $1
     WHERE id = $2 AND created_by_supervisor = $3
     RETURNING id, user_id, commission_per_person`,
    [Number(commissionPerPerson), parsedAgentId, req.user.id]
  );

  if (updated.rowCount === 0) {
    throw notFound('Agent not found under this supervisor.');
  }

  return res.json(updated.rows[0]);
}

export async function reports(req, res) {
  const byOfficer = await query(
    `SELECT u.name AS officer_name,
            COUNT(r.id) AS total_registrations,
            COALESCE(SUM(r.amount), 0) AS total_revenue
     FROM officers o
     JOIN users u ON u.id = o.user_id
     LEFT JOIN registrations r ON r.officer_id = o.id
     WHERE o.supervisor_id = $1
     GROUP BY u.name
     ORDER BY u.name`,
    [req.user.id]
  );

  return res.json({ officers: byOfficer.rows });
}
