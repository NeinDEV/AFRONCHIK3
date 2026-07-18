import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`Environment o'zgaruvchisi topilmadi: ${name}`);
  }
  return value;
}

function parseAdminIds(raw: string): Set<number> {
  const ids = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => Number(s));

  for (const id of ids) {
    if (Number.isNaN(id)) {
      throw new Error(`ADMIN_IDS ichida noto'g'ri qiymat topildi: ${raw}`);
    }
  }
  return new Set(ids);
}

export const config = {
  botToken: required("BOT_TOKEN"),
  databaseUrl: required("DATABASE_URL"),
  adminIds: parseAdminIds(process.env.ADMIN_IDS ?? ""),
  timezone: process.env.TIMEZONE ?? "Asia/Tashkent",
  port: Number(process.env.PORT ?? 3000),
  webhookUrl: process.env.WEBHOOK_URL ?? "",
  webhookSecret: process.env.WEBHOOK_SECRET ?? "change_this_secret",
  nodeEnv: process.env.NODE_ENV ?? "development",
};

export function isAdmin(telegramId: number): boolean {
  return config.adminIds.has(telegramId);
}
