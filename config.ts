import { Bot } from "grammy";
import { isAdmin } from "../../config";
import { messages } from "../messages";
import { backToMainKeyboard } from "../keyboards";
import {
  buildAllEmployeesReport,
  getDayRange,
  getWeekRange,
  getMonthRange,
  saveMonthlyReport,
} from "../../services/reportService";
import { nowTashkent } from "../../utils/time";

async function sendReport(
  ctx: any,
  title: string,
  from: Date,
  to: Date,
  isMonthly = false
) {
  const summaries = await buildAllEmployeesReport(from, to);
  const period = `${from.toLocaleDateString("uz-UZ")} — ${to.toLocaleDateString("uz-UZ")}`;

  if (summaries.length === 0) {
    await ctx.reply(messages.reportEmpty, { reply_markup: backToMainKeyboard });
    return;
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
    if (isMonthly) {
      const monthStart = nowTashkent().startOf("month").format("YYYY-MM-DD");
      await saveMonthlyReport(s, monthStart);
    }
  }

  // Telegram xabar uzunligi cheklovi (4096) — uzun bo'lsa bo'lib yuboramiz
  const chunks = splitMessage(text, 3800);
  for (let i = 0; i < chunks.length; i++) {
    await ctx.reply(chunks[i], {
      parse_mode: "HTML",
      reply_markup: i === chunks.length - 1 ? backToMainKeyboard : undefined,
    });
  }
}

function splitMessage(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text];
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > maxLen) {
    let cutAt = remaining.lastIndexOf("\n", maxLen);
    if (cutAt <= 0) cutAt = maxLen;
    chunks.push(remaining.slice(0, cutAt));
    remaining = remaining.slice(cutAt);
  }
  if (remaining.length) chunks.push(remaining);
  return chunks;
}

export function registerReportHandlers(bot: Bot) {
  bot.callbackQuery("report:daily", async (ctx) => {
    if (!isAdmin(ctx.from.id)) return ctx.answerCallbackQuery();
    const { from, to } = getDayRange(nowTashkent());
    await ctx.answerCallbackQuery();
    await sendReport(ctx, "Kunlik hisobot", from, to);
  });

  bot.callbackQuery("report:weekly", async (ctx) => {
    if (!isAdmin(ctx.from.id)) return ctx.answerCallbackQuery();
    const { from, to } = getWeekRange(nowTashkent());
    await ctx.answerCallbackQuery();
    await sendReport(ctx, "Haftalik hisobot", from, to);
  });

  bot.callbackQuery("report:monthly", async (ctx) => {
    if (!isAdmin(ctx.from.id)) return ctx.answerCallbackQuery();
    const { from, to } = getMonthRange(nowTashkent());
    await ctx.answerCallbackQuery();
    await sendReport(ctx, "Oylik hisobot", from, to, true);
  });
}
