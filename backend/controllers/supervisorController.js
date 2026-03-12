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

    const agent = await client.query(
      `INSERT INTO agents (user_id, commission_per_person, created_by_supervisor)
       VALUES ($1, $2, $3)
       RETURNING id, commission_per_person`,
      [user.rows[0].id, Number(commissionPerPerson), req.user.id]
    );

    return { ...user.rows[0], agentId: agent.rows[0].id, commissionPerPerson: agent.rows[0].commission_per_person };
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
    `SELECT o.id AS officer_id,
            u.name AS officer_name,
            COUNT(r.id) AS total_registrations,
            COALESCE(SUM(r.amount), 0) AS total_revenue,
            COUNT(*) FILTER (WHERE r.created_at::date = CURRENT_DATE) AS daily_registrations,
            COUNT(*) FILTER (WHERE r.created_at >= date_trunc('week', NOW())) AS weekly_registrations,
            COUNT(*) FILTER (WHERE r.created_at >= date_trunc('month', NOW())) AS monthly_registrations
     FROM officers o
     JOIN users u ON u.id = o.user_id
     LEFT JOIN registrations r ON r.officer_id = o.id
     WHERE o.supervisor_id = $1
     GROUP BY o.id, u.name
     ORDER BY u.name`,
    [req.user.id]
  );

  const totals = await query(
    `SELECT COUNT(*) AS total_registrations,
            COALESCE(SUM(amount), 0) AS total_revenue,
            COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE) AS daily_registrations,
            COUNT(*) FILTER (WHERE created_at >= date_trunc('week', NOW())) AS weekly_registrations,
            COUNT(*) FILTER (WHERE created_at >= date_trunc('month', NOW())) AS monthly_registrations
     FROM registrations
     WHERE officer_id IN (SELECT id FROM officers WHERE supervisor_id = $1)`,
    [req.user.id]
  );

  return res.json({ officers: byOfficer.rows, totals: totals.rows[0] });
}

export async function listTeam(req, res) {
  const officers = await query(
    `SELECT o.id, u.name, u.email, o.created_at
     FROM officers o JOIN users u ON u.id = o.user_id
     WHERE o.supervisor_id = $1
     ORDER BY o.created_at DESC`,
    [req.user.id]
  );

  const agents = await query(
    `SELECT a.id, u.name, u.email, a.commission_per_person, a.created_at
     FROM agents a JOIN users u ON u.id = a.user_id
     WHERE a.created_by_supervisor = $1
     ORDER BY a.created_at DESC`,
    [req.user.id]
  );

  return res.json({ officers: officers.rows, agents: agents.rows });
}
