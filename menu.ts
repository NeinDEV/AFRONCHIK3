import { Bot } from "grammy";
import { isAdmin } from "../../config";
import { messages } from "../messages";
import { mainMenuKeyboard } from "../keyboards";
import { getWizard, updateWizard, clearWizard } from "../wizard";
import {
  createEmployee,
  updateEmployeeName,
  updateEmployeePosition,
} from "../../services/employeeService";
import { addSchedule, clearSchedules } from "../../services/scheduleService";
import { upsertSeason } from "../../services/seasonService";
import { updatePenaltyRule } from "../../services/penaltyService";

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function registerTextHandler(bot: Bot) {
  bot.on("message:text", async (ctx) => {
    const from = ctx.from;
    if (!from || !isAdmin(from.id)) return;
    if (ctx.message.text.startsWith("/")) return;

    const wizard = getWizard(from.id);
    if (!wizard) return; // Faol dialog yo'q — hech narsa qilmaymiz

    const text = ctx.message.text.trim();

    try {
      switch (wizard.flow) {
        case "add_employee":
          await handleAddEmployee(ctx, from.id, wizard, text);
          break;
        case "edit_name":
          await updateEmployeeName(wizard.data.employeeId, text);
          clearWizard(from.id);
          await ctx.reply(`✅ Ism yangilandi: <b>${text}</b>`, { parse_mode: "HTML" });
          break;
        case "edit_position":
          await updateEmployeePosition(wizard.data.employeeId, text);
          clearWizard(from.id);
          await ctx.reply(`✅ Lavozim yangilandi: <b>${text}</b>`, { parse_mode: "HTML" });
          break;
        case "set_schedule":
          await handleSetSchedule(ctx, from.id, wizard, text);
          break;
        case "tariff_summer":
        case "tariff_winter":
          await handleTariff(ctx, from.id, wizard, text);
          break;
        case "penalty_rule":
          await handlePenaltyRule(ctx, from.id, wizard, text);
          break;
        default:
          clearWizard(from.id);
      }
    } catch (err) {
      clearWizard(from.id);
      await ctx.reply(messages.genericError);
      throw err;
    }
  });
}

// ============================================================
// Xodim qo'shish oqimi
// ============================================================
async function handleAddEmployee(ctx: any, adminId: number, wizard: any, text: string) {
  switch (wizard.step) {
    case 0: // Ism
      updateWizard(adminId, { data: { ...wizard.data, fullName: text }, step: 1 });
      await ctx.reply(messages.askPosition);
      break;

    case 1: // Lavozim
      updateWizard(adminId, { data: { ...wizard.data, position: text }, step: 2 });
      await ctx.reply(messages.askTelegramId);
      break;

    case 2: { // Telegram ID
      const telegramId = Number(text);
      if (Number.isNaN(telegramId)) {
        await ctx.reply(messages.invalidNumber);
        return;
      }
      updateWizard(adminId, { data: { ...wizard.data, telegramId }, step: 3 });
      await ctx.reply(messages.askShiftCount);
      break;
    }

    case 3: { // Smenalar soni
      const count = Number(text);
      if (![1, 2, 3].includes(count)) {
        await ctx.reply("Iltimos, 1, 2 yoki 3 raqamini kiriting.");
        return;
      }
      updateWizard(adminId, {
        data: { ...wizard.data, shiftCount: count, schedules: [] },
        step: 4,
      });
      await ctx.reply(messages.askShiftStart(1));
      break;
    }

    default: {
      // step >= 4: smena vaqtlarini yig'ish
      const k = Math.floor((wizard.step - 4) / 2);
      const isStart = (wizard.step - 4) % 2 === 0;

      if (!TIME_RE.test(text)) {
        await ctx.reply(messages.invalidTimeFormat);
        return;
      }

      const schedules = [...(wizard.data.schedules ?? [])];
      if (isStart) {
        schedules[k] = { start: text, end: "" };
        updateWizard(adminId, { data: { ...wizard.data, schedules }, step: wizard.step + 1 });
        await ctx.reply(messages.askShiftEnd(k + 1));
      } else {
        schedules[k] = { ...schedules[k], end: text };
        const shiftCount = wizard.data.shiftCount;

        if (k + 1 < shiftCount) {
          updateWizard(adminId, { data: { ...wizard.data, schedules }, step: wizard.step + 1 });
          await ctx.reply(messages.askShiftStart(k + 2));
        } else {
          // Barcha smenalar yig'ildi — xodimni saqlaymiz
          const data = { ...wizard.data, schedules };
          const employee = await createEmployee(data.telegramId, data.fullName, data.position);
          for (let i = 0; i < schedules.length; i++) {
            await addSchedule(employee.id, schedules[i].start, schedules[i].end, i + 1);
          }
          clearWizard(adminId);
          await ctx.reply(messages.employeeAdded(employee.full_name), {
            parse_mode: "HTML",
            reply_markup: mainMenuKeyboard,
          });
        }
      }
    }
  }
}

