# WhatsApp Bot - Toshiro MD Mini Bot

## Overview
This is a WhatsApp bot built with Baileys library that provides various commands and features for WhatsApp groups and personal chats. The bot is designed with a clean, modular architecture.

## Current State
- **Status**: Successfully refactored and running in Replit environment
- **Last Updated**: November 10, 2025
- **Main Entry Point**: index.js
- **Command Prefix**: $ (dollar sign)
- **Bot Name**: TOSHIRO MD MINI BOT
- **Creators**: horlapookie & toshiro

## Project Architecture

### Core Structure
- **index.js**: Main bot file that handles WhatsApp connection, message events, and command routing
- **horlapookie/**: Directory containing all command modules (17 commands)
- **toshiro-helper/**: Helper modules for media operations
- **lib/**: Utility libraries (menuHelper.js for menu system)
- **database/json/**: JSON storage for banned users, moderators, warnings, and scores

### Key Files
- **package.json**: Node.js dependencies and scripts
- **.env**: Environment variables (contains OPENAI_API_KEY)
- **database/json/banned.json**: Banned users list
- **database/json/warns.json**: User warnings data
- **database/json/scores.json**: Trivia game scores
- **database/json/trivia.json**: Trivia questions
- **auth_info/**: Authentication session folder for WhatsApp connection (requires creds.json)

### Dependencies
- @whiskeysockets/baileys (v6.7.2): WhatsApp Web API
- openai (v4.100.0): AI-powered commands (ask)
- axios, cheerio: Web scraping and API calls
- node-fetch: HTTP requests for media downloads
- pino: Logging

## Features

### Commands (17 total)

#### General Commands
- **$menu** / **$help**: Show all available commands with command count
- **$ping**: Check bot latency
- **$uptime**: Check how long bot has been running
- **$time**: Get current time
- **$info**: Get command information
- **$userinfo**: Get user information
- **$profile**: View user profile

#### Group Management (Combined)
- **$group kick**: Kick a member from the group
- **$group ban**: Ban a user from using the bot
- **$group unban**: Unban a user
- **$group promote**: Promote a member to admin
- **$group demote**: Demote an admin to member
- **$group tagall**: Mention all group members categorized by role
- **$group warn**: Warn a user
- **$group lock**: Lock group (only admins can send messages)
- **$group unlock**: Unlock group (everyone can send messages)

#### AI Commands
- **$ask**: Ask AI a question using ChatGPT

#### Media Commands (Toshiro Helper)
- **$xsearch**: Search for Xvideos content
- **$xget**: Download Xvideos video from link
- **$screenshot**: Take a screenshot of a website

#### Fun Commands
- **$echo**: Echo your message
- **$joke**: Get a random joke
- **$quote**: Get a random quote

#### Utility Commands
- **$viewonce**: View once media
- **$delete**: Delete a message

### Owner Commands
- **$on**: Activate the bot (owner only)
- **$off**: Deactivate the bot (owner only)
- **Owner Number**: 2348028336218

## Setup & Configuration

### Authentication
The bot uses WhatsApp Web authentication. To connect:
1. You need to provide a valid `creds.json` file in the `auth_info/` folder
2. This file contains your WhatsApp session credentials
3. QR code terminal printing is disabled - you must manage authentication manually

### Environment Variables
- **OPENAI_API_KEY**: Required for AI commands ($ask)

### Workflow
- **Name**: WhatsApp Bot
- **Command**: node index.js
- **Type**: Console application (no web interface)

## Recent Changes (November 10, 2025)

### Major Refactoring
1. **Folder Structure**:
   - Created `database/json/` for all JSON data files
   - Created `toshiro-helper/` for helper modules
   - Renamed `commands/` to `horlapookie/`

2. **File Organization**:
   - Renamed `bot.js` to `index.js`
   - Moved all JSON files to `database/json/`
   - Updated all file paths throughout the project

3. **Session Management**:
   - Changed session folder from `Success/` to `auth_info/`
   - Disabled QR code terminal printing (printQRInTerminal: false)
   - Users must provide their own creds.json file

4. **Command Consolidation**:
   - Combined all group commands (kick, ban, promote, demote, tagall, warn, lock, unlock) into `horlapookie/groups.js`
   - Refactored xget and xvideos to use shared `toshiro-helper/xmedia.js` helper
   - Renamed xvideos-search to xsearch

5. **Menu System**:
   - Created `lib/menuHelper.js` with command metadata
   - Created `horlapookie/menu.js` with formatted menu display
   - Menu shows command count, creator names, bot header, and prefix

6. **Removed Features**:
   - Removed moderator management functions from index.js
   - Removed welcome/goodbye message handlers from index.js
   - Deleted individual group command files (now consolidated)

## Notes
- The bot runs as a console application and connects to WhatsApp Web
- No web frontend or API server required
- Maintains persistent state through JSON files
- Automatically reconnects if connection is lost
- Ban system prevents banned users from using bot commands
- All 17 commands load successfully on startup

## User Preferences
None specified yet.
