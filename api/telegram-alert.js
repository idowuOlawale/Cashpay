function deviceType(ua) {
  if (/iPad|Tablet/i.test(ua)) return 'Tablet';
  if (/iPhone|Android.*Mobile|Mobile/i.test(ua)) return 'Mobile';
  return 'Desktop';
}

function browserType(ua) {
  if (/CriOS|Chrome/i.test(ua) && !/Edg/i.test(ua)) return 'Chrome';
  if (/FxiOS|Firefox/i.test(ua)) return 'Firefox';
  if (/EdgiOS|Edg/i.test(ua)) return 'Edge';
  if (/Safari/i.test(ua) && !/Chrome|CriOS/i.test(ua)) return 'Safari';
  return 'Unknown browser';
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.error('[CashPay Telegram] Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID');
    return res.status(500).json({ ok: false, error: 'Telegram environment variables are not configured' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const event = String(body.event || 'site_opened');
    const ua = String(req.headers['user-agent'] || body.userAgent || 'Unknown');
    const country = String(req.headers['x-vercel-ip-country'] || 'Unknown');
    const region = String(req.headers['x-vercel-ip-country-region'] || 'Unknown');
    const city = String(req.headers['x-vercel-ip-city'] || 'Unknown');
    const timezone = String(body.timezone || 'Unknown');
    const language = String(body.language || 'Unknown');
    const screen = String(body.screen || 'Unknown');
    const page = String(body.page || '/');
    const referrer = String(body.referrer || 'Direct');
    const device = deviceType(ua);
    const browser = browserType(ua);
    const time = new Date().toISOString();

    const eventLabels = {
      site_opened: '🌐 CashPay — Site opened',
      login: '🔐 CashPay — Successful login',
      withdraw: '💸 CashPay — Withdraw button clicked'
    };

    const message = [
      eventLabels[event] || `CashPay — ${event}`,
      `Time: ${time}`,
      `Country: ${country}`,
      `Region: ${region}`,
      `City: ${city}`,
      `Device: ${device}`,
      `Browser: ${browser}`,
      `Language: ${language}`,
      `Timezone: ${timezone}`,
      `Screen: ${screen}`,
      `Page: ${page}`,
      `Referrer: ${referrer}`
    ].join('\n');

    const telegramResponse = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message.slice(0, 4000),
        disable_web_page_preview: true
      })
    });

    const result = await telegramResponse.json();

    if (!telegramResponse.ok || !result.ok) {
      console.error('[CashPay Telegram] Telegram API rejected message:', result);
      return res.status(502).json({
        ok: false,
        error: 'Telegram request failed',
        telegramError: result.description || 'Unknown Telegram error'
      });
    }

    console.log(`[CashPay Telegram] ${event} alert sent successfully`);
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('[CashPay Telegram] Handler error:', error);
    return res.status(400).json({ ok: false, error: error.message || 'Invalid request' });
  }
};
