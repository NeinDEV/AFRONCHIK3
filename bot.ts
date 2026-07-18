import { pool } from "../db/pool";
import { Penalty, PenaltyRule } from "../types";

export async function getPenaltyRule(): Promise<PenaltyRule> {
  const res = await pool.query<PenaltyRule>(
    `SELECT * FROM penalty_rules ORDER BY id DESC LIMIT 1`
  );
  if (res.rows[0]) return res.rows[0];

  // Agar hech qanday qoida topilmasa, defaultni yaratamiz
  const created = await pool.query<PenaltyRule>(
    `INSERT INTO penalty_rules (grace_minutes, penalty_amount)
     VALUES (30, 30000) RETURNING *`
  );
  return created.rows[0];
}

export async function updatePenaltyRule(
  graceMinutes: number,
  penaltyAmount: number,
  changedBy: number
): Promise<PenaltyRule> {
  const old = await getPenaltyRule();
  const res = await pool.query<PenaltyRule>(
    `UPDATE penalty_rules
     SET grace_minutes = $1, penalty_amount = $2, updated_at = now()
     WHERE id = $3
     RETURNING *`,
    [graceMinutes, penaltyAmount, old.id]
  );
  await logSettingsChange(
    changedBy,
    "penalty_rule",
    { grace_minutes: old.grace_minutes, penalty_amount: old.penalty_amount },
    { grace_minutes: graceMinutes, penalty_amount: penaltyAmount }
  );
  return res.rows[0];
}

export async function createPenalty(
  employeeId: number,
  attendanceId: number,
  amount: number,
  reason: string
): Promise<Penalty> {
  const res = await pool.query<Penalty>(
    `INSERT INTO penalties (employee_id, attendance_id, amount, reason)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [employeeId, attendanceId, amount, reason]
  );
  return res.rows[0];
}

export async function cancelPenalty(
  penaltyId: number,
  adminId: number
): Promise<void> {
  await pool.query(
    `UPDATE penalties SET is_cancelled = TRUE, adjusted_by_admin_id = $2 WHERE id = $1`,
    [penaltyId, adminId]
  );
  await logSettingsChange(adminId, "penalty_cancelled", null, {
    penalty_id: penaltyId,
  });
}

export async function adjustPenaltyAmount(
  penaltyId: number,
  newAmount: number,
  adminId: number
): Promise<void> {
  const old = await pool.query<Penalty>(
    `SELECT * FROM penalties WHERE id = $1`,
    [penaltyId]
  );
  await pool.query(
    `UPDATE penalties SET amount = $2, adjusted_by_admin_id = $3 WHERE id = $1`,
    [penaltyId, newAmount, adminId]
  );
  await logSettingsChange(
    adminId,
    "penalty_adjusted",
    { amount: old.rows[0]?.amount },
    { amount: newAmount }
  );
}

export async function getPenaltiesForEmployee(
  employeeId: number,
  from?: string,
  to?: string
): Promise<Penalty[]> {
  if (from && to) {
    const res = await pool.query<Penalty>(
      `SELECT * FROM penalties
       WHERE employee_id = $1 AND created_at >= $2 AND created_at < $3
       ORDER BY created_at DESC`,
      [employeeId, from, to]
    );
    return res.rows;
  }
  const res = await pool.query<Penalty>(
    `SELECT * FROM penalties WHERE employee_id = $1 ORDER BY created_at DESC`,
    [employeeId]
  );
  return res.rows;
}

export async function logSettingsChange(
  changedBy: number,
  changeType: string,
  oldValue: unknown,
  newValue: unknown
): Promise<void> {
  await pool.query(
    `INSERT INTO settings_history (changed_by, change_type, old_value, new_value)
     VALUES ($1, $2, $3, $4)`,
    [changedBy, changeType, JSON.stringify(oldValue), JSON.stringify(newValue)]
  );
}
