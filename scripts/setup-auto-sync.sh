#!/bin/bash

# Universal Auto-Sync Setup Script for Overleaf CLI
# Works on macOS and Linux

set -e

echo "🚀 Overleaf Auto-Sync Setup"
echo "════════════════════════════════════════"
echo ""

# Detect OS
OS="$(uname -s)"
case "${OS}" in
    Linux*)     PLATFORM=Linux;;
    Darwin*)    PLATFORM=macOS;;
    *)          PLATFORM="UNKNOWN:${OS}"
esac

echo "Detected platform: $PLATFORM"
echo ""

# Get project path
if [ -z "$1" ]; then
    echo "Usage: $0 <project-path>"
    echo ""
    echo "Example:"
    echo "  $0 ~/.overleaf-zed/projects/your-project-id"
    echo ""
    exit 1
fi

PROJECT_PATH="$(cd "$1" && pwd)"

if [ ! -f "$PROJECT_PATH/.overleaf-meta.json" ]; then
    echo "❌ Error: Not an Overleaf project directory"
    echo "   Missing .overleaf-meta.json file"
    exit 1
fi

# Read project metadata
PROJECT_ID=$(cat "$PROJECT_PATH/.overleaf-meta.json" | grep projectId | cut -d'"' -f4)
PROJECT_NAME=$(cat "$PROJECT_PATH/.overleaf-meta.json" | grep projectName | cut -d'"' -f4)

echo "Project: $PROJECT_NAME"
echo "ID: $PROJECT_ID"
echo "Path: $PROJECT_PATH"
echo ""

# Find overleaf-cli command
CLI_CMD="overleaf-cli"
if ! command -v $CLI_CMD &> /dev/null; then
    echo "❌ Error: overleaf-cli not found in PATH"
    echo "   Please run 'npm link' in the server directory first"
    exit 1
fi

CLI_PATH="$(which $CLI_CMD)"
echo "CLI found at: $CLI_PATH"
echo ""

# Find node path (needed for launchd on macOS)
NODE_PATH="$(which node)"
NODE_DIR="$(dirname "$NODE_PATH")"
echo "Node found at: $NODE_PATH"
echo ""

# Setup based on platform
if [ "$PLATFORM" = "macOS" ]; then
    echo "Setting up macOS launchd service..."
    
    SERVICE_NAME="com.overleaf.autosync.${PROJECT_ID}"
    PLIST_FILE="$HOME/Library/LaunchAgents/${SERVICE_NAME}.plist"
    LOG_DIR="$HOME/.overleaf-zed/logs"
    
    mkdir -p "$LOG_DIR"
    mkdir -p "$HOME/Library/LaunchAgents"
    
    cat > "$PLIST_FILE" << ENDPLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${SERVICE_NAME}</string>
    
    <key>ProgramArguments</key>
    <array>
        <string>${CLI_PATH}</string>
        <string>auto-sync</string>
        <string>${PROJECT_PATH}</string>
    </array>
    
    <key>WorkingDirectory</key>
    <string>${PROJECT_PATH}</string>
    
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>${NODE_DIR}:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
    </dict>
    
    <key>RunAtLoad</key>
    <true/>
    
    <key>KeepAlive</key>
    <true/>
    
    <key>StandardOutPath</key>
    <string>${LOG_DIR}/${PROJECT_ID}.log</string>
    
    <key>StandardErrorPath</key>
    <string>${LOG_DIR}/${PROJECT_ID}.error.log</string>
</dict>
</plist>
ENDPLIST
    
    echo "✓ Created plist file: $PLIST_FILE"
    
    # Load the service
    launchctl unload "$PLIST_FILE" 2>/dev/null || true
    launchctl load "$PLIST_FILE"
    
    echo "✓ Service loaded"
    echo ""
    echo "✅ Auto-sync setup complete!"
    echo ""
    echo "Useful commands:"
    echo "  View logs:    tail -f $LOG_DIR/${PROJECT_ID}.log"
    echo "  Stop service: launchctl unload $PLIST_FILE"
    echo "  Start service: launchctl load $PLIST_FILE"
    echo ""
    
elif [ "$PLATFORM" = "Linux" ]; then
    echo "Setting up systemd user service..."
    
    SERVICE_NAME="overleaf-autosync-${PROJECT_ID}"
    SERVICE_FILE="$HOME/.config/systemd/user/${SERVICE_NAME}.service"
    LOG_DIR="$HOME/.overleaf-zed/logs"
    
    mkdir -p "$HOME/.config/systemd/user"
    mkdir -p "$LOG_DIR"
    
    cat > "$SERVICE_FILE" << ENDSERVICE
[Unit]
Description=Overleaf Auto-Sync for ${PROJECT_NAME}
After=network.target

[Service]
Type=simple
WorkingDirectory=${PROJECT_PATH}
ExecStart=${CLI_PATH} auto-sync ${PROJECT_PATH}
Restart=always
RestartSec=10
StandardOutput=append:${LOG_DIR}/${PROJECT_ID}.log
StandardError=append:${LOG_DIR}/${PROJECT_ID}.error.log

[Install]
WantedBy=default.target
ENDSERVICE
    
    echo "✓ Created service file: $SERVICE_FILE"
    
    # Reload systemd and enable service
    systemctl --user daemon-reload
    systemctl --user enable "${SERVICE_NAME}.service"
    systemctl --user start "${SERVICE_NAME}.service"
    
    echo "✓ Service enabled and started"
    echo ""
    echo "✅ Auto-sync setup complete!"
    echo ""
    echo "Useful commands:"
    echo "  View status:  systemctl --user status ${SERVICE_NAME}"
    echo "  View logs:    journalctl --user -u ${SERVICE_NAME} -f"
    echo "  Stop service: systemctl --user stop ${SERVICE_NAME}"
    echo "  Start service: systemctl --user start ${SERVICE_NAME}"
    echo ""
else
    echo "❌ Unsupported platform: $PLATFORM"
    echo ""
    echo "For manual setup, run:"
    echo "  $CLI_CMD auto-sync $PROJECT_PATH"
    exit 1
fi
