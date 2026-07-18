import { Bot } from "grammy";
import { isAdmin } from "../../config";
import { startWizard } from "../wizard";

export function registerTariffHandlers(bot: Bot) {
  bot.callbackQuery("tariffs:summer", async (ctx) => {
    if (!isAdmin(ctx.from.id)) return ctx.answerCallbackQuery();
    startWizard(ctx.from.id, "tariff_summer", { season: "summer" });
    await ctx.reply(
      "☀️ Yozgi mavsum boshlanish sanasini kiriting (YYYY-MM-DD), masalan 2026-05-01:"
    );
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery("tariffs:winter", async (ctx) => {
    if (!isAdmin(ctx.from.id)) return ctx.answerCallbackQuery();
    startWizard(ctx.from.id, "tariff_winter", { season: "winter" });
    await ctx.reply(
      "❄️ Qishki mavsum boshlanish sanasini kiriting (YYYY-MM-DD), masalan 2026-11-01:"
    );
    await ctx.answerCallbackQuery();
  });
}
