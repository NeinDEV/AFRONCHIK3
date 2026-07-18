import { SeasonSetting } from "../types";

export interface DailyPayResult {
  workedHours: number;
  regularHours: number;
  overtimeHours: number;
  regularPay: number;
  overtimePay: number;
  totalPay: number;
}

/**
 * Bitta kun uchun ish haqini hisoblaydi.
 *
 * Qoida (texnik topshiriqqa ko'ra):
 *  - Yozgi mavsum: kamida 10 soat, soatiga 6500 so'm, 10 soatdan oshgan
 *    har bir soat uchun 7000 so'm.
 *  - Qishki mavsum: kamida 9 soat, Admin belgilagan tarif, 9 soatdan
 *    oshgan vaqt uchun qo'shimcha tarif.
 *
 * Ikkala mavsum uchun ham tariflar `season_settings` jadvalidan
 * dinamik olinadi, shunda Admin istalgan vaqtda o'zgartira oladi.
 */
export function calculateDailyPay(
  workedHours: number,
  season: SeasonSetting
): DailyPayResult {
  const minHours = Number(season.min_hours_per_day);
  const baseRate = Number(season.base_rate_per_hour);
  const overtimeRate = Number(season.overtime_rate_per_hour);

  const regularHours = Math.min(workedHours, minHours);
  const overtimeHours = Math.max(0, workedHours - minHours);

  const regularPay = round2(regularHours * baseRate);
  const overtimePay = round2(overtimeHours * overtimeRate);

  return {
    workedHours,
    regularHours,
    overtimeHours,
    regularPay,
    overtimePay,
    totalPay: round2(regularPay + overtimePay),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
