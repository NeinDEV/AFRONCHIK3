import express from "express";
import { webhookCallback } from "grammy";
import { config } from "./config";
import { createBot } from "./bot/bot";
import { startScheduler } from "./jobs/scheduler";
import { logger } from "./utils/logger";
import { pool } from "./db/pool";

async function main() {
  const bot = await createBot();

  const app = express();
  app.use(express.json());

  // Render "Web Service" turi doimiy HTTP portni talab qiladi —
  // shu sabab health-check endpoint majburiy.
  app.get("/", (_req, res) => {
    res.status(200).send("✅ Xodimlar davomati boti ishlamoqda (Asia/Tashkent)");
  });

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok", time: new Date().toISOString() });
  });

  // Telegram webhook endpoint — WEBHOOK_SECRET orqali himoyalangan
  app.post(
    "/webhook",
    webhookCallback(bot, "express", { secretToken: config.webhookSecret })
  );

  app.listen(config.port, async () => {
    logger.info(`Server ${config.port}-portda ishga tushdi`);

    if (config.webhookUrl) {
      try {
        const fullUrl = `${config.webhookUrl.replace(/\/$/, "")}/webhook`;
        await bot.api.setWebhook(fullUrl, {
          secret_token: config.webhookSecret,
        });
        logger.info(`Webhook sozlandi: ${fullUrl}`);
      } catch (err) {
        logger.error("Webhook sozlashda xato:", err);
      }
    } else {
      logger.warn(
        "WEBHOOK_URL sozlanmagan — bot webhook orqali xabar qabul qila olmaydi. " +
          ".env faylida WEBHOOK_URL ni to'ldiring."
      );
    }

    startScheduler(bot);
  });
}

main().catch((err) => {
  logger.error("Botni ishga tushirishda jiddiy xato:", err);
  process.exit(1);
});

process.on("SIGTERM", async () => {
  logger.info("SIGTERM qabul qilindi, server to'xtatilmoqda...");
  await pool.end();
  process.exit(0);
});
