# 🔐 Credentials Guide

Complete guide to authentication and credentials for the Overleaf-Zed extension.

---

## Overview

This extension uses **two types of credentials**:

| Credential | Required? | Used For | Users |
|------------|-----------|----------|-------|
| **Cookie** | ✅ Required | API access, file operations, compilation | All users |
| **Git Token** | ⚠️ Optional | Git clone, push, pull operations | Premium only |

---

## 1️⃣ Cookie Authentication (Required)

### What is it?
Your browser session cookie that proves you're logged into Overleaf.

### Why do we need it?
- Accesses Overleaf API to list projects, download files, compile LaTeX
- Works with Single Sign-On (SSO) accounts
- More secure than storing passwords

### How to get it:

**Step-by-Step:**

1. **Open your browser** (any browser - Chrome, Firefox, Safari, Edge)

2. **Go to** [https://www.overleaf.com](https://www.overleaf.com)

3. **Login** to your Overleaf account

4. **Open Developer Tools:**
   - **Windows/Linux:** Press `F12` or `Ctrl+Shift+I`
   - **macOS:** Press `Cmd+Option+I` or `F12`

5. **Click the "Console" tab** in Developer Tools

6. **Copy and paste this command:**
   ```javascript
   document.cookie.split(';').find(c => c.includes('overleaf_session2'))
   ```

7. **Press Enter**

8. **You should see output like:**
   ```
   " overleaf_session2=s%3AnSraBO7L1wZWBOYPutl-1xOJXnw5wRrP.rEawmyH8DSE..."
   ```

9. **Copy this entire string** (including `overleaf_session2=`)

### Visual Guide:

```
Browser Window
└── Developer Tools (F12)
    └── Console Tab
        └── Paste command → Get cookie
```

### Format:
```
overleaf_session2=s%3A[long string of random characters]
```

### Security:
- ⚠️ **Keep this private!** Anyone with your cookie can access your Overleaf account
- 🔒 **Never share it publicly** or commit it to Git
- ⏰ **Expires in ~2 weeks** - you'll need to get a fresh one periodically

### Troubleshooting:

**Problem:** "Cannot read property 'split' of undefined"
- **Solution:** Make sure you're on overleaf.com and logged in

**Problem:** "Invalid cookie format"
- **Solution:** Make sure you copied the full string including `overleaf_session2=`

**Problem:** "Login failed"
- **Solution:** Get a fresh cookie - your current one may have expired

---

## 2️⃣ Git Token (Optional - Premium Only)

### What is it?
An authentication token that allows Git operations with Overleaf's Git server.

### Why do we need it?
- Enables `git clone`, `git push`, `git pull` with Overleaf
- Faster and more reliable than ZIP download
- Full version control capabilities

### Who needs it?
- ✅ **Overleaf Premium users** - Git integration is a Premium feature
- ❌ **Free users** - Don't need this, direct download works great!

### How to get it:

**Step-by-Step:**

1. **Login** to [https://www.overleaf.com](https://www.overleaf.com)

2. **Go to Settings:**
   - Click your profile icon (top-right)
   - Select "Account Settings"
   - Or go directly to: [https://www.overleaf.com/user/settings](https://www.overleaf.com/user/settings)

3. **Find "Git Integration" section** (scroll down)

4. **Click "Generate token"** or copy existing token

5. **Copy the token** - it looks like:
   ```
   olp_2F5GPFQAVwGxfBgWObbpjsZRVXH5tE3gmwxB
   ```

### Format:
```
olp_[alphanumeric characters]
```

### When to enter it:
During `overleaf-cli login`, you'll be prompted:

```
🔑 Git Integration (Optional - Premium users only)
════════════════════════════════════════

How to get your Git token:
1. Go to https://www.overleaf.com/user/settings
2. Find the "Git Integration" section
3. Click "Generate token" or copy existing token
4. Token format: olp_xxxxxxxxxxxxxxxxxxxx

Enter Git token (or press Enter to skip): 
```

**Free users:** Just press Enter to skip!

### Storage:
Token is stored in: `~/.overleaf-zed/config.json`

```json
{
  "cookie": "overleaf_session2=...",
  "email": "YOUR_EMAIL@example.com",
  "serverUrl": "https://www.overleaf.com",
  "gitToken": "olp_..."
}
```

### Usage:
When you run `overleaf-cli setup`, the CLI:
1. ✅ **Has Git token:** Tries `git clone` using token
2. ❌ **No Git token:** Falls back to direct ZIP download

Both methods work perfectly! Git is just faster for Premium users.

### Security:
- 🔒 Stored locally in your home directory
- 🚫 Never transmitted except to `git.overleaf.com`
- ♻️ Can be regenerated anytime from Overleaf settings

---

## Quick Reference

### Login Flow:

```bash
$ overleaf-cli login

# Step 1: Enter cookie (REQUIRED)
Enter your Overleaf cookie: overleaf_session2=s%3A...

# Step 2: Enter Git token (OPTIONAL)
Enter Git token (or press Enter to skip): olp_...

# Done!
✓ Logged in as YOUR_EMAIL@example.com
```

### What gets stored:

```
~/.overleaf-zed/
└── config.json
    ├── cookie       (Required - all users)
    ├── email        (Auto-detected from cookie)
    ├── serverUrl    (Default: https://www.overleaf.com)
    └── gitToken     (Optional - Premium users only)
```

### Re-login:

If your cookie expires (every ~2 weeks):

```bash
overleaf-cli login
```

This will:
- Ask for new cookie
- Ask if you want to update Git token
- Preserve other settings

---

## FAQ

### Q: Do I need an Overleaf Premium account?
**A:** No! The extension works perfectly with free accounts. Premium users just get bonus Git features.

### Q: Is it safe to store my cookie locally?
**A:** Yes, it's stored in your home directory (`~/.overleaf-zed/`) which only you can access. Just don't commit `config.json` to public repositories!

### Q: What if I don't have a Git token?
**A:** No problem! Just press Enter to skip during login. You'll use direct download instead.

### Q: Can I add a Git token later?
**A:** Yes! Just run `overleaf-cli login` again and enter your token when prompted.

### Q: How do I know if my credentials are working?
**A:** Run:
```bash
overleaf-cli list
```
If you see your projects, everything is working!

### Q: What if my cookie expires?
**A:** You'll see "Not logged in" errors. Just run `overleaf-cli login` again with a fresh cookie.

### Q: Can I use this with SSO/institutional login?
**A:** Yes! Cookie authentication works with any login method including Google, institutional SSO, etc.

### Q: Where can I see my stored credentials?
**A:** 
```bash
cat ~/.overleaf-zed/config.json
```
⚠️ Remember not to share this file!

---

## Security Best Practices

1. **Never commit credentials to Git:**
   ```bash
   # .gitignore already includes:
   .overleaf-zed/
   config.json
   ```

2. **Refresh cookies regularly:**
   - Get a new cookie every 2 weeks
   - Or when you see authentication errors

3. **Regenerate tokens if compromised:**
   - Go to Overleaf settings
   - Generate new token
   - Run `overleaf-cli login` again

4. **Use file permissions:**
   ```bash
   chmod 600 ~/.overleaf-zed/config.json
   ```

5. **Don't share your config file:**
   - Contains active session credentials
   - Anyone with it can access your Overleaf account

---

## Need Help?

- 📖 Read [GETTING-STARTED.md](GETTING-STARTED.md) for full setup guide
- 🐛 Report issues on [GitHub](https://github.com/YOUR_GITHUB_USERNAME/overleaf-zed-extension/issues)
- 💬 Ask in [Discussions](https://github.com/YOUR_GITHUB_USERNAME/overleaf-zed-extension/discussions)

---

**Happy LaTeXing!** 🚀
