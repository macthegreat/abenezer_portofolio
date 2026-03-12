import { query } from '../database/connection.js';

function normalizeIdno(value) {
  return value.trim().toUpperCase();
}

export async function idnoLookup(req, res) {
  const idno = normalizeIdno(req.params.idno);

  const submission = await query(
    `SELECT s.id, s.full_name, s.created_at, s.agent_id, u.name AS agent_name
     FROM agent_submissions s
     JOIN agents a ON a.id = s.agent_id
     JOIN users u ON u.id = a.user_id
     WHERE s.idno = $1
     LIMIT 1`,
    [idno]
  );

  const registration = await query(
    `SELECT r.id, r.full_name, r.amount, r.created_at, r.officer_id, u.name AS officer_name
     FROM registrations r
     JOIN officers o ON o.id = r.officer_id
     JOIN users u ON u.id = o.user_id
     WHERE r.idno = $1
     LIMIT 1`,
    [idno]
  );

  const match = await query(
    `SELECT id, commission_amount, created_at
     FROM commission_matches
     WHERE registration_id = (SELECT id FROM registrations WHERE idno = $1)
        OR agent_submission_id = (SELECT id FROM agent_submissions WHERE idno = $1)
     LIMIT 1`,
    [idno]
  );

  return res.json({
    idno,
    hasAgentSubmission: submission.rowCount > 0,
    hasRegistration: registration.rowCount > 0,
    isMatched: match.rowCount > 0,
    submission: submission.rows[0] || null,
    registration: registration.rows[0] || null,
    match: match.rows[0] || null
  });
}
