# Overleaf-Zed Extension 🚀

[English](README.md) | [简体中文](README.zh-CN.md)

> **Git + MCP Hybrid Workflow** - Sync, edit, and compile Overleaf LaTeX projects in Zed with intelligent file watching and automatic synchronization.

Inspired by [Overleaf Workshop](https://github.com/iamhyc/Overleaf-Workshop) for VS Code, this extension brings seamless Overleaf integration to Zed through a powerful combination of Git and MCP (Model Context Protocol).

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Zed Extension](https://img.shields.io/badge/Zed-Extension-blue)](https://zed.dev)

---

## ✨ Features

### 🎯 Core Capabilities
- 🔐 **Cookie-Based Authentication** - Secure login with browser session (supports SSO, no password needed)
- 📁 **Smart Project Management** - CLI tool for easy project setup and management
- 🔄 **Real-Time File Sync** - Automatic bidirectional sync with file watching
- 🌳 **Git Integration** - Full Git support for Overleaf Premium users
- 🔨 **LaTeX Compilation** - One-command compilation with PDF download
- 🤖 **MCP Integration** - AI-powered assistance through Zed's Agent Panel
- 📝 **Complete File Operations** - Create, read, update, delete files seamlessly

### 🎁 Bonus Features
- ⚡ Auto-commit & push to Git on file changes
- 👀 File watcher with debouncing (2-second wait for batch changes)
- 📊 Beautiful CLI with color-coded output
- 🗂️ Local project organization in `~/.overleaf-zed/projects/`
- 🔧 Extensible API for custom workflows

---

## 🚀 Quick Start (5 Minutes)

### Method 1: One-Command Setup (Recommended)

```bash
# Clone and setup everything automatically
git clone https://github.com/YOUR_GITHUB_USERNAME/overleaf-zed-extension.git
cd overleaf-zed-extension
./setup.sh
```

### Method 2: Manual Setup

```bash
# 1. Install Node.js dependencies
cd server && npm install

# 2. Install CLI tool globally
npm link

# 3. Build Zed extension (if you have Rust)
cd .. && cargo build --release
```

---

## 📖 Usage Guide

### Step 1: Login to Overleaf

```bash
overleaf-cli login
# Paste your cookie when prompted
```

**How to get your cookie:**
1. Login to [Overleaf](https://www.overleaf.com) in your browser
2. Press `F12` → **Console** tab
3. Run: `document.cookie.split(';').find(c => c.includes('overleaf_session2'))`
4. Copy the output

### Step 2: List Your Projects

```bash
overleaf-cli list
# Shows all your projects with IDs
```

### Step 3: Setup a Project

```bash
# Interactive mode (choose from list)
overleaf-cli setup

# Or specify project ID directly
overleaf-cli setup 68c0b895d8bca38ce7a59ba6
```

This will:
- ✅ Try Git clone first (for Premium users)
- ✅ Fallback to direct download if Git fails
- ✅ Save to `~/.overleaf-zed/projects/YourProject/`
- ✅ Initialize local Git repo

### Step 4: Edit in Zed

```bash
cd ~/.overleaf-zed/projects/YourProject
zed .
```

### Step 5: Auto-Sync (Optional)

```bash
# In project directory
overleaf-cli watch

# Now every file change automatically:
# 1. Uploads to Overleaf (2 sec delay)
# 2. Commits to Git locally
# 3. Pushes to remote (if configured)
```

### Step 6: Compile LaTeX

```bash
overleaf-cli compile
# PDF saved at: output.pdf
```

---

## 🛠️ Advanced Usage

### Git Workflow (For Premium Users)

```bash
# Clone with official Git URL
overleaf-cli setup

# Enable Git remote for push/pull
cd ~/.overleaf-zed/projects/YourProject
git remote add overleaf https://git.overleaf.com/68c0b895d8bca38ce7a59ba6

# Work normally with Git
git pull overleaf master
git push overleaf master
```

### MCP Tools in Zed

The extension also provides MCP tools accessible through Zed's Agent Panel:

| Tool | Description |
|------|-------------|
| `overleaf_login_cookie` | Login with browser cookie |
| `overleaf_list_projects` | List all projects |
| `overleaf_get_project` | View project structure |
| `overleaf_sync_download` | Download project files |
| `overleaf_sync_upload` | Upload specific file |
| `overleaf_compile` | Compile and get PDF |
| `overleaf_start_sync` | Start real-time sync |
| `overleaf_stop_sync` | Stop real-time sync |
| `overleaf_sync_status` | Check sync status |

**Example (in Zed Agent Panel):**
```
Ask Claude: "Compile my PhD Project and show me any errors"
→ Claude will use overleaf_compile tool automatically
```

---

## 📂 Project Structure

```
overleaf-zed-extension/
├── setup.sh                    # One-command setup script
├── extension.toml              # Zed extension manifest
├── Cargo.toml                  # Rust dependencies
├── src/
│   └── lib.rs                  # Zed extension (WebAssembly)
├── server/
│   ├── package.json            # Node.js dependencies
│   ├── index.js                # MCP server
│   ├── cli.js                  # CLI tool
│   ├── file-watcher.js         # File watching & auto-sync
│   └── overleaf-api.js         # Overleaf API client
├── LICENSE                     # MIT License
└── README.md                   # This file
```

---

## 🎯 Workflows

### Workflow 1: Simple Local Editing

```bash
1. overleaf-cli setup           # Download project
2. cd project && zed .          # Open in Zed
3. Edit files...                # Work normally
4. overleaf-cli compile         # Compile when ready
```

### Workflow 2: Real-Time Sync

```bash
1. overleaf-cli setup           # Download project
2. cd project                   
3. overleaf-cli watch &         # Start background sync
4. zed .                        # Open in Zed
# All changes auto-sync to Overleaf every 2 seconds
```

### Workflow 3: Git-Based (Premium)

```bash
1. overleaf-cli setup           # Clone via Git
2. cd project && zed .          
3. git add . && git commit      # Standard Git workflow
4. git push                     # Push to Overleaf
```

### Workflow 4: AI-Assisted (via MCP)

```
1. Open Zed's Agent Panel
2. Ask Claude: "List my Overleaf projects"
3. Ask: "Download my PhD thesis and show me the structure"
4. Ask: "Compile it and tell me if there are errors"
→ Claude uses MCP tools automatically
```

---

## 🔧 Configuration

### Config File Location
`~/.overleaf-zed/config.json`

```json
{
  "cookie": "overleaf_session2=...",
  "email": "YOUR_EMAIL@example.com",
  "serverUrl": "https://www.overleaf.com"
}
```

### Projects Location
`~/.overleaf-zed/projects/`

Each project folder contains:
- `.overleaf-meta.json` - Project metadata
- `.git/` - Git repository (if initialized)
- Your LaTeX files

---

## 🔥 Recent Improvements (2025-12)

### ✅ What's Working
- **CSRF Token Fix**: Properly extracts CSRF tokens from Overleaf HTML for write operations
- **Auto-Push System**: Automatically commits and pushes changes to Git remote on file save
- **Recursive Folder Creation**: MCP sync now creates nested folders automatically
- **Improved Error Handling**: Better error messages for authentication and network issues
- **File Watcher Stability**: Debounced file watching (2-second delay) prevents duplicate uploads

### 🚀 New Features Added
1. **Smart Git Integration**
   - Automatically adds `overleaf` remote during setup
   - Auto-commit with descriptive messages on every change
   - Auto-push to Overleaf Git repository (for Premium users)

2. **Enhanced MCP Tools**
   - `overleaf_create_folder` - Create nested folder structures
   - Improved error handling in all MCP operations
   - Better CSRF token management for write operations

3. **CLI Improvements**
   - Color-coded output for better readability
   - Interactive project selection
   - Automatic fallback from Git to direct download

---

## 🐛 Known Issues & Troubleshooting

### 🔴 Current Known Issues

1. **CSRF Token Extraction** ⚠️
   - **Issue**: CSRF token sometimes fails to extract from Overleaf HTML
   - **Impact**: Write operations (upload/delete files, compile) may fail
   - **Workaround**: Get a fresh cookie with `overleaf-cli login`
   - **Status**: Under investigation - Overleaf may have changed their HTML structure

2. **MCP Tools Not Working in Zed** ⚠️
   - **Issue**: Zed's Agent Panel cannot see/use MCP tools from this extension
   - **Root Cause**: Zed's MCP configuration issues or extension manifest problems
   - **Workaround**: Use CLI commands directly (`overleaf-cli ...`)
   - **Status**: Needs further investigation with Zed's MCP integration

3. **File Watcher Performance** ⚠️
   - **Issue**: Watching large projects (>100 files) can be slow
   - **Workaround**: Use Git workflow instead of `watch` command
   - **Status**: Considering optimization options

### 🟡 Common User Errors

#### "Not logged in" Error
```bash
# Re-login with fresh cookie
overleaf-cli login
```

#### File Sync Not Working
```bash
# Check if watcher is running
ps aux | grep "overleaf-cli watch"

# Restart watcher
pkill -f "overleaf-cli watch"
overleaf-cli watch
```

#### Git Clone Fails
- **Expected for free accounts** - Overleaf Git access requires Premium
- The CLI automatically falls back to direct download
- A local Git repo is still created for version control
- You can still use Git locally, just can't push to Overleaf remote

#### CSRF Token Warning
```
⚠️ Warning: No CSRF token found
```
- Most read operations work fine without CSRF token
- Write operations (upload, delete, compile) may fail
- **Solution**: Get a fresh cookie with `overleaf-cli login`

#### Auto-Push Fails
```bash
# Check if remote is configured
git remote -v

# Add Overleaf remote if missing
git remote add overleaf https://git.overleaf.com/YOUR_PROJECT_ID

# Test manual push
git push overleaf master
```

### 🔧 Advanced Troubleshooting

#### Debug Mode
```bash
# Enable verbose logging
DEBUG=overleaf:* overleaf-cli watch

# Check MCP server logs
tail -f ~/.overleaf-zed/mcp-server.log
```

#### Clear Cached Data
```bash
# Remove all cached data
rm -rf ~/.overleaf-zed/cache/

# Re-login
overleaf-cli login
```

#### Test API Connection
```bash
# List projects to test authentication
overleaf-cli list

# If this fails, check:
# 1. Cookie is valid (login to Overleaf in browser first)
# 2. Network connection works
# 3. Overleaf service is not down
```

---

## 📊 Comparison with VS Code Extension

| Feature | Overleaf Workshop (VS Code) | This Extension (Zed) |
|---------|----------------------------|----------------------|
| Virtual Filesystem | ✅ Yes | ❌ No (Zed limitation) |
| Real-time Collaboration | ✅ WebSocket | ⚠️ Planned |
| File Sync | ✅ Automatic | ✅ Auto via watcher |
| Git Integration | ❌ No | ✅ Yes (Premium) |
| CLI Tool | ❌ No | ✅ Yes |
| MCP Integration | ❌ No | ✅ Yes |
| Auto Git Commit | ❌ No | ✅ Yes |
| PDF Preview | ✅ In-editor | ⚠️ External |

---

## 🤝 Contributing

Contributions are welcome! Here are some ideas:

- [ ] Add WebSocket support for real-time collaboration
- [ ] Implement in-editor PDF preview
- [ ] Add SyncTeX support (PDF ↔ source jumping)
- [ ] Create GUI for project management
- [ ] Support for self-hosted Overleaf instances

**To contribute:**
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

---

## 📜 Credits

- Inspired by [Overleaf Workshop](https://github.com/iamhyc/Overleaf-Workshop) for VS Code
- API implementation based on reverse-engineering by [@iamhyc](https://github.com/iamhyc)
- Built for [Zed Editor](https://zed.dev) by Zed Industries
- Uses [Model Context Protocol](https://modelcontextprotocol.io) by Anthropic

---

## 📝 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🌟 Star History

If this project helps you, please consider giving it a ⭐ on GitHub!

---

## 📧 Support

- **Issues**: [GitHub Issues](https://github.com/YOUR_GITHUB_USERNAME/overleaf-zed-extension/issues)
- **Discussions**: [GitHub Discussions](https://github.com/YOUR_GITHUB_USERNAME/overleaf-zed-extension/discussions)
- **Email**: YOUR_EMAIL@example.com

---

---

## 🚀 Quick Commands Reference

```bash
# After installation:
overleaf-commit         # Smart commit with AI-generated message
overleaf-sync          # Sync from Overleaf to local
git pull overleaf master   # Pull from Overleaf (Git method)
git push overleaf master   # Push to Overleaf (Git method)
```

---

**Made with ❤️ for the LaTeX & Zed community**
