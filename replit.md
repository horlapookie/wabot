# Overview

This is a WhatsApp bot built using the Baileys library (@whiskeysockets/baileys). The bot provides various features including media downloading, AI chat, group management, and utility commands. It's designed to run as a Node.js application that connects to WhatsApp Web and responds to commands prefixed with `$`.

The bot serves as a multi-purpose assistant for WhatsApp users and groups, offering entertainment, utility, and administrative functions.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Core Bot Framework

**Technology Stack:**
- **Runtime:** Node.js with ES Modules
- **WhatsApp Library:** @whiskeysockets/baileys v6.7.2
- **Logging:** Pino for structured logging
- **Package Manager:** npm

**Authentication & Session Management:**
- Uses multi-file authentication state stored in `auth_info/` directory
- Maintains persistent sessions with credentials, pre-keys, and session files
- Supports pairing-based authentication via QR code scanning

**Design Pattern:**
- Command-based architecture with modular command handlers
- Each command is a separate module in the `horlapookie/` directory
- Commands export a standard interface with `name`, `description`, and `execute()` function
- Centralized command prefix system (`$`)

## Command System

**Command Loading:**
- Commands are organized as individual ES modules
- Each command exports an object with metadata and execution function
- Commands receive message context and socket instance for WhatsApp operations

**Command Categories:**
- General (menu, ping, uptime, info)
- Group Management (kick, ban, promote, antilink)
- AI & Search (ai, google, urban)
- Media (play, video, music, xvideos)
- Utility (viewonce, delete, screenshot)
- Fun (echo, joke, quote)

**Permission System:**
- Owner-based permissions using phone number validation
- Moderator system with JSON-based storage
- Group admin detection for group-specific commands
- Ban system for blocking users from bot commands

## Media Handling

**YouTube Integration (Updated November 2025):**
- Search capability using `yt-search` library
- Download support using free third-party APIs (no authentication required)
  - Primary API: noobs-api.top/dipto/ytDl3
  - Fallback API: api.agatz.xyz/api/ytmp3 and ytmp4
- Automatic fallback system if primary API fails
- Robust file download with redirect and timeout handling
- File validation to ensure download integrity
- Temporary file management with automatic cleanup
- Note: @distube/ytdl-core is archived and no longer works on cloud/VPS environments

**Media Processing:**
- Audio extraction and conversion
- Video downloading with quality selection
- Thumbnail extraction
- File format handling (MP3, MP4, M4A)

**Third-party Media:**
- Xvideos search and download functionality
- Web scraping using Cheerio
- Custom media fetching utilities

## Group Management

**Admin Functions:**
- Member kick/ban with admin verification
- Promote/demote admin privileges
- Group settings modification (lock/unlock)
- Tag all members functionality
- Warning system with JSON persistence

**Anti-link Protection:**
- Configurable link detection and removal
- Multiple action modes: delete, kick, warn
- Per-group settings storage
- Admin-only configuration

**Group Metadata:**
- Group info retrieval
- Invite link generation
- Profile picture access
- Member list management

## Data Storage

**File-based Persistence:**
- JSON files for configuration and state
- Database structure in `database/json/`:
  - `antilink.json` - Group antilink settings
  - `moderators.json` - Bot moderator list
  - `warns.json` - User warning records
  - `banned.json` - Banned users
  - `scores.json` - User scores/statistics
  - `trivia.json` - Trivia game data
  - `1/2/3/4/5/api keys` - API keys storage (e.g., OpenAI key for future use)

**Session Storage:**
- Authentication credentials in `auth_info/`
- Pre-keys for encryption
- Sender keys for group messaging
- Session tokens per device

## AI & Search Features

**AI Integration:**
- Chat functionality using external API (Popcat/DuckDuckGo)
- Query processing and response formatting
- Error handling for API failures

**Search Capabilities:**
- Google search via DuckDuckGo API
- Urban Dictionary integration
- GitHub repository information
- YouTube search and metadata

## Error Handling & Logging

**Console Management:**
- Custom console.error and console.log overrides
- Filtered logging to suppress common Baileys errors
- Session error suppression for cleaner logs

**Error Recovery:**
- Graceful handling of API failures
- Fallback mechanisms for downloads
- User-friendly error messages
- Try-catch blocks in all command handlers

## Helper Libraries

**Utility Functions:**
- `lib/isAdmin.js` - Admin verification for groups
- `lib/emojis.js` - Emoji configuration loader
- `lib/mediaHelper.js` - YouTube ID extraction and download helpers
- `lib/menuHelper.js` - Command categorization and help generation
- `lib/antilinkSettings.js` - Antilink configuration management

**Download Utilities:**
- `utils/ytDownloader.js` - YouTube download orchestration
- `toshiro-helper/xmedia.js` - Adult content platform integration

# External Dependencies

## Third-party APIs

**Popcat API:**
- AI chatbot responses
- Free tier usage
- Purpose: Conversational AI feature

**DuckDuckGo Instant Answer API:**
- Search results and definitions
- No API key required
- Purpose: Google search alternative, Urban Dictionary lookups

**Noobs API (Primary):**
- YouTube MP3/MP4 downloads via noobs-api.top
- No authentication required
- Free tier usage
- Purpose: Primary YouTube download method

**Agatz API (Fallback):**
- YouTube MP3/MP4 downloads via api.agatz.xyz
- No authentication required
- Free tier usage
- Purpose: Backup download method when primary fails

**GitHub API:**
- Repository information retrieval
- Rate-limited public access
- Purpose: Repository stats and download links

**Urban Dictionary API:**
- Slang term definitions
- Public API access
- Purpose: Dictionary lookups

**Xvideos (Web Scraping):**
- Content search via web scraping
- Direct download link extraction
- Purpose: Adult content downloads

## NPM Packages

**Core Dependencies:**
- `@whiskeysockets/baileys` - WhatsApp Web API
- `pino` - Logging framework
- `axios` - HTTP client
- `node-fetch` - Fetch API implementation
- `dotenv` - Environment variable management

**Media Processing:**
- `@distube/ytdl-core` - Archived, no longer functional (kept as legacy dependency)
- `yt-search` - YouTube search and metadata retrieval
- `ytsr` - YouTube search alternative
- `youtube-dl-exec` - YouTube-dl wrapper (installed but not used)
- `play-dl` - Media download library (installed as fallback)
- `fluent-ffmpeg` - FFmpeg wrapper
- `ffmpeg-static` - Bundled FFmpeg binary
- `node-webpmux` - WebP manipulation

**Web Scraping & Parsing:**
- `cheerio` - HTML parsing for scraping

**AI & Language:**
- `openai` - OpenAI API client (installed but not actively used in shown code)

**Utilities:**
- `date-fns` - Date formatting and manipulation
- `fs` (built-in) - File system operations
- `https` (built-in) - HTTPS requests
- `path` (built-in) - Path utilities

## Development Tools

- `javascript-obfuscator` - Code obfuscation (dev dependency)

## File System Structure

**Temporary Files:**
- `temp/` directory for downloaded media
- Automatic cleanup after sending
- Audio and video file caching

**Data Directories:**
- `database/json/` - Persistent JSON data
- `auth_info/` - WhatsApp authentication
- `data/` - Static configuration (emojis)
- `horlapookie/` - Command modules
- `lib/` - Helper utilities
- `utils/` - Download utilities
- `toshiro-helper/` - Custom integrations