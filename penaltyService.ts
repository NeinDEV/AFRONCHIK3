import { pool } from "../db/pool";
import { WorkSchedule } from "../types";

export async function addSchedule(
  employeeId: number,
  shiftStart: string, // "HH:mm"
  shiftEnd: string, // "HH:mm"
  shiftOrder: number
): Promise<WorkSchedule> {
  const crossesMidnight = shiftEnd <= shiftStart;
  const res = await pool.query<WorkSchedule>(
    `INSERT INTO work_schedules (employee_id, shift_start, shift_end, crosses_midnight, shift_order)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [employeeId, shiftStart, shiftEnd, crossesMidnight, shiftOrder]
  );
  return res.rows[0];
}

export async function getSchedulesForEmployee(
  employeeId: number
): Promise<WorkSchedule[]> {
  const res = await pool.query<WorkSchedule>(
    `SELECT * FROM work_schedules
     WHERE employee_id = $1 AND is_active = TRUE
     ORDER BY shift_order ASC`,
    [employeeId]
  );
  return res.rows;
}

export async function getScheduleByOrder(
  employeeId: number,
  shiftOrder: number
): Promise<WorkSchedule | null> {
  const res = await pool.query<WorkSchedule>(
    `SELECT * FROM work_schedules
     WHERE employee_id = $1 AND shift_order = $2 AND is_active = TRUE
     LIMIT 1`,
    [employeeId, shiftOrder]
  );
  return res.rows[0] ?? null;
}

export async function clearSchedules(employeeId: number): Promise<void> {
  await pool.query(
    `UPDATE work_schedules SET is_active = FALSE WHERE employee_id = $1`,
    [employeeId]
  );
}