// ============================================================
// Mavjud xodim uchun jadval qayta sozlash
// ============================================================
async function handleSetSchedule(ctx: any, adminId: number, wizard: any, text: string) {
  if (wizard.step === 0) {
    const count = Number(text);
    if (![1, 2, 3].includes(count)) {
      await ctx.reply("Iltimos, 1, 2 yoki 3 raqamini kiriting.");
      return;
    }
    updateWizard(adminId, {
      data: { ...wizard.data, shiftCount: count, schedules: [] },
      step: 1,
    });
    await ctx.reply(messages.askShiftStart(1));
    return;
  }

  const k = Math.floor((wizard.step - 1) / 2);
  const isStart = (wizard.step - 1) % 2 === 0;

  if (!TIME_RE.test(text)) {
    await ctx.reply(messages.invalidTimeFormat);
    return;
  }

  const schedules = [...(wizard.data.schedules ?? [])];
  if (isStart) {
    schedules[k] = { start: text, end: "" };
    updateWizard(adminId, { data: { ...wizard.data, schedules }, step: wizard.step + 1 });
    await ctx.reply(messages.askShiftEnd(k + 1));
  } else {
    schedules[k] = { ...schedules[k], end: text };
    const shiftCount = wizard.data.shiftCount;

    if (k + 1 < shiftCount) {
      updateWizard(adminId, { data: { ...wizard.data, schedules }, step: wizard.step + 1 });
      await ctx.reply(messages.askShiftStart(k + 2));
    } else {
      await clearSchedules(wizard.data.employeeId);
      for (let i = 0; i < schedules.length; i++) {
        await addSchedule(wizard.data.employeeId, schedules[i].start, schedules[i].end, i + 1);
      }
      clearWizard(adminId);
      await ctx.reply("✅ Ish jadvali muvaffaqiyatli yangilandi.", {
        reply_markup: mainMenuKeyboard,
      });
    }
  }
}

// ============================================================
// Yozgi/Qishki tarif sozlash
// ============================================================
async function handleTariff(ctx: any, adminId: number, wizard: any, text: string) {
  switch (wizard.step) {
    case 0:
      if (!DATE_RE.test(text)) {
        await ctx.reply("Noto'g'ri format. Sanani YYYY-MM-DD ko'rinishida kiriting.");
        return;
      }
      updateWizard(adminId, { data: { ...wizard.data, startDate: text }, step: 1 });
      await ctx.reply("Tugash sanasini kiriting (YYYY-MM-DD):");
      break;

    case 1:
      if (!DATE_RE.test(text)) {
        await ctx.reply("Noto'g'ri format. Sanani YYYY-MM-DD ko'rinishida kiriting.");
        return;
      }
      updateWizard(adminId, { data: { ...wizard.data, endDate: text }, step: 2 });
      await ctx.reply("Kunlik minimal ish soatini kiriting (masalan 10):");
      break;

    case 2: {
      const minHours = Number(text);
      if (Number.isNaN(minHours) || minHours <= 0) {
        await ctx.reply(messages.invalidNumber);
        return;
      }
      updateWizard(adminId, { data: { ...wizard.data, minHours }, step: 3 });
      await ctx.reply("Asosiy soatlik tarifni kiriting (so'mda, masalan 6500):");
      break;
    }

    case 3: {
      const baseRate = Number(text);
      if (Number.isNaN(baseRate) || baseRate <= 0) {
        await ctx.reply(messages.invalidNumber);
        return;
      }
      updateWizard(adminId, { data: { ...wizard.data, baseRate }, step: 4 });
      await ctx.reply("Qo'shimcha (ortiqcha) soat uchun tarifni kiriting (so'mda, masalan 7000):");
      break;
    }

    case 4: {
      const overtimeRate = Number(text);
      if (Number.isNaN(overtimeRate) || overtimeRate <= 0) {
        await ctx.reply(messages.invalidNumber);
        return;
      }
      const data = wizard.data;
      await upsertSeason(
        data.season,
        data.startDate,
        data.endDate,
        data.minHours,
        data.baseRate,
        overtimeRate
      );
      clearWizard(adminId);
      await ctx.reply(messages.seasonUpdated(data.season), { reply_markup: mainMenuKeyboard });
      break;
    }
  }
}

// ============================================================
// Jarima qoidasini sozlash
// ============================================================
async function handlePenaltyRule(ctx: any, adminId: number, wizard: any, text: string) {
  if (wizard.step === 0) {
    const graceMinutes = Number(text);
    if (Number.isNaN(graceMinutes) || graceMinutes < 0) {
      await ctx.reply(messages.invalidNumber);
      return;
    }
    updateWizard(adminId, { data: { ...wizard.data, graceMinutes }, step: 1 });
    await ctx.reply("Jarima summasini kiriting (so'mda, masalan 30000):");
    return;
  }

  if (wizard.step === 1) {
    const amount = Number(text);
    if (Number.isNaN(amount) || amount < 0) {
      await ctx.reply(messages.invalidNumber);
      return;
    }
    await updatePenaltyRule(wizard.data.graceMinutes, amount, adminId);
    clearWizard(adminId);
    await ctx.reply(messages.penaltyRuleUpdated, { reply_markup: mainMenuKeyboard });
  }
}
