# 🎯 Getting Started - Complete Guide for New Users

Welcome! This guide will walk you through setting up and using the Overleaf-Zed extension from scratch.

---

## 📋 Prerequisites

Before you begin, make sure you have:

- ✅ **Zed Editor** - Download from [zed.dev](https://zed.dev)
- ✅ **Node.js (v16+)** - Download from [nodejs.org](https://nodejs.org)
- ✅ **Overleaf Account** - Free or Premium account at [overleaf.com](https://overleaf.com)
- ⚠️ **Git** (optional but recommended) - For version control

---

## 🚀 Step-by-Step Installation

### Step 1: Install the Extension

#### Option A: From Zed Extensions (When Published)
1. Open Zed
2. Press `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux)
3. Type: `zed: extensions`
4. Search for "overleaf"
5. Click **Install**

#### Option B: Install as Dev Extension (Current Method)
```bash
# Clone the repository
git clone https://github.com/YOUR_GITHUB_USERNAME/overleaf-zed-extension.git
cd overleaf-zed-extension

# Run the setup script
./setup.sh
```

The setup script will:
- ✅ Install Node.js dependencies
- ✅ Install the CLI tool globally
- ✅ Build the Zed extension (if Rust is installed)

### Step 2: Install the Extension in Zed

1. Open Zed Editor
2. Press `Cmd+Shift+P` → Type `zed: install dev extension`
3. Navigate to and select the `overleaf-zed-extension` folder
4. Wait for installation to complete

### Step 3: Verify Installation

1. Open Zed's **Settings** (Gear icon in bottom-right or `Cmd+,`)
2. Go to **External Agents** section
3. Scroll down to **Model Context Protocol (MCP) Servers**
4. You should see:
   - **overleaf** with green indicator dot ✅
   - Shows "13 tools" next to it
   - Toggle should be ON (blue)

If you see this, congratulations! The extension is installed correctly! 🎉

---

## 🔐 Step 4: Get Your Overleaf Cookie

The extension uses your browser session cookie to login (more secure than passwords, works with SSO).

### How to Get Your Cookie:

1. **Open your browser** (Chrome, Firefox, Safari, etc.)
2. **Go to** [https://www.overleaf.com](https://www.overleaf.com)
3. **Login** to your Overleaf account
4. **Press F12** to open Developer Tools
5. **Click the "Console" tab**
6. **Paste this code** and press Enter:

```javascript
document.cookie.split(';').find(c => c.includes('overleaf_session2'))
```

7. **Copy the output** - it will look like:
```
" overleaf_session2=s%3AnSraBO7L1wZWBOYPutl-1xOJXnw5wRrP.rEawmyH..."
```

⚠️ **Keep this cookie private!** It's like your password.

---

## 🎮 How to Use - Two Methods

You can use this extension in **two ways**: through the **CLI** or through **AI Assistant** in Zed.

---

## 🖥️ Method 1: Using the CLI (Command Line)

### Step 1: Login

Open your terminal and run:

```bash
overleaf-cli login
```

The CLI will guide you through two steps:

**Step 1a: Cookie Authentication (Required)**
```
🔐 Overleaf Login
════════════════════════════════════════

How to get your cookie:
1. Login to https://www.overleaf.com in your browser
2. Press F12 to open Developer Tools
3. Go to Console tab
4. Run: document.cookie.split(";").find(c => c.includes("overleaf_session2"))
5. Copy the output (format: overleaf_session2=s%3A...)

Enter your Overleaf cookie: [paste here]
```

**Step 1b: Git Token (Optional - Premium Users Only)**
```
🔑 Git Integration (Optional - Premium users only)
════════════════════════════════════════

Git integration allows bidirectional sync via git commands.
If you have an Overleaf Premium account, you can set up Git now.

How to get your Git token:
1. Go to https://www.overleaf.com/user/settings
2. Find the "Git Integration" section
3. Click "Generate token" or copy existing token
4. Token format: olp_xxxxxxxxxxxxxxxxxxxx

Enter Git token (or press Enter to skip): [paste here or skip]
```

After completing these steps:
```
✓ Logged in as YOUR_EMAIL@example.com
```

**Note:** Free users can skip the Git token - you'll still have full functionality via direct download!

### Step 2: List Your Projects

```bash
overleaf-cli list
```

You'll see all your Overleaf projects:
```
📚 Your Overleaf Projects
════════════════════════════════════════

1. My Thesis
   ID: 68c0b895d8bca38ce7a59ba6
   Owner: you@example.com
   Last updated: 12/9/2025

2. Research Paper
   ID: 67ace93d86d6242bc7e3c2fb
   ...
```

### Step 3: Download a Project

```bash
overleaf-cli setup
```

You'll be asked to select a project:
```
📚 Select a project:
1. My Thesis
2. Research Paper
...

Enter project number or ID: 1
```

The project will be downloaded to: `~/.overleaf-zed/projects/My_Thesis/`

**What happens:**
- ✅ If you have Overleaf Premium: Tries to clone via Git first
- ✅ If Git fails or free account: Downloads files directly
- ✅ Creates a local Git repository for version control
- ✅ Saves project metadata

### Step 4: Open in Zed

```bash
cd ~/.overleaf-zed/projects/My_Thesis
zed .
```

Now you can edit your LaTeX files in Zed! 🎉

### Step 5 (Optional): Enable Auto-Sync

If you want changes to automatically upload to Overleaf:

```bash
# In your project directory
overleaf-cli watch
```

Now:
- ✅ Edit any file in Zed
- ✅ Save (`Cmd+S` or `Ctrl+S`)
- ✅ After 2 seconds, changes automatically upload to Overleaf
- ✅ Automatically commits to Git (if initialized)

To stop watching, press `Ctrl+C`.

### Step 6 (Optional): Compile LaTeX

```bash
overleaf-cli compile
```

This will:
- ✅ Compile your project on Overleaf servers
- ✅ Download the PDF to `output.pdf`
- ✅ Show any compilation errors

---

## 🤖 Method 2: Using AI Assistant in Zed

This is the **smart way** - let Claude (Zed's AI) manage everything for you!

### Step 1: Open Zed's Agent Panel

1. Open Zed
2. Look for the **Agent Panel** (usually on the right side)
   - Or press `Cmd+Shift+A` to open it
3. You should see **Claude Code** interface

### Step 2: Login via Chat

Type in the Agent Panel:

```
Help me login to Overleaf with my cookie: overleaf_session2=s%3A...
```

Claude will:
1. Use the `overleaf_login_cookie` MCP tool
2. Log you in
3. Confirm your email

### Step 3: List Projects via Chat

```
Show me all my Overleaf projects
```

or

```
What LaTeX projects do I have on Overleaf?
```

Claude will:
1. Call `overleaf_list_projects` tool
2. Display your projects nicely formatted

### Step 4: Download a Project via Chat

```
Download my "Thesis" project and show me its structure
```

Claude will:
1. Find the project ID from your list
2. Call `overleaf_sync_download`
3. Download all files
4. Show you the file structure

### Step 5: Compile via Chat

```
Compile my Thesis project and tell me if there are any errors
```

Claude will:
1. Call `overleaf_compile`
2. Wait for compilation
3. Download the PDF
4. Report any errors or success

### More Examples of What You Can Ask:

```
"Create a new Overleaf project called 'Research Paper'"

"Read the main.tex file from my Thesis project"

"Update the introduction section in my paper with [new text]"

"Show me the compilation status of my last project"

"Start real-time sync for my current project"
```

---

## 📊 Comparison: CLI vs AI Assistant

| Feature | CLI Method | AI Assistant Method |
|---------|-----------|---------------------|
| **Speed** | ⚡ Fast | 🐌 Slower (AI thinks) |
| **Ease of Use** | Need to remember commands | Natural language |
| **Flexibility** | Powerful but manual | Claude figures it out |
| **Batch Operations** | Easy to script | Can handle complex requests |
| **Best For** | Power users, automation | Beginners, exploratory work |

**Recommendation**: 
- **New users** → Start with AI Assistant
- **Experienced users** → Use CLI for speed
- **Best of both** → Use AI to explore, CLI for routine tasks

---

## 🎯 Common Workflows

### Workflow 1: Simple Editing (No Sync)

Perfect for: Working offline, occasional edits

```bash
1. overleaf-cli setup              # Download project once
2. cd ~/.overleaf-zed/projects/MyProject
3. zed .                           # Edit in Zed
4. [Make your changes]
5. overleaf-cli compile            # Compile when done
```

**Pros**: Simple, no background processes  
**Cons**: Manual sync needed

### Workflow 2: Auto-Sync Editing

Perfect for: Active projects, collaboration

```bash
1. overleaf-cli setup              # Download project
2. cd ~/.overleaf-zed/projects/MyProject
3. overleaf-cli watch &            # Start background sync
4. zed .                           # Edit in Zed
# All changes auto-upload every 2 seconds
```

**Pros**: Seamless, always in sync  
**Cons**: Requires network connection

### Workflow 3: Git-Based (Premium Users)

Perfect for: Version control enthusiasts

```bash
1. overleaf-cli setup              # Clone via Git
2. cd ~/.overleaf-zed/projects/MyProject
3. zed .                           # Edit normally
4. git add . && git commit -m "Update"
5. git push                        # Push to Overleaf
```

**Pros**: Full Git power  
**Cons**: Requires Overleaf Premium

### Workflow 4: AI-Assisted

Perfect for: Beginners, complex tasks

In Zed's Agent Panel:
```
1. "Download my Thesis project"
2. "Open the main.tex file"
3. "Compile it and show me errors"
4. "Start auto-sync"
```

**Pros**: Easiest, no commands to remember  
**Cons**: Slower than CLI

---

## 🗂️ File Organization

After setup, your files are organized like this:

```
~/.overleaf-zed/
├── config.json                    # Your login info
└── projects/
    ├── My_Thesis/
    │   ├── .overleaf-meta.json    # Project metadata
    │   ├── .git/                  # Git repository
    │   ├── main.tex               # Your LaTeX files
    │   ├── chapters/
    │   └── output.pdf             # Compiled PDF
    └── Research_Paper/
        └── ...
```

---

## ❓ Troubleshooting

### Problem: "Not logged in" error

**Solution:**
```bash
overleaf-cli login
# Re-enter your cookie
```

Cookies expire after ~2 weeks. Just get a fresh one!

### Problem: Can't see the MCP server in Zed

**Solutions:**
1. Check Zed Settings → External Agents → MCP Servers
2. Make sure the toggle is ON (blue)
3. Restart Zed
4. Re-run `./setup.sh` in the extension directory

### Problem: "Command not found: overleaf-cli"

**Solution:**
```bash
cd overleaf-zed-extension/server
npm link
```

### Problem: Git clone fails

**This is normal!** Git clone only works for Premium users.

The CLI automatically falls back to direct download. You'll still get:
- ✅ All your files
- ✅ Local Git repository
- ✅ Full functionality

### Problem: Files not syncing with `watch`

**Solutions:**
1. Make sure `overleaf-cli watch` is running
2. Check for error messages
3. Verify you're in the project directory
4. Try restarting the watcher

### Problem: Cookie format error

**Solution:**
Make sure your cookie includes the full `overleaf_session2` part:
```
✅ Correct: overleaf_session2=s%3A...
❌ Wrong: s%3A...  (missing prefix)
```

---

## 🎓 Tips for Success

1. **Keep your cookie safe** - It's like your password
2. **Refresh cookie every 2 weeks** - They expire automatically
3. **Use `watch` for active projects** - Saves time
4. **Compile locally first** - Catch errors before uploading
5. **Use Git** - Even without Premium, local Git is useful
6. **Try AI assistant** - It can do complex multi-step operations
7. **Check output.pdf location** - It's in your project directory

---

## 🎉 You're Ready!

You now know everything you need to use the Overleaf-Zed extension!

**Quick Start Checklist:**
- [ ] Install the extension in Zed
- [ ] Get your Overleaf cookie
- [ ] Login via CLI or AI assistant
- [ ] List your projects
- [ ] Download one project
- [ ] Open it in Zed
- [ ] Make a test edit
- [ ] Try compiling

**Need Help?**
- 📖 Read the full [README.md](README.md)
- 🐛 Report issues on [GitHub](https://github.com/YOUR_GITHUB_USERNAME/overleaf-zed-extension/issues)
- 💬 Ask in [Discussions](https://github.com/YOUR_GITHUB_USERNAME/overleaf-zed-extension/discussions)

---

**Happy LaTeXing in Zed!** 🚀📝
