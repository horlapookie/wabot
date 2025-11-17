# WhatsApp Bot Project

## Overview
This is a WhatsApp bot built using the Baileys library. It supports various commands for group management, utilities, and entertainment features.

## Project Structure
- **index.js** - Main bot file that handles connections and command routing
- **horlapookie/** - Command modules directory
  - **media.js** - YouTube downloader commands (music, video, audio, videofile)
- **utils/** - Utility functions
  - **ytDownloader.js** - Obfuscated YouTube API and download functions
- **auth_info/** - WhatsApp authentication credentials
- **database/json/** - JSON-based storage for moderators, scores, trivia, warnings, etc.
  - **1/2/3/4/5/** - Nested folder containing YouTube API key
- **lib/** - Helper utilities
- **toshiro-helper/** - Additional media helpers
- **temp/** - Temporary storage for downloaded media files
- **images/** - Menu images (menu1.jpg, menu2.jpg) for bot menu and connection messages

## Features
The bot includes commands for:
- AI interactions
- Group management (kick, ban, promote, demote, warnings)
- Utilities (ping, time, uptime, info, screenshot)
- Entertainment (jokes, quotes, urban dictionary)
- Media handling (view once, downloads)
- YouTube Downloads (music, video, audio files, video files)
- Web searches (Google, GitHub, xvideos)

## Command Prefix
All commands use the `$` prefix (e.g., `$ping`, `$menu`)

## Bot Owner
The bot automatically detects the owner number from the WhatsApp authentication credentials.

## Recent Changes (Nov 17, 2025)
- Added YouTube downloader with API integration
- Created 4 new media commands: music, video, audio, videofile
- Implemented bot-detection bypass with realistic headers
- Added retry logic with exponential backoff for failed downloads
- Obfuscated downloader functions for security
- Stored YouTube API key in nested folder structure (database/json/1/2/3/4/5/)
- Updated menu to include new downloader commands
- Added menu images (menu1.jpg and menu2.jpg) that display randomly with the menu
- Added connection message with image when bot starts - sent to owner with bot name and prefix

## Previous Changes (Nov 11, 2025)
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
