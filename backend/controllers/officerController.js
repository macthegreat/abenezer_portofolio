import { query, withTransaction } from '../database/connection.js';
import { createCommissionMatchForRegistration, reportWindowSql } from '../services/commissionService.js';
import { forbidden } from '../utils/errors.js';

export async function registerUser(req, res) {
  const { fullName, idno, amount } = req.body;

  const officerLookup = await query('SELECT id FROM officers WHERE user_id = $1', [req.user.id]);
  const officer = officerLookup.rows[0];

  if (!officer) {
    throw forbidden('Officer profile missing.');
  }

  const normalizedIdno = idno.trim().toUpperCase();

  const result = await withTransaction(async (client) => {
    const registration = await client.query(
      `INSERT INTO registrations (officer_id, full_name, idno, amount)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [officer.id, fullName.trim(), normalizedIdno, Number(amount)]
    );

    const match = await createCommissionMatchForRegistration(
      registration.rows[0].id,
      normalizedIdno,
      client
    );

    return { registration: registration.rows[0], match };
  });

  return res.status(201).json(result);
}

export async function report(req, res) {
  const { window } = req.params;
  const filter = reportWindowSql(window);

  const officerLookup = await query('SELECT id FROM officers WHERE user_id = $1', [req.user.id]);
  const officer = officerLookup.rows[0];

  if (!officer) {
    throw forbidden('Officer profile missing.');
  }

  const summary = await query(
    `SELECT COUNT(*) AS registrations,
            COALESCE(SUM(amount), 0) AS revenue
     FROM registrations
     WHERE officer_id = $1 AND ${filter}`,
    [officer.id]
  );

  return res.json({ window, ...summary.rows[0] });
}
