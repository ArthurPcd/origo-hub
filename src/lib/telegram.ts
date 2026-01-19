/**
 * Telegram notifications — Origo Monitor Bot
 *
 * Set TELEGRAM_BOT_TOKEN + TELEGRAM_ADMIN_CHAT_ID to enable.
 * Without those vars all calls are no-ops (dev-safe).
 */

const API_BASE = 'https://api.telegram.org';

async function send(text: string, parseMode: 'Markdown' | 'HTML' = 'Markdown') {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!token || !chatId) return;

  try {
    await fetch(`${API_BASE}/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: parseMode }),
    });
  } catch (err) {
    // Never throw — notifications are best-effort
    console.warn('Telegram send failed:', err);
  }
}

export async function notifyBriefGenerated(userId: string, plan: string) {
  await send(`📄 *Brief generated*\nUser: \`${userId.slice(0, 12)}\`\nPlan: ${plan}`);
}

export async function notifyPayment(userId: string, amount: number, currency: string, description: string) {
  const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount / 100);
  await send(`💳 *New payment*\n${fmt} — ${description}\nUser: \`${userId.slice(0, 12)}\``);
}

export async function notifyActivationCode(userId: string, featureCode: string) {
  await send(`🔑 *Feature activated*\nCode: \`${featureCode}\`\nUser: \`${userId.slice(0, 12)}\``);
}

export async function sendTelegramMessage(text: string) {
  await send(text);
}
