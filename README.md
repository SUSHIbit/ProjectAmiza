# Secure Discord Chat

A secure chat application that uses Discord DMs as a transport layer for encrypted messages. This application allows two users to communicate securely by encrypting messages sent through Discord direct messages.

## Features

- Secure communication with AES encryption
- Modern, responsive UI
- Real-time messaging
- Messages are sent through Discord DMs
- All messages appear in plaintext in the browser but ciphertext in Discord
- Multi-user support with individual login

## Prerequisites

- Node.js (v14 or higher)
- A Discord account
- A Discord bot token

## Setup

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   # Server port
   PORT=3000

   # Discord Bot Token (obtain from Discord Developer Portal)
   DISCORD_BOT_TOKEN=your_discord_bot_token_here

   # Encryption key (used for AES encryption/decryption)
   ENCRYPTION_KEY=your_shared_secret_encryption_key
   ```

## Creating a Discord Bot

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name
3. Navigate to the "Bot" tab and click "Add Bot"
4. Under the Token section, click "Copy" to copy your bot token (use this for `DISCORD_BOT_TOKEN` in your .env file)
5. Enable these Privileged Gateway Intents:
   - MESSAGE CONTENT INTENT
   - SERVER MEMBERS INTENT
   - PRESENCE INTENT
6. Navigate to the "OAuth2" tab
7. In URL Generator, select the following scopes:
   - bot
   - applications.commands
8. Under Bot Permissions, select:
   - Send Messages
   - Read Messages/View Channels
9. Copy the generated URL and open it in your browser to add the bot to your server

## Getting a Discord User ID

To find a user ID:
1. Enable Developer Mode in Discord (User Settings > Advanced > Developer Mode)
2. Right-click on a user and select "Copy ID"
3. Users will need to enter their own Discord User ID when logging into the app

## Usage

1. Start the development server:
   ```
   npm run dev
   ```
2. Open your browser and navigate to `http://localhost:3000`
3. Log in with your username, Discord User ID, and the shared encryption key
4. Start sending messages!

## How It Works

1. User types a message in the browser
2. The message is encrypted using AES and the shared secret key
3. The encrypted message is sent through a Discord DM via the bot
4. The recipient's browser receives the encrypted message
5. The message is decrypted and displayed in the recipient's browser

## Security Considerations

- This application uses symmetric encryption, which means all parties must have the same secret key
- The key is stored in the .env file and should be kept secure
- For production use, consider implementing asymmetric encryption
- Ensure your Discord bot token remains private

## Deployment

### Option 1: Deploy to Render (Free)

1. Create an account on [Render](https://render.com/)
2. Click "New" and select "Web Service"
3. Connect your GitHub repository or use the "Public Git repository" option
4. Configure the service:
   - Name: discord-secure-chat (or any name you prefer)
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Add environment variables:
   - `DISCORD_BOT_TOKEN`
   - `ENCRYPTION_KEY`
   - `PORT` (Render will provide the port automatically, but you can set it to 3000)
6. Click "Create Web Service"
7. Your app will be deployed to a URL like `https://discord-secure-chat.onrender.com`

### Option 2: Deploy to Railway (Free Tier Available)

1. Create an account on [Railway](https://railway.app/)
2. Start a new project and select "Deploy from GitHub repo"
3. Connect your GitHub repository
4. Add environment variables in the "Variables" tab:
   - `DISCORD_BOT_TOKEN`
   - `ENCRYPTION_KEY`
5. Railway automatically detects Node.js apps and deploys them
6. Your app will be assigned a domain like `https://discord-secure-chat.up.railway.app`

### Option 3: Deploy to Heroku (Paid)

1. Create an account on [Heroku](https://www.heroku.com/)
2. Install the Heroku CLI and log in
3. Navigate to your project directory and run:
   ```
   heroku create
   git push heroku main
   ```
4. Set environment variables:
   ```
   heroku config:set DISCORD_BOT_TOKEN=your_discord_bot_token
   heroku config:set ENCRYPTION_KEY=your_encryption_key
   ```
5. Your app will be deployed to a URL like `https://your-app-name.herokuapp.com`

### Sharing with Friends

Once deployed, share the URL with your friends. Each person will need:
1. The URL of your deployed app
2. Their own Discord User ID
3. The shared encryption key you've set in the environment variables

## License

MIT 