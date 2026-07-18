import { pool } from "../db/pool";
import { Employee, Penalty } from "../types";
import { getClosedShiftsInRange } from "./attendanceService";
import { getSeasonForDate } from "./seasonService";
import { calculateDailyPay } from "./salaryService";
import { toTashkent, dayjs } from "../utils/time";
import { listActiveEmployees } from "./employeeService";

export interface EmployeeReportSummary {
  employee: Employee;
  totalWorkedHours: number;
  totalRegularPay: number;
  totalOvertimePay: number;
  totalSalary: number;
  totalPenalties: number;
  penaltyCount: number;
  lateCount: number;
  finalAmount: number;
  daysWorked: number;
}

/**
 * Berilgan xodim uchun [from, to) oralig'ida (Toshkent vaqti) to'liq
 * hisobot tayyorlaydi: ish kunlari bo'yicha guruhlab, har kun uchun
 * tegishli mavsum tarifi bilan ish haqini hisoblaydi.
 */
export async function buildEmployeeReport(
  employee: Employee,
  from: Date,
  to: Date
): Promise<EmployeeReportSummary> {
  const shifts = await getClosedShiftsInRange(employee.id, from, to);

  // Smenalarni kirish sanasi (Toshkent) bo'yicha kunlarga guruhlaymiz
  const hoursByDay = new Map<string, number>();
  for (const shift of shifts) {
    if (!shift.check_in_time || shift.worked_hours == null) continue;
    const day = toTashkent(shift.check_in_time).format("YYYY-MM-DD");
    const prev = hoursByDay.get(day) ?? 0;
    hoursByDay.set(day, prev + Number(shift.worked_hours));
  }

  let totalWorkedHours = 0;
  let totalRegularPay = 0;
  let totalOvertimePay = 0;

  for (const [day, hours] of hoursByDay.entries()) {
    const season = await getSeasonForDate(day);
    totalWorkedHours += hours;
    if (season) {
      const pay = calculateDailyPay(hours, season);
      totalRegularPay += pay.regularPay;
      totalOvertimePay += pay.overtimePay;
    }
    // Agar mavsum sozlanmagan bo'lsa, shu kun uchun to'lov 0 qoladi va
    // hisobotda buni Adminga alohida ko'rsatish kerak (frontendda eslatma)
  }

  const penaltiesRes = await pool.query<Penalty>(
    `SELECT * FROM penalties
     WHERE employee_id = $1 AND created_at >= $2 AND created_at < $3
       AND is_cancelled = FALSE`,
    [employee.id, from, to]
  );
  const totalPenalties = penaltiesRes.rows.reduce(
    (sum, p) => sum + Number(p.amount),
    0
  );

  const lateCountRes = await pool.query<{ count: string }>(
    `SELECT COUNT(*) FROM attendance_records
     WHERE employee_id = $1 AND is_late = TRUE
       AND check_in_time >= $2 AND check_in_time < $3`,
    [employee.id, from, to]
  );

  const totalSalary = round2(totalRegularPay + totalOvertimePay);
  const finalAmount = round2(totalSalary - totalPenalties);

  return {
    employee,
    totalWorkedHours: round2(totalWorkedHours),
    totalRegularPay: round2(totalRegularPay),
    totalOvertimePay: round2(totalOvertimePay),
    totalSalary,
    totalPenalties: round2(totalPenalties),
    penaltyCount: penaltiesRes.rows.length,
    lateCount: Number(lateCountRes.rows[0].count),
    finalAmount,
    daysWorked: hoursByDay.size,
  };
}

/** Barcha faol xodimlar uchun berilgan oraliqda hisobot to'plamini tayyorlaydi */
export async function buildAllEmployeesReport(
  from: Date,
  to: Date
): Promise<EmployeeReportSummary[]> {
  const employees = await listActiveEmployees();
  const results: EmployeeReportSummary[] = [];
  for (const emp of employees) {
    results.push(await buildEmployeeReport(emp, from, to));
  }
  return results;
}

/** Oylik hisobotni monthly_reports jadvaliga saqlab qo'yadi (kesh) */
export async function saveMonthlyReport(
  summary: EmployeeReportSummary,
  monthStart: string // "YYYY-MM-01"
): Promise<void> {
  await pool.query(
    `INSERT INTO monthly_reports
       (employee_id, month, total_hours, total_salary, total_penalties, final_amount)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (employee_id, month) DO UPDATE SET
       total_hours = EXCLUDED.total_hours,
       total_salary = EXCLUDED.total_salary,
       total_penalties = EXCLUDED.total_penalties,
       final_amount = EXCLUDED.final_amount,
       generated_at = now()`,
    [
      summary.employee.id,
      monthStart,
      summary.totalWorkedHours,
      summary.totalSalary,
      summary.totalPenalties,
      summary.finalAmount,
    ]
  );
}

export function getDayRange(date: dayjs.Dayjs) {
  return { from: date.startOf("day").toDate(), to: date.endOf("day").toDate() };
}

export function getWeekRange(date: dayjs.Dayjs) {
  return { from: date.startOf("week").toDate(), to: date.endOf("week").toDate() };
}

export function getMonthRange(date: dayjs.Dayjs) {
  return { from: date.startOf("month").toDate(), to: date.endOf("month").toDate() };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
