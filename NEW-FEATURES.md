# 🆕 New Features - Bidirectional Sync & Custom Directories

## What's New

### 1. Custom Projects Directory
You can now store your Overleaf projects anywhere you want!

```bash
# Set custom projects directory
overleaf-cli config projectsDir ~/Documents/overleaf

# Or use environment variable
export OVERLEAF_PROJECTS_DIR=~/Documents/overleaf
overleaf-cli setup
```

**Priority**:
1. Config file setting (`overleaf-cli config projectsDir`)
2. Environment variable (`OVERLEAF_PROJECTS_DIR`)
3. Default (`~/.overleaf-zed/projects`)

### 2. Bidirectional Auto-Sync
True bidirectional synchronization between local and Overleaf!

```bash
# Start bidirectional auto-sync
cd your-project
overleaf-cli auto-sync

# Features:
# - Local → Overleaf: Real-time file watching
# - Overleaf → Local: Checks every 30 seconds via Git
# - Automatic conflict resolution
```

### 3. Easy Auto-Start Setup
One command to set up auto-sync on system startup!

```bash
# Automatic setup for macOS (launchd) or Linux (systemd)
./scripts/setup-auto-sync.sh /path/to/project

# Works on:
# - macOS: Uses launchd
# - Linux: Uses systemd user services
```

### 4. New CLI Commands

```bash
# View/edit configuration
overleaf-cli config                              # Show all settings
overleaf-cli config projectsDir ~/my-projects    # Set projects directory
overleaf-cli config serverUrl https://custom.overleaf.com  # Custom server

# Pull remote changes
overleaf-cli pull                                # In project directory

# Bidirectional sync
overleaf-cli auto-sync                           # Start auto-sync
```

## Migration Guide

### For Existing Users

If you already have projects in `~/.overleaf-zed/projects/` and want to move them:

```bash
# 1. Set your preferred directory
overleaf-cli config projectsDir ~/Documents/overleaf

# 2. Move existing projects
mv ~/.overleaf-zed/projects/* ~/Documents/overleaf/

# 3. Or use symlink (no need to move files)
rm -rf ~/.overleaf-zed/projects
ln -s ~/Documents/overleaf ~/.overleaf-zed/projects
```

### For New Users

```bash
# 1. Install and login
npm install -g overleaf-mcp-server
overleaf-cli login

# 2. (Optional) Set custom directory
overleaf-cli config projectsDir ~/Documents/overleaf

# 3. Clone a project
overleaf-cli setup

# 4. Set up auto-sync (optional)
cd ~/Documents/overleaf/your-project-id
./scripts/setup-auto-sync.sh .
```

## Configuration File

The config file is stored at `~/.overleaf-zed/config.json`:

```json
{
  "cookie": "overleaf_session2=...",
  "email": "user@example.com",
  "serverUrl": "https://www.overleaf.com",
  "gitToken": "olp_xxxxx",
  "projectsDir": "/Users/username/Documents/overleaf"
}
```

## Environment Variables

- `OVERLEAF_PROJECTS_DIR`: Override default projects directory
- Example: `export OVERLEAF_PROJECTS_DIR=~/my-overleaf-projects`

## Platform Support

| Feature | macOS | Linux | Windows |
|---------|-------|-------|---------|
| Custom directory | ✅ | ✅ | ✅ |
| Bidirectional sync | ✅ | ✅ | ⚠️ (manual) |
| Auto-start setup | ✅ (launchd) | ✅ (systemd) | ❌ |

## Examples

### Example 1: Team Shared Directory

```bash
# Set up projects in Dropbox for team sync
overleaf-cli config projectsDir ~/Dropbox/Team/Overleaf
overleaf-cli setup
```

### Example 2: Multiple Machines

```bash
# Machine 1
overleaf-cli config projectsDir ~/Documents/overleaf
overleaf-cli setup project-id-1

# Machine 2 (same project directory via cloud sync)
overleaf-cli config projectsDir ~/Documents/overleaf
cd ~/Documents/overleaf/project-id-1
overleaf-cli auto-sync
```

### Example 3: Auto-Sync on Startup

```bash
# Clone project
overleaf-cli setup

# Get project path
cd ~/.overleaf-zed/projects/your-project-id
PROJECT_PATH=$(pwd)

# Set up auto-start
../../../scripts/setup-auto-sync.sh "$PROJECT_PATH"

# Now syncs automatically on login!
```

## Troubleshooting

### "Projects directory not found"
```bash
# Check current setting
overleaf-cli config

# Fix: Set it explicitly
overleaf-cli config projectsDir ~/Documents/overleaf
```

### "Auto-sync not starting"
```bash
# macOS: Check launchd
launchctl list | grep overleaf
launchctl load ~/Library/LaunchAgents/com.overleaf.autosync.*.plist

# Linux: Check systemd
systemctl --user status overleaf-autosync-*
systemctl --user start overleaf-autosync-PROJECT_ID
```

### "Permission denied"
```bash
# Make sure the directory exists and is writable
mkdir -p ~/Documents/overleaf
chmod 755 ~/Documents/overleaf
```

## Backward Compatibility

All existing commands still work! The new features are additive:

- ✅ `overleaf-cli login` - Works as before
- ✅ `overleaf-cli list` - Works as before  
- ✅ `overleaf-cli setup` - Now respects custom directory
- ✅ `overleaf-cli watch` - Works as before
- ✅ `overleaf-cli compile` - Works as before
- 🆕 `overleaf-cli config` - New command
- 🆕 `overleaf-cli pull` - New command
- 🆕 `overleaf-cli auto-sync` - New command

## Feedback

Found a bug or have a suggestion? Please open an issue!
