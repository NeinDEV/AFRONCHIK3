// ============================================================
// Barcha bot xabarlari shu yerda to'plangan — kelajakda matnlarni
// o'zgartirish yoki tarjima qilish uchun faqat shu faylni tahrirlash
// kifoya qiladi.
// ============================================================

export const messages = {
  welcomeAdmin: (name: string) =>
    `Assalomu alaykum, ${name}! 🕌\n\nXush kelibsiz, hurmatli Admin. Quyidagi menyudan kerakli bo'limni tanlang.`,

  welcomeEmployee: (name: string) =>
    `Assalomu alaykum, ${name}! 🌙\n\nBot orqali ish vaqtingiz avtomatik qayd etiladi. Ish boshlaganda va tugatganda menga yumaloq video (round video) yuboring.\n\nXayrli ish kuni tilaymiz!`,

  welcomeUnknown: (telegramId: number) =>
    `Assalomu alaykum! 👋\n\nSiz hozircha tizimda ro'yxatdan o'tmagansiz. Quyidagi ID raqamingizni Adminga yuboring, shunda u sizni ro'yxatga qo'shadi:\n\n<code>${telegramId}</code>`,

  notAdmin: `Kechirasiz, bu bo'lim faqat Admin uchun mo'ljallangan 🙏`,

  mainAdminMenu: `📋 Asosiy menyu — kerakli bo'limni tanlang:`,

  checkInSuccess: (name: string, time: string, wasLate: boolean, lateMinutes: number) => {
    if (wasLate) {
      return `Assalomu alaykum, ${name}!\n\n⏰ Ish boshlanish vaqtingiz: ${time}\n\nHurmatli ${name}, siz belgilangan vaqtdan ${lateMinutes} daqiqa kech qoldingiz. Iltimos, keyingi safar vaqtida kelishga harakat qiling. Alloh ish-faoliyatingizga baraka bersin 🤲`;
    }
    return `Assalomu alaykum, ${name}! 🕌\n\n✅ Ish boshlanish vaqtingiz qayd etildi: ${time}\n\nXayrli va baraktali ish kuni tilaymiz!`;
  },

  checkOutSuccess: (name: string, time: string, workedHours: number) =>
    `Rahmat, ${name}! 🌙\n\n✅ Ish tugatish vaqtingiz qayd etildi: ${time}\n⏱ Bugun jami ishlagan vaqtingiz: ${workedHours.toFixed(2)} soat\n\nBarakalla! Bugungi mehnatingiz uchun Alloh rozi bo'lsin. Xayrli tunlar 🤲`,

  adminAttendanceForward: (
    name: string,
    type: "Kelish" | "Ketish",
    time: string,
    extra?: string
  ) =>
    `📹 <b>${type}</b> — ${name}\n🕐 Vaqt: ${time}${extra ? `\n${extra}` : ""}`,

  employeeNotRegistered: `Kechirasiz, siz tizimda ro'yxatdan o'tmagansiz. Iltimos, Administratorga murojaat qiling 🙏`,

  employeeInactive: `Kechirasiz, sizning hisobingiz hozircha faol emas. Administratorga murojaat qiling 🙏`,

  askFullName: `Xodimning to'liq ism-familiyasini kiriting:`,
  askPosition: `Lavozimini kiriting:`,
  askTelegramId: `Xodimning Telegram ID raqamini kiriting (xodim botga /start bosganda unga ID ko'rsatiladi):`,
  askShiftCount: `Xodim kuniga nechta smena ochishi mumkin? (1, 2 yoki 3)`,
  askShiftStart: (n: number) => `${n}-smena boshlanish vaqtini kiriting (masalan 09:00):`,
  askShiftEnd: (n: number) => `${n}-smena tugash vaqtini kiriting (masalan 18:00):`,

  employeeAdded: (name: string) =>
    `✅ Xodim muvaffaqiyatli qo'shildi: <b>${name}</b>\n\nBarakalla, yangi hamkasb qo'shildi! 🕌`,

  invalidTimeFormat: `Noto'g'ri format. Iltimos, vaqtni "SS:DD" ko'rinishida kiriting, masalan: 09:00`,
  invalidNumber: `Iltimos, faqat raqam kiriting.`,

  cancelled: `Amal bekor qilindi.`,

  seasonUpdated: (season: string) =>
    `✅ ${season === "summer" ? "Yozgi" : "Qishki"} mavsum tarifi yangilandi.`,

  penaltyRuleUpdated: `✅ Jarima qoidasi yangilandi.`,

  penaltyApplied: (name: string, amount: number, lateMinutes: number) =>
    `⚠️ <b>Avtomatik jarima</b>\n\nXodim: ${name}\nKechikish: ${lateMinutes} daqiqa\nJarima summasi: ${amount.toLocaleString("ru-RU")} so'm`,

  staleShiftWarning: (name: string, hours: number) =>
    `⚠️ <b>Diqqat, Admin!</b>\n\n${name}ning smenasi ${hours} soatdan beri ochiq holatda qolmoqda. Iltimos, tekshirib ko'ring — ehtimol xodim "ketish" videosini yuborishni unutgan.`,

  noOpenSeasonWarning: (date: string) =>
    `⚠️ Diqqat: ${date} sanasi uchun mavsum tarifi (yozgi/qishki) sozlanmagan. Ish haqi hisoblanmadi. Iltimos, "Tariflar" bo'limidan sozlang.`,

  reportHeader: (title: string, period: string) => `📊 <b>${title}</b>\n🗓 ${period}\n`,

  employeeReportLine: (
    name: string,
    hours: number,
    salary: number,
    penalties: number,
    final: number
  ) =>
    `\n👤 <b>${name}</b>\n⏱ Ishlangan: ${hours.toFixed(2)} soat\n💰 Ish haqi: ${salary.toLocaleString("ru-RU")} so'm\n⚠️ Jarima: ${penalties.toLocaleString("ru-RU")} so'm\n✅ Yakuniy: ${final.toLocaleString("ru-RU")} so'm`,

  reportEmpty: `Bu davr uchun hali ma'lumot mavjud emas.`,

  genericError: `Kechirasiz, xatolik yuz berdi. Iltimos, birozdan so'ng qayta urinib ko'ring 🙏`,

  operationSuccess: `✅ Amal muvaffaqiyatli bajarildi.`,
};
