import { pool } from "../db/pool";
import { Employee } from "../types";

export async function createEmployee(
  telegramId: number,
  fullName: string,
  position: string
): Promise<Employee> {
  const res = await pool.query<Employee>(
    `INSERT INTO employees (telegram_id, full_name, position)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [telegramId, fullName, position]
  );
  return res.rows[0];
}

export async function getEmployeeByTelegramId(
  telegramId: number
): Promise<Employee | null> {
  const res = await pool.query<Employee>(
    `SELECT * FROM employees WHERE telegram_id = $1 AND is_active = TRUE`,
    [telegramId]
  );
  return res.rows[0] ?? null;
}

export async function getEmployeeById(id: number): Promise<Employee | null> {
  const res = await pool.query<Employee>(
    `SELECT * FROM employees WHERE id = $1`,
    [id]
  );
  return res.rows[0] ?? null;
}

export async function listActiveEmployees(): Promise<Employee[]> {
  const res = await pool.query<Employee>(
    `SELECT * FROM employees WHERE is_active = TRUE ORDER BY full_name ASC`
  );
  return res.rows;
}

export async function listAllEmployees(): Promise<Employee[]> {
  const res = await pool.query<Employee>(
    `SELECT * FROM employees ORDER BY is_active DESC, full_name ASC`
  );
  return res.rows;
}

export async function deactivateEmployee(id: number): Promise<void> {
  await pool.query(`UPDATE employees SET is_active = FALSE WHERE id = $1`, [
    id,
  ]);
}

export async function reactivateEmployee(id: number): Promise<void> {
  await pool.query(`UPDATE employees SET is_active = TRUE WHERE id = $1`, [
    id,
  ]);
}

export async function updateEmployeeName(
  id: number,
  fullName: string
): Promise<void> {
  await pool.query(`UPDATE employees SET full_name = $2 WHERE id = $1`, [
    id,
    fullName,
  ]);
}

export async function updateEmployeePosition(
  id: number,
  position: string
): Promise<void> {
  await pool.query(`UPDATE employees SET position = $2 WHERE id = $1`, [
    id,
    position,
  ]);
}

export async function rememberPendingUser(
  telegramId: number,
  username: string | undefined
): Promise<void> {
  await pool.query(
    `INSERT INTO pending_users (telegram_id, username)
     VALUES ($1, $2)
     ON CONFLICT (telegram_id) DO UPDATE SET username = EXCLUDED.username`,
    [telegramId, username ?? null]
  );
}
