export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return res.status(500).json({ ok: false, error: 'Telegram environment variables are not configured' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const event = String(body.event || 'site_opened');
    const ua = String(req.headers['user-agent'] || body.userAgent || 'Unknown');
    const country = String(req.headers['x-vercel-ip-country'] || body.country || 'Unknown');
    const region = String(req.headers['x-vercel-ip-country-region'] || body.region || 'Unknown');
    const city = String(req.headers['x-vercel-ip-city'] || body.city || 'Unknown');
    const timezone = String(body.timezone || 'Unknown');
    const language = String(body.language || 'Unknown');
    const screen = String(body.screen || 'Unknown');
    const page = String(body.page || '/');
    const referrer = String(body.referrer || 'Direct');
    const time = new Date().toLocaleString('en-US', { timeZone: 'UTC', hour12: false }) + ' UTC';

    let message;

    if (event === 'login') {
      message = `🔐 CashPay: successful login from ${country}, using ${ua}.`;
    } else if (event === 'withdraw') {
      message = `💸 CashPay: withdrawal button clicked from ${country}, using ${ua}.`;
    } else {
      message = [
        '🌐 CashPay — Site opened',
        `Country: ${country}`,
        `Region: ${region}`,
        `City: ${city}`,
        `Device/Browser: ${ua}`,
        `Language: ${language}`,
        `Timezone: ${timezone}`,
        `Screen: ${screen}`,
        `Page: ${page}`,
        `Referrer: ${referrer}`,
        `Time: ${time}`
      ].join('\n');
    }

    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message.slice(0, 4000), disable_web_page_preview: true })
    });

    const result = await response.json();
    if (!response.ok || !result.ok) {
      return res.status(502).json({ ok: false, error: 'Telegram request failed' });
    }

    return res.status(200).json({ ok: true });
  } catch {
    return res.status(400).json({ ok: false, error: 'Invalid request' });
  }
}
