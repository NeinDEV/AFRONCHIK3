import { Bot } from "grammy";
import { isAdmin } from "../../config";
import { messages } from "../messages";
import {
  mainMenuKeyboard,
  employeesMenuKeyboard,
  reportsMenuKeyboard,
  tariffsMenuKeyboard,
  backToMainKeyboard,
} from "../keyboards";
import { getPenaltyRule } from "../../services/penaltyService";
import { getActiveSeasons } from "../../services/seasonService";
import { clearWizard, startWizard } from "../wizard";

export function registerMenuHandlers(bot: Bot) {
  bot.callbackQuery("menu:main", async (ctx) => {
    if (!isAdmin(ctx.from.id)) return ctx.answerCallbackQuery();
    clearWizard(ctx.from.id);
    await ctx.editMessageText(messages.mainAdminMenu, {
      reply_markup: mainMenuKeyboard,
    });
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery("menu:employees", async (ctx) => {
    if (!isAdmin(ctx.from.id)) return ctx.answerCallbackQuery();
    await ctx.editMessageText("👥 Xodimlar bo'limi:", {
      reply_markup: employeesMenuKeyboard,
    });
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery("menu:reports", async (ctx) => {
    if (!isAdmin(ctx.from.id)) return ctx.answerCallbackQuery();
    await ctx.editMessageText("📊 Qaysi davr uchun hisobot kerak?", {
      reply_markup: reportsMenuKeyboard,
    });
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery("menu:tariffs", async (ctx) => {
    if (!isAdmin(ctx.from.id)) return ctx.answerCallbackQuery();
    const seasons = await getActiveSeasons();
    let text = "💰 Joriy tariflar:\n";
    if (seasons.length === 0) {
      text += "\nHozircha hech qanday tarif sozlanmagan.";
    }
    for (const s of seasons) {
      text += `\n${s.season === "summer" ? "☀️ Yozgi" : "❄️ Qishki"}: ${s.start_date} — ${s.end_date}\nMin. soat: ${s.min_hours_per_day}, Asosiy tarif: ${s.base_rate_per_hour} so'm/soat, Qo'shimcha: ${s.overtime_rate_per_hour} so'm/soat\n`;
    }
    await ctx.editMessageText(text, { reply_markup: tariffsMenuKeyboard });
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery("menu:penalty_rules", async (ctx) => {
    if (!isAdmin(ctx.from.id)) return ctx.answerCallbackQuery();
    const rule = await getPenaltyRule();
    const text = `⚠️ Joriy jarima qoidasi:\n\nKechikish chegarasi: ${rule.grace_minutes} daqiqa\nJarima summasi: ${Number(rule.penalty_amount).toLocaleString("ru-RU")} so'm\n\nYangi qoida kiritish uchun "✏️ O'zgartirish" tugmasini bosing.`;
    const kb = backToMainKeyboard.clone().text("✏️ O'zgartirish", "penalty_rule:edit").row();
    await ctx.editMessageText(text, { reply_markup: kb });
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery("penalty_rule:edit", async (ctx) => {
    if (!isAdmin(ctx.from.id)) return ctx.answerCallbackQuery();
    startWizard(ctx.from.id, "penalty_rule");
    await ctx.reply("Kechikish chegarasini daqiqada kiriting (masalan 30):");
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery("menu:history", async (ctx) => {
    if (!isAdmin(ctx.from.id)) return ctx.answerCallbackQuery();
    await ctx.editMessageText(
      "📜 Davomat tarixini ko'rish uchun avval xodimni tanlang (👥 Xodimlar bo'limidan).",
      { reply_markup: backToMainKeyboard }
    );
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery("menu:settings", async (ctx) => {
    if (!isAdmin(ctx.from.id)) return ctx.answerCallbackQuery();
    await ctx.editMessageText(
      "⚙️ Sozlamalar bo'limi hozircha 💰 Tariflar va ⚠️ Jarima qoidalari orqali boshqariladi.",
      { reply_markup: backToMainKeyboard }
    );
    await ctx.answerCallbackQuery();
  });
}
