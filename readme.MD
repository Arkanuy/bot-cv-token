# Discord Token Refresher Bot

A modular Discord bot for refreshing account tokens using your API server.

## Features

- Slash command `/generatetoken` with file upload support
- Real-time progress tracking with dynamic embeds
- Automatic proxy selection from proxy.txt
- Platform selection (Windows, macOS, Android)
- Export results as attachments
- Thread management and rate limiting
- Modular and structured codebase

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
```
DISCORD_TOKEN=your_discord_bot_token
API_URL=https://arkanstore.site
MAX_THREADS=100
```

3. Add your proxies to `proxy.txt` in the format:
```
host:port:username:password
```

4. Start the bot (commands will be deployed automatically):
```bash
npm start
```

## Usage

Use `/generatetoken` command with:
- **file**: Upload a .txt file with emails (one per line)
- **platform**: Choose Windows, macOS, or Android (optional, defaults to Windows)

The bot will process accounts and show real-time progress with automatic embed updates.

## File Structure

```
├── commands/
│   └── generatetoken.js
├── services/
│   └── tokenProcessor.js
├── utils/
│   ├── apiClient.js
│   ├── embedUtils.js
│   └── proxyUtils.js
├── index.js
├── deploy-commands.js
├── proxy.txt
└── .env
```