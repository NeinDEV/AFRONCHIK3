import { Bot } from "grammy";
import { isAdmin } from "../../config";
import { messages } from "../messages";
import { mainMenuKeyboard } from "../keyboards";
import { getEmployeeByTelegramId, rememberPendingUser } from "../../services/employeeService";
import { logger } from "../../utils/logger";

export function registerStartHandler(bot: Bot) {
  bot.command("start", async (ctx) => {
    const from = ctx.from;
    if (!from) return;

    if (isAdmin(from.id)) {
      await ctx.reply(messages.welcomeAdmin(from.first_name ?? "Admin"), {
        reply_markup: mainMenuKeyboard,
      });
      return;
    }

    const employee = await getEmployeeByTelegramId(from.id);
    if (employee) {
      await ctx.reply(messages.welcomeEmployee(employee.full_name));
      return;
    }

    try {
      await rememberPendingUser(from.id, from.username);
    } catch (err) {
      logger.error("pending_users saqlashda xato:", err);
    }

    await ctx.reply(messages.welcomeUnknown(from.id), { parse_mode: "HTML" });
  });
}
