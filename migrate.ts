// ============================================================
// Oddiy, kutubxonasiz "wizard" (bosqichma-bosqich dialog) tizimi.
// Admin bir nechta bosqichli amallarni bajarayotganda (masalan, yangi
// xodim qo'shish) uning holati shu yerda vaqtincha xotirada saqlanadi.
//
// ESLATMA: Bu xotira Render qayta ishga tushganda (redeploy, restart)
// tozalanadi — bu muammo emas, chunki bu faqat qisqa muddatli dialog
// holatini saqlaydi (masalan admin forma to'ldirayotganda).
// ============================================================

export type WizardFlow =
  | "add_employee"
  | "edit_name"
  | "edit_position"
  | "set_schedule"
  | "tariff_summer"
  | "tariff_winter"
  | "penalty_rule"
  | "adjust_penalty";

export interface WizardState {
  flow: WizardFlow;
  step: number;
  data: Record<string, any>;
}

const wizardStore = new Map<number, WizardState>();

export function startWizard(adminId: number, flow: WizardFlow, initialData: Record<string, any> = {}) {
  wizardStore.set(adminId, { flow, step: 0, data: initialData });
}

export function getWizard(adminId: number): WizardState | undefined {
  return wizardStore.get(adminId);
}

export function updateWizard(adminId: number, patch: Partial<WizardState>) {
  const current = wizardStore.get(adminId);
  if (!current) return;
  wizardStore.set(adminId, { ...current, ...patch });
}

export function clearWizard(adminId: number) {
  wizardStore.delete(adminId);
}
