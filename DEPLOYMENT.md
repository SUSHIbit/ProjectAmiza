# Deployment Guide for Secure Discord Chat

This guide will walk you through deploying your Secure Discord Chat application so your friends can use it.

## Prerequisites

Before deployment, ensure you have:

1. A Discord bot token (from [Discord Developer Portal](https://discord.com/developers/applications))
2. Your Discord bot added to a server where your friends are members
3. Node.js installed on your local machine
4. Git installed on your local machine (for GitHub-based deployments)

## Prepare Your Application

1. Run the deployment helper script:
   ```
   npm run deploy
   ```
   
   This will guide you through setting up your environment variables.

2. Make sure your `.env` file contains valid values for:
   - `DISCORD_BOT_TOKEN` - Your Discord bot token
   - `ENCRYPTION_KEY` - The shared encryption key for all users

## Deployment Options

### Option 1: Deploy to Render (Free)

1. Create an account on [Render](https://render.com/)
2. Click "New" and select "Web Service"
3. Connect your GitHub repository or use the "Public Git repository" option
4. Configure the service:
   - Name: discord-secure-chat (or any name you prefer)
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Add environment variables:
   - `DISCORD_BOT_TOKEN` = Your Discord bot token
   - `ENCRYPTION_KEY` = Your shared encryption key
6. Click "Create Web Service"
7. Your app will be deployed to a URL like `https://discord-secure-chat.onrender.com`

### Option 2: Deploy to Railway (Free Tier Available)

1. Create an account on [Railway](https://railway.app/)
2. Start a new project and select "Deploy from GitHub repo"
3. Connect your GitHub repository
4. Add environment variables in the "Variables" tab:
   - `DISCORD_BOT_TOKEN` = Your Discord bot token
   - `ENCRYPTION_KEY` = Your shared encryption key
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

## Sharing with Friends

Once deployed, share these details with your friends:

1. The URL of your deployed app (e.g., `https://discord-secure-chat.onrender.com`)
2. The shared encryption key you've set in the environment variables
3. Instructions for them to find their Discord User ID:
   - Enable Developer Mode in Discord (User Settings > Advanced > Developer Mode)
   - Right-click on their username and select "Copy ID"

## Usage Instructions for Friends

Send these instructions to your friends:

1. Visit the deployed app URL in your browser
2. On the login page, enter:
   - Any username you prefer
   - Your Discord User ID (obtained through Developer Mode)
   - The shared encryption key (provided by the app owner)
3. Click "Login"
4. Select a friend from the list to start chatting
5. Messages will appear in plaintext in the browser, but as encrypted text in Discord

## Troubleshooting

If your friends don't see any contacts:
1. Make sure the Discord bot is in at least one server with them
2. Check that they've entered their correct Discord User ID
3. Make sure the Discord bot has all required intents enabled

If messages aren't sending:
1. Verify the encryption key is consistent for all users
2. Check if the Discord bot has permission to send direct messages
3. Ensure the friends have direct messages enabled from server members 