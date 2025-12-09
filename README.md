# Overleaf-Zed Extension 🚀

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

## 🐛 Troubleshooting

### "Not logged in" Error
```bash
# Re-login with fresh cookie
overleaf-cli login
```

### File Sync Not Working
```bash
# Check if watcher is running
ps aux | grep "overleaf-cli watch"

# Restart watcher
pkill -f "overleaf-cli watch"
overleaf-cli watch
```

### Git Clone Fails
- This is normal for free accounts
- The CLI will automatically fallback to direct download
- A local Git repo will still be created for version control

### CSRF Token Warning
- This is harmless - most operations don't need CSRF token
- If you encounter issues, get a fresh cookie

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
