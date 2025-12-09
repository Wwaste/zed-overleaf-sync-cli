#!/bin/bash

# Overleaf-Zed Extension Setup Script
# Quick one-command installation

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔════════════════════════════════════════╗"
echo "║  Overleaf-Zed Extension Setup          ║"
echo "║  Git + MCP Hybrid Workflow             ║"
echo "╚════════════════════════════════════════╝"
echo -e "${NC}"

# Check prerequisites
echo -e "${BLUE}📋 Checking prerequisites...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js is not installed${NC}"
    echo "  Please install Node.js (v16+) from https://nodejs.org/"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node --version)${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm $(npm --version)${NC}"

# Check Rust (for Zed extension)
if ! command -v rustc &> /dev/null; then
    echo -e "${YELLOW}⚠ Rust is not installed (required for Zed extension)${NC}"
    echo "  Install from: https://rustup.rs/"
    echo "  Run: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
fi

# Check Git
if command -v git &> /dev/null; then
    echo -e "${GREEN}✓ Git $(git --version | cut -d' ' -f3)${NC}"
else
    echo -e "${YELLOW}⚠ Git is not installed (optional but recommended)${NC}"
fi

echo ""

# Install dependencies
echo -e "${BLUE}📦 Installing dependencies...${NC}"
cd server
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"

echo ""

# Install CLI globally
echo -e "${BLUE}🔧 Installing CLI tool globally...${NC}"
npm link
echo -e "${GREEN}✓ CLI tool installed${NC}"

echo ""

# Build Rust extension (if Rust is available)
if command -v cargo &> /dev/null; then
    echo -e "${BLUE}🔨 Building Zed extension...${NC}"
    cd ..
    cargo build --release
    echo -e "${GREEN}✓ Extension built${NC}"
else
    echo -e "${YELLOW}⚠ Skipping Rust build (rustc not found)${NC}"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ Setup Complete!                    ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"

echo ""
echo -e "${BLUE}🎯 Next Steps:${NC}"
echo ""
echo -e "${YELLOW}1. Login to Overleaf:${NC}"
echo "   overleaf-cli login"
echo ""
echo -e "${YELLOW}2. List your projects:${NC}"
echo "   overleaf-cli list"
echo ""
echo -e "${YELLOW}3. Setup a project:${NC}"
echo "   overleaf-cli setup"
echo ""
echo -e "${YELLOW}4. Open in Zed:${NC}"
echo "   cd ~/.overleaf-zed/projects/YourProject"
echo "   zed ."
echo ""
echo -e "${YELLOW}5. Start auto-sync (optional):${NC}"
echo "   overleaf-cli watch"
echo ""
echo -e "${BLUE}📚 Documentation:${NC}"
echo "   - CLI help: overleaf-cli help"
echo "   - README: cat README.md"
echo ""
echo -e "${BLUE}🔧 Zed Extension (if Rust installed):${NC}"
echo "   1. Open Zed"
echo "   2. Extensions → Install Dev Extension"
echo "   3. Select: $(pwd)"
echo ""
