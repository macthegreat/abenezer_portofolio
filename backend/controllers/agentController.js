import { query } from '../database/connection.js';
import { reportWindowSql } from '../services/commissionService.js';
import { forbidden } from '../utils/errors.js';

async function findAgentByUserId(userId) {
  const result = await query('SELECT id FROM agents WHERE user_id = $1', [userId]);
  return result.rows[0];
}

function ensureAgentProfile(agent) {
  if (!agent) {
    throw forbidden('Agent profile missing.');
  }
}

export async function submitPerson(req, res) {
  const { fullName, idno } = req.body;
  const agent = await findAgentByUserId(req.user.id);
  ensureAgentProfile(agent);

  const normalizedIdno = idno.trim().toUpperCase();

  const submission = await query(
    `INSERT INTO agent_submissions (agent_id, full_name, idno)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [agent.id, fullName.trim(), normalizedIdno]
  );

  return res.status(201).json(submission.rows[0]);
}

export async function matches(req, res) {
  const agent = await findAgentByUserId(req.user.id);
  ensureAgentProfile(agent);

  const result = await query(
    `SELECT m.id, r.idno, m.commission_amount, m.created_at
     FROM commission_matches m
     JOIN registrations r ON r.id = m.registration_id
     WHERE m.agent_id = $1
     ORDER BY m.created_at DESC`,
    [agent.id]
  );

  return res.json(result.rows);
}

export async function commission(req, res) {
  const { window } = req.params;
  const filter = reportWindowSql(window);
  const agent = await findAgentByUserId(req.user.id);
  ensureAgentProfile(agent);

  const result = await query(
    `SELECT COUNT(*) AS matches,
            COALESCE(SUM(commission_amount), 0) AS commission
     FROM commission_matches
     WHERE agent_id = $1 AND ${filter}`,
    [agent.id]
  );

  return res.json({ window, ...result.rows[0] });
}
