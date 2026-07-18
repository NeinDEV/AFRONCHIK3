import { Bot } from "grammy";
import { config, isAdmin } from "../../config";
import { messages } from "../messages";
import { getEmployeeByTelegramId } from "../../services/employeeService";
import { getOpenShift, openShift, closeShift } from "../../services/attendanceService";
import { formatTime } from "../../utils/time";
import { logger } from "../../utils/logger";

export function registerAttendanceHandler(bot: Bot) {
  bot.on(":video_note", async (ctx) => {
    const from = ctx.from;
    if (!from) return;

    // Admin video-note yuborsa, davomat tizimiga aralashmaymiz
    if (isAdmin(from.id)) return;

    const employee = await getEmployeeByTelegramId(from.id);
    if (!employee) {
      await ctx.reply(messages.employeeNotRegistered);
      return;
    }
    if (!employee.is_active) {
      await ctx.reply(messages.employeeInactive);
      return;
    }

    const videoFileId = ctx.message?.video_note?.file_id;
    if (!videoFileId) return;

    const openRecord = await getOpenShift(employee.id);

    try {
      if (openRecord) {
        // ===== CHIQISH (ketish) =====
        const { workedHours } = await closeShift(openRecord, videoFileId);
        await ctx.reply(
          messages.checkOutSuccess(
            employee.full_name,
            formatTime(new Date()),
            workedHours
          )
        );
        await forwardToAdmins(
          bot,
          employee.full_name,
          "Ketish",
          videoFileId,
          `⏱ Ishlangan vaqt: ${workedHours.toFixed(2)} soat`
        );
      } else {
        // ===== KIRISH (kelish) =====
        const result = await openShift(employee.id, videoFileId);
        await ctx.reply(
          messages.checkInSuccess(
            employee.full_name,
            formatTime(new Date()),
            result.isLate,
            result.lateMinutes
          )
        );
        const extra = result.isLate
          ? `⚠️ Kechikish: ${result.lateMinutes} daqiqa (jarima: ${result.penaltyAmount.toLocaleString("ru-RU")} so'm)`
          : undefined;
        await forwardToAdmins(bot, employee.full_name, "Kelish", videoFileId, extra);

        if (result.penaltyApplied) {
          await notifyAdminsPenalty(bot, employee.full_name, result.penaltyAmount, result.lateMinutes);
        }
      }
    } catch (err) {
      logger.error("Davomatni qayta ishlashda xato:", err);
      await ctx.reply(messages.genericError);
    }
  });
}

async function forwardToAdmins(
  bot: Bot,
  employeeName: string,
  type: "Kelish" | "Ketish",
  videoFileId: string,
  extra?: string
) {
  for (const adminId of config.adminIds) {
    try {
      await bot.api.sendVideoNote(adminId, videoFileId);
      await bot.api.sendMessage(
        adminId,
        messages.adminAttendanceForward(employeeName, type, formatTime(new Date()), extra),
        { parse_mode: "HTML" }
      );
    } catch (err) {
      logger.error(`Adminga (${adminId}) forward qilishda xato:`, err);
    }
  }
}

async function notifyAdminsPenalty(
  bot: Bot,
  employeeName: string,
  amount: number,
  lateMinutes: number
) {
  for (const adminId of config.adminIds) {
    try {
      await bot.api.sendMessage(
        adminId,
        messages.penaltyApplied(employeeName, amount, lateMinutes),
        { parse_mode: "HTML" }
      );
    } catch (err) {
      logger.error(`Adminga jarima xabarini yuborishda xato (${adminId}):`, err);
    }
  }
}
