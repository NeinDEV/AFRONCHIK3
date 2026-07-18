import cron from "node-cron";
import { Bot } from "grammy";
import { config } from "../config";
import { messages } from "../bot/messages";
import { TZ, nowTashkent } from "../utils/time";
import {
  buildAllEmployeesReport,
  getDayRange,
  getMonthRange,
  getWeekRange,
  saveMonthlyReport,
} from "../services/reportService";
import { findStaleOpenShifts } from "../services/attendanceService";
import { logger } from "../utils/logger";

async function sendToAllAdmins(bot: Bot, text: string) {
  for (const adminId of config.adminIds) {
    try {
      await bot.api.sendMessage(adminId, text, { parse_mode: "HTML" });
    } catch (err) {
      logger.error(`Cron: Adminga (${adminId}) xabar yuborishda xato:`, err);
    }
  }
}

function buildReportText(title: string, period: string, summaries: any[]) {
  if (summaries.length === 0) {
    return messages.reportHeader(title, period) + "\n" + messages.reportEmpty;
  }
  let text = messages.reportHeader(title, period);
  for (const s of summaries) {
    text += messages.employeeReportLine(
      s.employee.full_name,
      s.totalWorkedHours,
      s.totalSalary,
      s.totalPenalties,
      s.finalAmount
    );
  }
  return text;
}

export function startScheduler(bot: Bot) {
  // Har kuni soat 23:55 (Toshkent) da kunlik hisobot
  cron.schedule(
    "55 23 * * *",
    async () => {
      logger.info("Cron: kunlik hisobot generatsiya qilinmoqda...");
      const { from, to } = getDayRange(nowTashkent());
      const summaries = await buildAllEmployeesReport(from, to);
      const text = buildReportText(
        "Kunlik hisobot (avtomatik)",
        nowTashkent().format("DD.MM.YYYY"),
        summaries
      );
      await sendToAllAdmins(bot, text);
    },
    { timezone: TZ }
  );

  // Har yakshanba kuni 23:50 da haftalik hisobot
  cron.schedule(
    "50 23 * * 0",
    async () => {
      logger.info("Cron: haftalik hisobot generatsiya qilinmoqda...");
      const { from, to } = getWeekRange(nowTashkent());
      const summaries = await buildAllEmployeesReport(from, to);
      const text = buildReportText(
        "Haftalik hisobot (avtomatik)",
        `${nowTashkent().startOf("week").format("DD.MM")} — ${nowTashkent().endOf("week").format("DD.MM")}`,
        summaries
      );
      await sendToAllAdmins(bot, text);
    },
    { timezone: TZ }
  );

  // Har oyning oxirgi kuni 23:40 da oylik hisobot va keshga saqlash
  cron.schedule(
    "40 23 28-31 * *",
    async () => {
      const today = nowTashkent();
      const isLastDayOfMonth = today.add(1, "day").date() === 1;
      if (!isLastDayOfMonth) return;

      logger.info("Cron: oylik hisobot generatsiya qilinmoqda...");
      const { from, to } = getMonthRange(today);
      const summaries = await buildAllEmployeesReport(from, to);
      const monthStart = today.startOf("month").format("YYYY-MM-DD");
      for (const s of summaries) {
        await saveMonthlyReport(s, monthStart);
      }
      const text = buildReportText(
        "Oylik hisobot (avtomatik)",
        today.format("MMMM YYYY"),
        summaries
      );
      await sendToAllAdmins(bot, text);
    },
    { timezone: TZ }
  );

  // Har soatda: 12 soatdan ortiq ochiq qolgan smenalarni tekshirish (AI/anomaliya nazorati)
  cron.schedule(
    "0 * * * *",
    async () => {
      const stale = await findStaleOpenShifts(12);
      for (const shift of stale) {
        await sendToAllAdmins(bot, messages.staleShiftWarning(shift.full_name, 12));
      }
    },
    { timezone: TZ }
  );

  logger.info("Cron vazifalar (jadval bo'yicha ishlar) muvaffaqiyatli sozlandi ✅");
}
