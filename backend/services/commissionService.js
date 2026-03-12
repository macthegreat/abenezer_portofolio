import { query } from '../database/connection.js';

export async function createCommissionMatchForRegistration(registrationId, idno, dbClient = null) {
  const runQuery = dbClient ? dbClient.query.bind(dbClient) : query;

  const submissionResult = await runQuery(
    `SELECT s.id, s.agent_id, a.commission_per_person, r.officer_id, r.id AS registration_id
     FROM agent_submissions s
     JOIN agents a ON a.id = s.agent_id
     JOIN registrations r ON r.id = $1
     WHERE s.idno = $2
     LIMIT 1`,
    [registrationId, idno]
  );

  const submission = submissionResult.rows[0];
  if (!submission) return null;

  const insert = await runQuery(
    `INSERT INTO commission_matches
      (agent_submission_id, registration_id, agent_id, officer_id, commission_amount)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (registration_id) DO NOTHING
     RETURNING *`,
    [
      submission.id,
      submission.registration_id,
      submission.agent_id,
      submission.officer_id,
      submission.commission_per_person
    ]
  );

  return insert.rows[0] || null;
}

export async function createCommissionMatchForSubmission(submissionId, idno, dbClient = null) {
  const runQuery = dbClient ? dbClient.query.bind(dbClient) : query;

  const registrationResult = await runQuery(
    `SELECT s.id, s.agent_id, a.commission_per_person, r.officer_id, r.id AS registration_id
     FROM agent_submissions s
     JOIN agents a ON a.id = s.agent_id
     JOIN registrations r ON r.idno = $2
     WHERE s.id = $1
     LIMIT 1`,
    [submissionId, idno]
  );

  const data = registrationResult.rows[0];
  if (!data) return null;

  const insert = await runQuery(
    `INSERT INTO commission_matches
      (agent_submission_id, registration_id, agent_id, officer_id, commission_amount)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (agent_submission_id) DO NOTHING
     RETURNING *`,
    [data.id, data.registration_id, data.agent_id, data.officer_id, data.commission_per_person]
  );

  return insert.rows[0] || null;
}

export function reportWindowSql(window) {
  if (window === 'daily') return "created_at::date = CURRENT_DATE";
  if (window === 'weekly') return "created_at >= date_trunc('week', NOW())";
  return "created_at >= date_trunc('month', NOW())";
}
