# 🤝 Contributing to Overleaf-Zed Extension

Thank you for your interest in contributing! This document provides guidelines for contributing to this project.

## 🐛 Reporting Bugs

Before submitting a bug report:
1. Check if the issue already exists in [GitHub Issues](https://github.com/YOUR_GITHUB_USERNAME/overleaf-zed-extension/issues)
2. Make sure you're using the latest version
3. Test with a minimal example if possible

When reporting bugs, include:
- Your OS and version (macOS, Linux, Windows)
- Zed version
- Node.js version
- Steps to reproduce
- Expected vs actual behavior
- Error messages or logs

## 💡 Suggesting Features

Feature requests are welcome! Please:
1. Check if it's already suggested
2. Explain the use case
3. Describe the expected behavior
4. Consider if it fits the project scope

## 🔧 Development Setup

```bash
# Clone the repository
git clone https://github.com/YOUR_GITHUB_USERNAME/overleaf-zed-extension.git
cd overleaf-zed-extension

# Install dependencies
cd server && npm install && cd ..

# Run setup
./setup.sh

# For Rust development (Zed extension)
cargo build --release
```

## 📝 Code Style

- **Rust**: Follow standard Rust formatting (`cargo fmt`)
- **JavaScript**: Use 2-space indentation
- **Documentation**: Clear, concise English
- **Commit messages**: Descriptive and in English

## 🔀 Pull Request Process

1. **Fork** the repository
2. **Create a branch**: `git checkout -b feature/your-feature-name`
3. **Make changes** with clear commit messages
4. **Test thoroughly**: Ensure everything works
5. **Update documentation** if needed
6. **Submit PR** with description of changes

### PR Guidelines

- One feature/fix per PR
- Include tests if applicable
- Update README if adding features
- Follow existing code style
- Be responsive to feedback

## 🧪 Testing

Before submitting:
- Test login functionality
- Test project download
- Test file synchronization
- Test Git integration
- Check for console errors

## 📂 Project Structure

```
overleaf-zed-extension/
├── src/                    # Rust extension code
├── server/                 # Node.js MCP server & CLI
│   ├── index.js           # MCP server
│   ├── cli.js             # CLI tool
│   ├── file-watcher.js    # File watching
│   └── overleaf-api.js    # API client
├── tools/                  # Global utility scripts
│   ├── commit             # Smart commit script
│   └── sync               # Sync script
└── docs/                   # Documentation

```

## 🎯 Areas for Contribution

### High Priority
- [ ] WebSocket support for real-time collaboration
- [ ] In-editor PDF preview
- [ ] SyncTeX support
- [ ] Windows/Linux testing

### Medium Priority
- [ ] Bidirectional auto-sync
- [ ] Conflict resolution UI
- [ ] Template gallery
- [ ] Spell checker integration

### Low Priority
- [ ] Self-hosted Overleaf support
- [ ] Local LaTeX compilation
- [ ] Custom compiler settings

## 📚 Documentation

Documentation improvements are always welcome:
- Fix typos
- Clarify confusing sections
- Add examples
- Translate to other languages

## ⚖️ License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 💬 Questions?

- Open a [Discussion](https://github.com/YOUR_GITHUB_USERNAME/overleaf-zed-extension/discussions)
- Check existing issues and PRs
- Read the [README](README.md) and [HOW-IT-WORKS](HOW-IT-WORKS.md)

---

**Thank you for contributing!** 🎉
