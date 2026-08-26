# Cashpay

## Telegram alerts

Cashpay sends server-side Telegram notifications for these events:

- `site_opened` — when the site loads
- `login` — after the login form is accepted
- `withdraw` — when the Withdraw button is clicked

The browser calls `/api/telegram-alert`; the Telegram bot token is never placed in frontend code.

### Vercel setup

In the Vercel project, add these environment variables for the deployment environment:

```text
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

Redeploy after adding or changing the variables. The API route is `api/telegram-alert.js`.

### Telegram setup

Create the bot with BotFather, then send a message to the bot from the destination Telegram chat so Telegram has a chat to deliver to. Use that bot token and the destination chat ID in Vercel.

Do not commit the real bot token or chat ID to GitHub. `.env.example` contains only the variable names.
