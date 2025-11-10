# WhatsApp Bot

## Overview
This is a WhatsApp bot built with Baileys library that provides various commands and features for WhatsApp groups and personal chats. The bot supports over 50 different commands including media downloads, games, moderation tools, AI-powered features, and more.

## Current State
- **Status**: Successfully configured and running in Replit environment
- **Last Updated**: November 10, 2025
- **Main Entry Point**: bot.js
- **Command Prefix**: $ (dollar sign)

## Project Architecture

### Core Structure
- **bot.js**: Main bot file that handles WhatsApp connection, message events, and command routing
- **commands/**: Directory containing 50+ individual command modules
- **lib/**: Utility libraries (arts.js for ASCII art)
- **data/**: JSON storage for scores and trivia questions

### Key Files
- **package.json**: Node.js dependencies and scripts
- **.env**: Environment variables (contains OPENAI_API_KEY)
- **moderators.json**: List of bot moderators
- **banned.json**: Banned users list
- **welcomeConfig.json**: Welcome/goodbye message configuration per group
- **Success/**: Authentication session folder for WhatsApp connection

### Dependencies
- @whiskeysockets/baileys (v6.7.21): WhatsApp Web API
- openai (v4.100.0): AI-powered commands (ask, translate)
- axios, cheerio: Web scraping and API calls
- fluent-ffmpeg, node-webpmux: Media processing
- pino: Logging
- yt-search, ytsr, @distube/ytdl-core: YouTube features

## Features

### Admin Commands
Owner-only commands using phone number: 2348028336218
- $on / $off: Toggle bot activation
- Ban/unban users
- Promote/demote moderators

### Popular Commands
- **Media**: $yt (YouTube), $tiktok, $sticker, $screenshot
- **AI**: $ask (ChatGPT), $translate
- **Games**: $hangman, $trivia, $roll
- **Info**: $help, $ping, $uptime, $botinfo
- **Moderation**: $ban, $kick, $warn, $tagall
- **Fun**: $joke, $insult, $quote, $meme

## Setup & Configuration

### Authentication
The bot uses QR code authentication for WhatsApp. On first run:
1. A QR code will appear in the terminal console
2. Scan it with your WhatsApp mobile app
3. Session data is saved in the Success/ folder
4. Subsequent runs will use saved credentials

### Environment Variables
- **OPENAI_API_KEY**: Required for AI commands ($ask, $translate)

### Workflow
- **Name**: WhatsApp Bot
- **Command**: npm start
- **Type**: Console application (no web interface)

## Recent Changes
- **2025-11-10**: Initial setup in Replit environment
  - Installed all npm dependencies
  - Fixed Baileys import syntax for compatibility
  - Added .gitignore to protect sensitive files and session data
  - Configured workflow to run the bot

## Notes
- The bot runs as a console application and connects to WhatsApp Web
- No web frontend or API server required
- Maintains persistent state through JSON files
- Automatically reconnects if connection is lost
- Some commands have NSFW content (configurable/removable if needed)

## User Preferences
None specified yet.
