# Discord Token Refresher Bot

A high-performance, modular Discord bot for refreshing account tokens using your API server with concurrent processing and real-time progress tracking.

## Features

- **Slash Command Interface**: `/generatetoken` with intuitive file upload
- **Concurrent Processing**: Multi-threaded execution (configurable up to 100+ threads)
- **Real-Time Progress Tracking**: Auto-updating embeds every 2 seconds
- **Smart Proxy Management**: Automatic random proxy selection per account
- **Platform Support**: Windows, macOS, and Android
- **Private Results**: Files sent via DM for privacy
- **Comprehensive Logging**: Detailed console output for monitoring
- **Error Handling**: Robust retry logic and fallback mechanisms
- **Auto-Deploy Commands**: Slash commands register automatically on startup

## Quick Start

### 1. Installation

```bash
npm install
```

### 2. Configuration

Edit `.env` file:

```env
DISCORD_TOKEN=your_discord_bot_token_here
API_URL=https://arkanstore.site
MAX_THREADS=100
```

### 3. Setup Proxies

Add your proxies to `proxy.txt` (one per line):

```
host:port:username:password
```

Example:
```
renncloud.xyz:10005:user123:pass456
renncloud.xyz:10006:user123:pass456
proxy.example.com:8080:myuser:mypass
```

### 4. Run the Bot

```bash
npm start
```

Slash commands will be deployed automatically when the bot starts!

## Usage

### Command: `/generatetoken`

**Parameters:**
- `file` (required): Upload a .txt file containing emails (one per line)
- `platform` (optional): Choose Windows, macOS, or Android (defaults to Windows)

**Example email file format:**
```
user1@gmail.com
user2@gmail.com
user3@gmail.com
```

### Real-Time Progress Display

The bot shows live progress with automatic updates:

```
🔄 Processing Accounts
Progress: 45/190 (23.7%)
Status:
✅ Success: 38
❌ Failed: 7
🚫 Not Found: 0
🔄 Retrying: 0
[████░░░░░░░░░░░░░░░░]
Time:
⏱️ Elapsed: 15.3s
🔮 ETA: 48s
⚡ Avg: 0.34s/account
```

### Results Delivery

- **Progress embed** updates in the channel where command was executed
- **Result files** sent privately via Direct Message:
  - `successful_tokens.txt` - Format: `email:token`
  - `failed_emails.txt` - Format: `email:error_reason`

## Performance

**Example with 190 accounts:**
- **MAX_THREADS=100**: ~40 seconds total
- **MAX_THREADS=50**: ~80 seconds total
- **MAX_THREADS=1**: ~57 minutes total

**Concurrent processing** significantly reduces processing time!

## Project Structure

```
discord-bot/
├── commands/
│   └── generatetoken.js          # Main command handler
├── services/
│   └── tokenProcessor.js         # Concurrent processing logic
├── utils/
│   ├── apiClient.js              # API communication
│   ├── embedUtils.js             # Discord embed formatting
│   ├── proxyUtils.js             # Proxy management
│   └── backgroundUpdater.js      # Real-time embed updates
├── index.js                      # Bot entry point
├── deploy-commands.js            # Command registration (auto)
├── package.json                  # Dependencies
├── .env                          # Configuration
├── proxy.txt                     # Proxy list
└── README.md                     # Documentation
```

## Configuration Details

### Environment Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `DISCORD_TOKEN` | Your Discord bot token | Required | `MTk5O...` |
| `API_URL` | Your API server URL | Required | `https://arkanstore.site` |
| `MAX_THREADS` | Maximum concurrent requests | 100 | `50`, `100`, `200` |

### Proxy Format

Supports both authenticated and non-authenticated proxies:

- **With authentication**: `host:port:username:password`
- **Without authentication**: `host:port`

## Console Logging

The bot provides detailed console output for monitoring:

```
=== Token Generation Request ===
User: username#1234 (123456789)
Guild: My Server (987654321)
📁 File: accounts.txt (5024 bytes)
🖥️ Platform: Windows
📧 Found 190 emails in file

🔄 Starting token processing...
📧 Total accounts: 190
🖥️ Platform: Windows
🧵 Max concurrent threads: 100

🔄 Processing batch 1 (100 accounts)
[1/190] Processing: user1@gmail.com
🌐 Using proxy: renncloud.xyz:10005
🚀 API Request [1/100]: user1@gmail.com
📡 API Response for user1@gmail.com: Success
✅ Success! Token generated for user1@gmail.com (2.3s)
📉 Active requests: 99/100

📊 Progress: 45/190 (23.7%) | Success: 38 | Failed: 7 | Not Found: 0

=== Final Results ===
✅ Success: 165
❌ Failed: 20
🚫 Not Found: 5
⏱️ Total Time: 42.8s
📄 Generated successful_tokens.txt (98450 bytes)
📄 Generated failed_emails.txt (1250 bytes)
📩 Sending 2 files to user DM...
✅ Files sent to username#1234 via DM
```

## Error Handling

The bot handles various error scenarios:

- **Maximum threads reached**: Queues requests appropriately
- **Proxy unavailable**: Skips account and logs error
- **API timeout**: Retries with exponential backoff
- **DM disabled**: Falls back to ephemeral reply
- **Expired embed**: Creates new message automatically
- **Network errors**: Logs and continues processing

## Features Breakdown

### 1. Concurrent Processing
- Processes multiple accounts simultaneously
- Configurable thread limit via `MAX_THREADS`
- Batch processing for optimal performance

### 2. Real-Time Updates
- Background timer updates embed every 2 seconds
- Independent from main processing thread
- Shows live progress, ETA, and statistics

### 3. Smart Proxy Management
- Random proxy selection for each account
- Automatic proxy list loading on startup
- Format validation and error handling

### 4. Privacy-First Design
- Progress visible to all in channel
- Results sent privately via DM
- Fallback to ephemeral if DM fails

### 5. Comprehensive Logging
- Request tracking with timestamps
- API response monitoring
- Thread utilization metrics
- Error tracking with context

## Troubleshooting

### Bot not responding
- Check `DISCORD_TOKEN` is correct
- Ensure bot has proper permissions in Discord
- Verify bot is online in Discord developer portal

### Slash commands not appearing
- Wait 1-2 minutes after bot starts
- Kick and re-invite bot to server
- Check console for command deployment errors

### "No proxy available" errors
- Verify `proxy.txt` exists and contains proxies
- Check proxy format: `host:port:username:password`
- Ensure proxies are active and working

### API timeout errors
- Check `API_URL` is correct and accessible
- Verify API server is running
- Reduce `MAX_THREADS` if server is overloaded

### DM delivery failed
- User must enable DMs from server members
- Bot will send files as ephemeral reply instead
- Check user's privacy settings

## Requirements

- **Node.js**: v16.9.0 or higher
- **Discord.js**: v14.14.1 or higher
- **API Server**: Compatible with the provided Flask API
- **Proxy List**: At least one working proxy in `proxy.txt`

## License

This project is provided as-is for educational and authorized use only.

## Support

For issues or questions:
1. Check console logs for detailed error messages
2. Verify all configuration in `.env`
3. Ensure proxy list is valid and accessible
4. Test API endpoint independently

---

**Made with ❤️ for efficient token management**