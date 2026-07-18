import { Bot } from "grammy";
import { isAdmin } from "../../config";
import { messages } from "../messages";
import {
  employeeListKeyboard,
  employeeActionsKeyboard,
  employeesMenuKeyboard,
} from "../keyboards";
import {
  listAllEmployees,
  getEmployeeById,
  deactivateEmployee,
  reactivateEmployee,
} from "../../services/employeeService";
import { getSchedulesForEmployee } from "../../services/scheduleService";
import { startWizard } from "../wizard";

export function registerEmployeeHandlers(bot: Bot) {
  bot.callbackQuery("employees:add", async (ctx) => {
    if (!isAdmin(ctx.from.id)) return ctx.answerCallbackQuery();
    startWizard(ctx.from.id, "add_employee");
    await ctx.reply(messages.askFullName);
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery("employees:list", async (ctx) => {
    if (!isAdmin(ctx.from.id)) return ctx.answerCallbackQuery();
    const employees = await listAllEmployees();
    if (employees.length === 0) {
      await ctx.editMessageText("Hozircha xodimlar mavjud emas.", {
        reply_markup: employeesMenuKeyboard,
      });
      return ctx.answerCallbackQuery();
    }
    await ctx.editMessageText("📋 Xodimlar ro'yxati:", {
      reply_markup: employeeListKeyboard(employees),
    });
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery(/^employee:view:(\d+)$/, async (ctx) => {
    if (!isAdmin(ctx.from.id)) return ctx.answerCallbackQuery();
    const id = Number(ctx.match![1]);
    const employee = await getEmployeeById(id);
    if (!employee) {
      await ctx.answerCallbackQuery({ text: "Xodim topilmadi" });
      return;
    }
    const schedules = await getSchedulesForEmployee(id);
    let scheduleText = "Jadval sozlanmagan";
    if (schedules.length > 0) {
      scheduleText = schedules
        .map(
          (s) =>
            `${s.shift_order}-smena: ${s.shift_start.slice(0, 5)} — ${s.shift_end.slice(0, 5)}`
        )
        .join("\n");
    }
    const text = `👤 <b>${employee.full_name}</b>\n💼 Lavozim: ${employee.position ?? "—"}\n🆔 ID: ${employee.telegram_id}\nHolat: ${employee.is_active ? "🟢 Faol" : "🔴 Faol emas"}\n\n📅 Ish jadvali:\n${scheduleText}`;
    await ctx.editMessageText(text, {
      parse_mode: "HTML",
      reply_markup: employeeActionsKeyboard(employee.id, employee.is_active),
    });
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery(/^employee:edit_name:(\d+)$/, async (ctx) => {
    if (!isAdmin(ctx.from.id)) return ctx.answerCallbackQuery();
    const id = Number(ctx.match![1]);
    startWizard(ctx.from.id, "edit_name", { employeeId: id });
    await ctx.reply("Yangi ism-familiyani kiriting:");
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery(/^employee:edit_position:(\d+)$/, async (ctx) => {
    if (!isAdmin(ctx.from.id)) return ctx.answerCallbackQuery();
    const id = Number(ctx.match![1]);
    startWizard(ctx.from.id, "edit_position", { employeeId: id });
    await ctx.reply("Yangi lavozimni kiriting:");
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery(/^employee:set_schedule:(\d+)$/, async (ctx) => {
    if (!isAdmin(ctx.from.id)) return ctx.answerCallbackQuery();
    const id = Number(ctx.match![1]);
    startWizard(ctx.from.id, "set_schedule", { employeeId: id, schedules: [] });
    await ctx.reply(messages.askShiftCount);
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery(/^employee:deactivate:(\d+)$/, async (ctx) => {
    if (!isAdmin(ctx.from.id)) return ctx.answerCallbackQuery();
    const id = Number(ctx.match![1]);
    await deactivateEmployee(id);
    await ctx.answerCallbackQuery({ text: "Xodim faolsizlantirildi" });
    const employee = await getEmployeeById(id);
    if (employee) {
      await ctx.editMessageReplyMarkup({
        reply_markup: employeeActionsKeyboard(employee.id, employee.is_active),
      });
    }
  });

  bot.callbackQuery(/^employee:activate:(\d+)$/, async (ctx) => {
    if (!isAdmin(ctx.from.id)) return ctx.answerCallbackQuery();
    const id = Number(ctx.match![1]);
    await reactivateEmployee(id);
    await ctx.answerCallbackQuery({ text: "Xodim faollashtirildi" });
    const employee = await getEmployeeById(id);
    if (employee) {
      await ctx.editMessageReplyMarkup({
        reply_markup: employeeActionsKeyboard(employee.id, employee.is_active),
      });
    }
  });
}
