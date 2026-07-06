// Entrega de alertas por webhook (Telegram y/o Discord).
// Se configura con variables de entorno en Vercel:
//   TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID   → Telegram
//   DISCORD_WEBHOOK_URL                      → Discord
// Si no hay ninguna configurada, no hace nada.

export function notifyConfigured(): boolean {
  return Boolean(
    (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) || process.env.DISCORD_WEBHOOK_URL
  );
}

export async function sendAlert(text: string): Promise<void> {
  const jobs: Promise<unknown>[] = [];

  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const tgChat = process.env.TELEGRAM_CHAT_ID;
  if (tgToken && tgChat) {
    jobs.push(
      fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chat_id: tgChat, text, parse_mode: "Markdown", disable_web_page_preview: true })
      }).catch(() => {})
    );
  }

  const discord = process.env.DISCORD_WEBHOOK_URL;
  if (discord) {
    jobs.push(
      fetch(discord, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: text })
      }).catch(() => {})
    );
  }

  await Promise.all(jobs);
}
