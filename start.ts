import { Bot } from "grammy";
import { config, isAdmin } from "../config";
import { messages } from "./messages";
import { mainMenuKeyboard } from "./keyboards";
import { registerStartHandler } from "./handlers/start";
import { registerMenuHandlers } from "./handlers/menu";
import { registerEmployeeHandlers } from "./handlers/employees";
import { registerTariffHandlers } from "./handlers/tariffs";
import { registerReportHandlers } from "./handlers/reports";
import { registerAttendanceHandler } from "./handlers/attendance";
import { registerTextHandler } from "./handlers/text";
import { logger } from "../utils/logger";

export function createBot(): Bot {
  const bot = new Bot(config.botToken);

  // /menu — Admin istalgan vaqtda asosiy menyuga qaytishi uchun
  bot.command("menu", async (ctx) => {
    if (!ctx.from || !isAdmin(ctx.from.id)) {
      await ctx.reply(messages.notAdmin);
      return;
    }
    await ctx.reply(messages.mainAdminMenu, { reply_markup: mainMenuKeyboard });
  });

  registerStartHandler(bot);
  registerMenuHandlers(bot);
  registerEmployeeHandlers(bot);
  registerTariffHandlers(bot);
  registerReportHandlers(bot);
  registerAttendanceHandler(bot);
  registerTextHandler(bot); // eng oxirida ro'yxatdan o'tishi kerak (wizard uchun catch-all)

  bot.catch((err) => {
    logger.error("Bot ichida kutilmagan xato:", err.error);
  });

  return bot;
}
