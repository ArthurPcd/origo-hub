/**
 * Telegram Bot Webhook — Origo Monitor
 *
 * Commands:
 *   /status  — uptime + brief count today
 *   /briefs  — last 5 briefs generated
 *   /usage   — subscription breakdown
 *   /help    — list commands
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const START_TIME = Date.now();

type TelegramUpdate = {
  message?: {
    chat: { id: number };
    text?: string;
  };
};

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase credentials');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function reply(chatId: number, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
  });
}

async function handleStatus(chatId: number) {
  const supabase = getServiceClient();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { count: briefsToday } = await supabase
    .from('briefs')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', todayStart.toISOString());

  const { count: totalUsers } = await supabase
    .from('user_subscriptions')
    .select('*', { count: 'exact', head: true });

  const uptimeMs = Date.now() - START_TIME;
  const uptimeMin = Math.floor(uptimeMs / 60000);

  await reply(
    chatId,
    `📊 *Origo Status*\n` +
    `Uptime: ${uptimeMin}min\n` +
    `Briefs today: ${briefsToday ?? 0}\n` +
    `Total users: ${totalUsers ?? 0}`
  );
}

async function handleBriefs(chatId: number) {
  const supabase = getServiceClient();

  const { data } = await supabase
    .from('briefs')
    .select('title, created_at, user_id')
    .order('created_at', { ascending: false })
    .limit(5);

  if (!data || data.length === 0) {
    await reply(chatId, 'No briefs yet.');
    return;
  }

  const lines = data.map((b, i) => {
    const date = new Date(b.created_at).toLocaleString('fr-FR', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
    const title = b.title ? b.title.slice(0, 40) : 'Untitled';
    return `${i + 1}. *${title}*\n   ${date} · \`${String(b.user_id).slice(0, 10)}\``;
  });

  await reply(chatId, `📄 *Last 5 briefs*\n\n${lines.join('\n\n')}`);
}

async function handleUsage(chatId: number) {
  const supabase = getServiceClient();

  const { data } = await supabase
    .from('user_subscriptions')
    .select('plan');

  if (!data) {
    await reply(chatId, 'No data.');
    return;
  }

  const counts: Record<string, number> = {};
  for (const row of data) {
    counts[row.plan] = (counts[row.plan] ?? 0) + 1;
  }

  const lines = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([plan, n]) => `• ${plan}: ${n}`);

  await reply(chatId, `📈 *Plan breakdown*\n${lines.join('\n')}`);
}

export async function POST(request: NextRequest) {
  // Security: only allow Telegram IPs or validate via token in URL
  const expectedToken = process.env.TELEGRAM_WEBHOOK_SECRET;
  const urlToken = request.nextUrl.searchParams.get('token');
  if (expectedToken && urlToken !== expectedToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let update: TelegramUpdate;
  try {
    update = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const msg = update.message;
  if (!msg || !msg.text) return NextResponse.json({ ok: true });

  const chatId = msg.chat.id;

  // Restrict to admin chat only
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (adminChatId && String(chatId) !== adminChatId) {
    await reply(chatId, '⛔ Unauthorized.');
    return NextResponse.json({ ok: true });
  }

  const cmd = msg.text.split(' ')[0].toLowerCase();

  try {
    switch (cmd) {
      case '/status': await handleStatus(chatId); break;
      case '/briefs': await handleBriefs(chatId); break;
      case '/usage':  await handleUsage(chatId); break;
      case '/help':
      default:
        await reply(
          chatId,
          `*Origo Monitor Bot*\n\n` +
          `/status — uptime + today's stats\n` +
          `/briefs — last 5 briefs\n` +
          `/usage  — plan breakdown`
        );
    }
  } catch (err) {
    console.error('Telegram command error:', err);
    await reply(chatId, '❌ Error processing command.');
  }

  return NextResponse.json({ ok: true });
}
