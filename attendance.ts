import { InlineKeyboard } from "grammy";

export const mainMenuKeyboard = new InlineKeyboard()
  .text("👥 Xodimlar", "menu:employees")
  .text("📅 Ish jadvali", "menu:schedule")
  .row()
  .text("💰 Tariflar", "menu:tariffs")
  .text("⚠️ Jarima qoidalari", "menu:penalty_rules")
  .row()
  .text("📊 Hisobotlar", "menu:reports")
  .text("📜 Davomat tarixi", "menu:history")
  .row()
  .text("⚙️ Sozlamalar", "menu:settings");

export const employeesMenuKeyboard = new InlineKeyboard()
  .text("➕ Xodim qo'shish", "employees:add")
  .row()
  .text("📋 Xodimlar ro'yxati", "employees:list")
  .row()
  .text("⬅️ Orqaga", "menu:main");

export const reportsMenuKeyboard = new InlineKeyboard()
  .text("📅 Kunlik", "report:daily")
  .text("🗓 Haftalik", "report:weekly")
  .row()
  .text("📆 Oylik", "report:monthly")
  .row()
  .text("⬅️ Orqaga", "menu:main");

export const tariffsMenuKeyboard = new InlineKeyboard()
  .text("☀️ Yozgi tarif", "tariffs:summer")
  .text("❄️ Qishki tarif", "tariffs:winter")
  .row()
  .text("⬅️ Orqaga", "menu:main");

export const backToMainKeyboard = new InlineKeyboard().text(
  "⬅️ Bosh menyu",
  "menu:main"
);

export function employeeListKeyboard(
  employees: { id: number; full_name: string; is_active: boolean }[]
) {
  const kb = new InlineKeyboard();
  for (const emp of employees) {
    const label = `${emp.is_active ? "🟢" : "🔴"} ${emp.full_name}`;
    kb.text(label, `employee:view:${emp.id}`).row();
  }
  kb.text("⬅️ Orqaga", "menu:employees");
  return kb;
}

export function employeeActionsKeyboard(employeeId: number, isActive: boolean) {
  const kb = new InlineKeyboard()
    .text("✏️ Ismini o'zgartirish", `employee:edit_name:${employeeId}`)
    .row()
    .text("💼 Lavozimini o'zgartirish", `employee:edit_position:${employeeId}`)
    .row()
    .text("📅 Jadvalini sozlash", `employee:set_schedule:${employeeId}`)
    .row();

  if (isActive) {
    kb.text("🔴 Faolsizlantirish", `employee:deactivate:${employeeId}`).row();
  } else {
    kb.text("🟢 Faollashtirish", `employee:activate:${employeeId}`).row();
  }

  kb.text("⬅️ Orqaga", "employees:list");
  return kb;
}
