# WhatsApp Bot Project

## Overview
This is a WhatsApp bot built using the Baileys library. It supports various commands for group management, utilities, and entertainment features.

## Project Structure
- **index.js** - Main bot file that handles connections and command routing
- **horlapookie/** - Command modules directory
- **auth_info/** - WhatsApp authentication credentials
- **database/json/** - JSON-based storage for moderators, scores, trivia, warnings, etc.
- **lib/** - Helper utilities
- **toshiro-helper/** - Additional media helpers

## Features
The bot includes commands for:
- AI interactions
- Group management (kick, ban, promote, demote, warnings)
- Utilities (ping, time, uptime, info, screenshot)
- Entertainment (jokes, quotes, urban dictionary)
- Media handling (view once, downloads)
- Web searches (Google, GitHub, xvideos)

## Command Prefix
All commands use the `$` prefix (e.g., `$ping`, `$menu`)

## Bot Owner
The bot automatically detects the owner number from the WhatsApp authentication credentials.

## Recent Changes (Nov 11, 2025)
- Migrated project to Replit environment
- Installed all npm dependencies
- Configured workflow to run `npm start`
- Verified bot starts successfully and loads all commands

## Running the Bot
The bot runs automatically via the "WhatsApp Bot" workflow which executes `npm start`.

## Dependencies
See package.json for full list. Key dependencies include:
- @whiskeysockets/baileys - WhatsApp connection
- openai - AI features
- axios, cheerio - Web scraping
- fluent-ffmpeg - Media processing
- Various YouTube/video download libraries
