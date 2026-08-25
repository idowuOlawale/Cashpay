let eventCounter = 0;

function getDeviceType(ua = '') {
  if (/bot|crawler|spider|slurp|headless/i.test(ua)) return 'Bot/Crawler';
  if (/ipad|tablet|android(?!.*mobile)/i.test(ua)) return 'Tablet';
  if (/mobi|iphone|ipod|android/i.test(ua)) return 'Mobile';
  return 'Desktop';
}

function getBrowser(ua = '') {
  if (/edg\//i.test(ua)) return 'Edge';
  if (/chrome\//i.test(ua) && !/edg\//i.test(ua)) return 'Chrome';
  if (/safari\//i.test(ua) && !/chrome\//i.test(ua)) return 'Safari';
  if (/firefox\//i.test(ua)) return 'Firefox';
  return 'Other';
}

function getOS(ua = '') {
  if (/iphone|ipad|ipod/i.test(ua)) return 'iOS';
  if (/android/i.test(ua)) return 'Android';
  if (/windows/i.test(ua)) return 'Windows';
  if (/mac os x|macintosh/i.test(ua)) return 'macOS';
  if (/linux/i.test(ua)) return 'Linux';
  return 'Other';
}

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
    const event = String(body.event || 'site_open').slice(0, 40);
    const ua = String(req.headers['user-agent'] || body.userAgent || '').slice(0, 500);
    const country = String(req.headers['x-vercel-ip-country'] || 'Unknown').slice(0, 80);
    const region = String(req.headers['x-vercel-ip-country-region'] || 'Unknown').slice(0, 80);
    const city = String(req.headers['x-vercel-ip-city'] || 'Unknown').slice(0, 100);
    const device = getDeviceType(ua);
    const browser = getBrowser(ua);
    const os = getOS(ua);
    const path = String(body.path || req.url || '/').slice(0, 200);
    const referrer = String(body.referrer || 'Direct').slice(0, 300);
    const language = String(body.language || 'Unknown').slice(0, 80);
    const timezone = String(body.timezone || 'Unknown').slice(0, 100);
    const screen = String(body.screen || 'Unknown').slice(0, 40);

    eventCounter += 1;
    const suppliedCounter = Number(body.counter);
    const counter = Number.isFinite(suppliedCounter) && suppliedCounter > 0 ? Math.floor(suppliedCounter) : eventCounter;
    const labels = {
      site_open: '🌐 SITE OPENED',
      login_success: '🔐 LOGIN SUCCESS',
      withdrawal_click: '💸 WITHDRAWAL CLICKED'
    };

    const message = [
      `CashPay — ${labels[event] || '🔔 EVENT'}`,
      `#${counter}`,
      '',
      `🌍 Country: ${country}`,
      `📍 Region/City: ${region} / ${city}`,
      `📱 Device: ${device}`,
      `🌐 Browser: ${browser}`,
      `💻 OS: ${os}`,
      `🕐 Time: ${new Date().toISOString()}`,
      `📄 Page: ${path}`,
      `↩️ Referrer: ${referrer}`,
      `🗣 Language: ${language}`,
      `⏱ Timezone: ${timezone}`,
      `🖥 Screen: ${screen}`
    ].join('\n').slice(0, 4000);

    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message, disable_web_page_preview: true })
    });

    const result = await response.json();
    if (!response.ok || !result.ok) {
      return res.status(502).json({ ok: false, error: 'Telegram request failed' });
    }
    return res.status(200).json({ ok: true, counter });
  } catch {
    return res.status(400).json({ ok: false, error: 'Invalid request' });
  }
}
