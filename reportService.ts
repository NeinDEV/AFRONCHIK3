import { pool } from "../db/pool";
import { Season, SeasonSetting } from "../types";
import { formatDate } from "../utils/time";
import dayjs from "dayjs";

export async function upsertSeason(
  season: Season,
  startDate: string, // "YYYY-MM-DD"
  endDate: string,
  minHoursPerDay: number,
  baseRate: number,
  overtimeRate: number
): Promise<SeasonSetting> {
  // Eskisini o'chirib (deactivate), yangisini kiritamiz — tarixni saqlash uchun
  await pool.query(
    `UPDATE season_settings SET is_active = FALSE WHERE season = $1`,
    [season]
  );
  const res = await pool.query<SeasonSetting>(
    `INSERT INTO season_settings
       (season, start_date, end_date, min_hours_per_day, base_rate_per_hour, overtime_rate_per_hour)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [season, startDate, endDate, minHoursPerDay, baseRate, overtimeRate]
  );
  return res.rows[0];
}

export async function getActiveSeasons(): Promise<SeasonSetting[]> {
  const res = await pool.query<SeasonSetting>(
    `SELECT * FROM season_settings WHERE is_active = TRUE`
  );
  return res.rows;
}

/**
 * Berilgan sana qaysi mavsumga (yozgi/qishki) to'g'ri kelishini aniqlaydi.
 * Agar aniq sozlanmagan bo'lsa, null qaytaradi va chaqiruvchi tomon
 * standart qiymatlar bilan ishlashi kerak.
 */
export async function getSeasonForDate(
  date: string // "YYYY-MM-DD"
): Promise<SeasonSetting | null> {
  const seasons = await getActiveSeasons();
  const target = dayjs(date);

  for (const s of seasons) {
    const start = dayjs(s.start_date);
    const end = dayjs(s.end_date);
    // Yil bo'ylab davriylikni hisobga olmagan holda oddiy diapazon tekshiruvi
    if (
      (target.isAfter(start) || target.isSame(start, "day")) &&
      (target.isBefore(end) || target.isSame(end, "day"))
    ) {
      return s;
    }
  }
  return null;
}
