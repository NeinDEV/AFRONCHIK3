import { pool } from "../db/pool";
import { AttendanceRecord } from "../types";
import { nowTashkent, combineDateAndTime, diffMinutes, diffHours } from "../utils/time";
import { getScheduleByOrder } from "./scheduleService";
import { getPenaltyRule, createPenalty } from "./penaltyService";

/** Xodimning hozir ochiq turgan (yopilmagan) smenasini topadi */
export async function getOpenShift(
  employeeId: number
): Promise<AttendanceRecord | null> {
  const res = await pool.query<AttendanceRecord>(
    `SELECT * FROM attendance_records
     WHERE employee_id = $1 AND status = 'open'
     ORDER BY check_in_time DESC LIMIT 1`,
    [employeeId]
  );
  return res.rows[0] ?? null;
}

/** Bugun (Toshkent vaqti bo'yicha) xodim uchun nechta smena boshlangani */
async function countTodaysShifts(employeeId: number): Promise<number> {
  const startOfDay = nowTashkent().startOf("day").toDate();
  const endOfDay = nowTashkent().endOf("day").toDate();
  const res = await pool.query<{ count: string }>(
    `SELECT COUNT(*) FROM attendance_records
     WHERE employee_id = $1 AND check_in_time >= $2 AND check_in_time <= $3`,
    [employeeId, startOfDay, endOfDay]
  );
  return Number(res.rows[0].count);
}

export interface OpenShiftResult {
  record: AttendanceRecord;
  isLate: boolean;
  lateMinutes: number;
  penaltyApplied: boolean;
  penaltyAmount: number;
}

/**
 * Yangi smena ochadi (kirish). Kechikishni belgilangan ish jadvali bilan
 * solishtirib, agar kerak bo'lsa avtomatik jarima yozadi.
 */
export async function openShift(
  employeeId: number,
  videoFileId: string
): Promise<OpenShiftResult> {
  const now = nowTashkent();
  const shiftOrder = (await countTodaysShifts(employeeId)) + 1;
  const schedule = await getScheduleByOrder(employeeId, shiftOrder);

  let isLate = false;
  let lateMinutes = 0;

  if (schedule) {
    const plannedStart = combineDateAndTime(now, schedule.shift_start.slice(0, 5));
    const lateBy = diffMinutes(plannedStart, now);
    if (lateBy > 0) {
      lateMinutes = lateBy;
    }
  }

  const rule = await getPenaltyRule();
  const willBeLate = lateMinutes > rule.grace_minutes;

  const res = await pool.query<AttendanceRecord>(
    `INSERT INTO attendance_records
       (employee_id, check_in_time, check_in_video_file_id, is_late, late_minutes, status)
     VALUES ($1, $2, $3, $4, $5, 'open')
     RETURNING *`,
    [employeeId, now.toDate(), videoFileId, willBeLate, lateMinutes]
  );
  const record = res.rows[0];

  let penaltyApplied = false;
  const penaltyAmount = Number(rule.penalty_amount);

  if (willBeLate) {
    await createPenalty(
      employeeId,
      record.id,
      penaltyAmount,
      `${lateMinutes} daqiqa kechikish (smena ${shiftOrder})`
    );
    penaltyApplied = true;
  }

  return { record, isLate: willBeLate, lateMinutes, penaltyApplied, penaltyAmount };
}

export interface CloseShiftResult {
  record: AttendanceRecord;
  workedHours: number;
}

/** Ochiq smenani yopadi (chiqish) va ishlangan soatlarni hisoblaydi */
export async function closeShift(
  openRecord: AttendanceRecord,
  videoFileId: string
): Promise<CloseShiftResult> {
  const now = nowTashkent().toDate();
  const checkIn = openRecord.check_in_time as Date;
  const workedHours = diffHours(checkIn, now);

  const res = await pool.query<AttendanceRecord>(
    `UPDATE attendance_records
     SET check_out_time = $2, check_out_video_file_id = $3,
         worked_hours = $4, status = 'closed'
     WHERE id = $1
     RETURNING *`,
    [openRecord.id, now, videoFileId, workedHours]
  );

  return { record: res.rows[0], workedHours };
}

/** Berilgan kun oralig'ida yopilgan barcha smenalarni qaytaradi */
export async function getClosedShiftsInRange(
  employeeId: number,
  from: Date,
  to: Date
): Promise<AttendanceRecord[]> {
  const res = await pool.query<AttendanceRecord>(
    `SELECT * FROM attendance_records
     WHERE employee_id = $1 AND status = 'closed'
       AND check_in_time >= $2 AND check_in_time <= $3
     ORDER BY check_in_time ASC`,
    [employeeId, from, to]
  );
  return res.rows;
}

/** Uzoq vaqt (N soatdan ko'p) ochiq turgan barcha smenalarni topadi (anomaliya) */
export async function findStaleOpenShifts(
  hoursThreshold: number
): Promise<(AttendanceRecord & { full_name: string })[]> {
  const res = await pool.query<AttendanceRecord & { full_name: string }>(
    `SELECT ar.*, e.full_name FROM attendance_records ar
     JOIN employees e ON e.id = ar.employee_id
     WHERE ar.status = 'open'
       AND ar.check_in_time < now() - ($1 || ' hours')::interval`,
    [hoursThreshold]
  );
  return res.rows;
}
