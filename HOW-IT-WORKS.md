# 🔍 How It Works - Architecture Explained

This document explains how the Overleaf-Zed extension works under the hood.

---

## 📐 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Your Computer                            │
│                                                                   │
│  ┌────────────────┐         ┌──────────────────────────────┐   │
│  │   Zed Editor   │◄───────►│   MCP Server (Node.js)       │   │
│  │                │         │   - overleaf-api.js          │   │
│  │  - Edit files  │         │   - 13 MCP tools             │   │
│  │  - AI Agent    │         │   - File watcher             │   │
│  │  - Extensions  │         │   - CLI interface            │   │
│  └────────────────┘         └──────────────────────────────┘   │
│         │                              │                         │
│         │                              │                         │
│         ▼                              ▼                         │
│  ┌────────────────────────────────────────────┐                │
│  │    Local Project Files                      │                │
│  │    ~/.overleaf-zed/projects/                │                │
│  │    ├── MyThesis/                            │                │
│  │    │   ├── .git/          (version control) │                │
│  │    │   ├── main.tex       (your edits)      │                │
│  │    │   └── output.pdf     (compiled)        │                │
│  └────────────────────────────────────────────┘                │
│                              │                                   │
└──────────────────────────────┼───────────────────────────────────┘
                               │
                               │ Internet
                               │
                               ▼
                ┌──────────────────────────────┐
                │   Overleaf Servers           │
                │   - Your projects            │
                │   - LaTeX compiler           │
                │   - Collaboration            │
                └──────────────────────────────┘
```

---

## 🔄 Data Flow

### Scenario 1: Download Project

```
User Action: overleaf-cli setup
    │
    ├─► MCP Server calls Overleaf API
    │   └─► GET /project (list projects)
    │
    ├─► User selects project
    │
    ├─► Try Git clone (Premium)
    │   └─► git clone https://git.overleaf.com/PROJECT_ID
    │   └─► If fails ──► Fallback to direct download
    │
    ├─► Download all files
    │   └─► GET /project/PROJECT_ID/doc/FILE_ID (for each file)
    │
    └─► Save to ~/.overleaf-zed/projects/PROJECT_NAME/
```

### Scenario 2: Edit & Auto-Sync

```
User edits file in Zed
    │
    ▼
File watcher detects change (chokidar)
    │
    ▼
Wait 2 seconds (debounce)
    │
    ▼
Upload to Overleaf
    │   └─► POST /project/PROJECT_ID/doc/FILE_ID
    │
    ▼
Auto Git commit (if enabled)
    │   └─► git add .
    │   └─► git commit -m "Auto-sync: ..."
    │   └─► git push (if remote configured)
    │
    ▼
Done ✓
```

### Scenario 3: Compile Project

```
User: overleaf-cli compile
    │
    ▼
MCP Server calls Overleaf API
    │   └─► POST /project/PROJECT_ID/compile
    │
    ▼
Wait for compilation (polling)
    │
    ▼
Download PDF
    │   └─► GET /project/PROJECT_ID/output/output.pdf
    │
    ▼
Save to output.pdf
```

### Scenario 4: AI-Assisted Workflow

```
User in Zed Agent Panel: "Download my Thesis"
    │
    ▼
Claude receives message
    │
    ▼
Claude decides which MCP tool to use
    │   └─► overleaf_list_projects (find project)
    │   └─► overleaf_sync_download (download it)
    │
    ▼
MCP Server executes tools
    │
    ▼
Claude reports results to user
```

---

## 🔧 Component Details

### 1. MCP Server (`server/index.js`)

**Purpose**: Bridge between Zed and Overleaf API

**Key Features:**
- Implements Model Context Protocol (MCP)
- Exposes 13 tools to Zed's AI
- Manages authentication (cookie-based)
- Handles all API calls to Overleaf

**Tools Provided:**
```javascript
overleaf_login_cookie       → Authentication
overleaf_login_password     → Alternative auth
overleaf_list_projects      → Get all projects
overleaf_get_project        → Get file structure
overleaf_sync_download      → Download files
overleaf_sync_upload        → Upload changes
overleaf_compile            → Compile LaTeX
overleaf_read_file          → Read file content
overleaf_update_file        → Update file content
overleaf_create_project     → Create new project
overleaf_start_sync         → Start file watcher
overleaf_stop_sync          → Stop file watcher
overleaf_sync_status        → Check sync status
```

### 2. Overleaf API Client (`server/overleaf-api.js`)

**Purpose**: Low-level HTTP client for Overleaf

**Key Methods:**
- `loginWithCookie()` - Session authentication
- `getProjects()` - List all projects
- `getProjectDetails()` - Get project structure
- `getFileContent()` - Read text files (.tex)
- `updateFileContent()` - Write text files
- `compileProject()` - Trigger compilation
- `downloadPdf()` - Get compiled PDF
- `getGitUrl()` - Get Git URL (Premium)

**Authentication:**
```javascript
// Uses browser session cookie
Cookie: overleaf_session2=...; sharelatex.sid=...

// Extracts CSRF token from HTML
<input name="_csrf" value="TOKEN">

// Includes token in all POST requests
{ _csrf: TOKEN, ...data }
```

### 3. File Watcher (`server/file-watcher.js`)

**Purpose**: Monitor local files and auto-sync

**How It Works:**
```javascript
chokidar.watch(projectDir, {
  ignoreInitial: true,
  awaitWriteFinish: {
    stabilityThreshold: 1000,  // Wait 1s for file writes
    pollInterval: 100
  }
})
.on('change', (file) => {
  // Add to queue
  uploadQueue.set(file, { timestamp: Date.now() })
  
  // Debounce: wait 2s before uploading
  clearTimeout(uploadTimer)
  uploadTimer = setTimeout(() => {
    processUploadQueue()  // Batch upload all changes
  }, 2000)
})
```

**Features:**
- Debouncing: Groups rapid changes
- Batch uploads: Efficient API usage
- Auto Git commit: After successful upload
- Error handling: Retries on failure

### 4. CLI Tool (`server/cli.js`)

**Purpose**: Command-line interface for easy usage

**Architecture:**
```javascript
// Commander pattern
commands = {
  login: async () => { /* prompt for cookie */ },
  list: async () => { /* show projects */ },
  setup: async (projectId) => { /* download */ },
  watch: async () => { /* start file watcher */ },
  compile: async () => { /* compile LaTeX */ }
}

// Colored output
console.log(`${colors.green}✓ Success${colors.reset}`)
console.log(`${colors.red}✗ Error${colors.reset}`)
```

### 5. Zed Extension (`src/lib.rs`)

**Purpose**: Launch MCP server from Zed

**Code:**
```rust
impl Extension for OverleafExtension {
    fn context_server_command(
        &mut self,
        context_server_id: &ContextServerId,
        _project: &Project,
    ) -> Result<Command> {
        Ok(Command {
            command: "node".to_string(),
            args: vec!["server/index.js".to_string()],
            env: Default::default(),
        })
    }
}
```

**What It Does:**
1. Zed loads the extension (WebAssembly)
2. Extension registers "overleaf" context server
3. When Zed starts, it runs: `node server/index.js`
4. MCP server connects via stdio
5. Zed can now call MCP tools

---

## 🔐 Security & Authentication

### Cookie-Based Authentication

**Why cookies instead of passwords?**
1. ✅ Works with SSO (Google, ORCID, etc.)
2. ✅ No password storage needed
3. ✅ Automatic expiration (~2 weeks)
4. ✅ Easy to revoke (just logout in browser)

**How it works:**
```javascript
// 1. User gets cookie from browser
document.cookie  // → "overleaf_session2=..."

// 2. Extension stores cookie locally
~/.overleaf-zed/config.json

// 3. All API requests include cookie
axios.get('/projects', {
  headers: {
    Cookie: 'overleaf_session2=...'
  }
})

// 4. Overleaf validates session
// 5. Returns user data
```

**Security Notes:**
- ⚠️ Cookie = Password - Keep it private!
- ✅ Stored in user's home directory (not in project)
- ✅ Never committed to Git
- ✅ Expires automatically

---

## 🌳 Git Integration

### For Premium Users

**Official Git URL:**
```
https://git.overleaf.com/PROJECT_ID
```

**Authentication:**
Overleaf Premium users can use Git with their session cookie (handled by Git credential helper).

**Workflow:**
```bash
# Clone
git clone https://git.overleaf.com/PROJECT_ID

# Edit locally
vim main.tex

# Commit
git add .
git commit -m "Update thesis"

# Push to Overleaf
git push origin master

# Pull from Overleaf
git pull origin master
```

### For Free Users

**Local Git Only:**
```bash
# Initialize local repo
git init
git add .
git commit -m "Initial commit"

# Use for local version control
git log
git diff
git checkout -b feature-branch
```

**No remote push**, but still useful for:
- ✅ Version history
- ✅ Branch management
- ✅ Undo changes
- ✅ Backup

---

## ⚡ Performance Optimizations

### 1. Debouncing
```
Edit file A at T+0s    ─┐
Edit file B at T+1s    ─┤
Edit file A at T+1.5s  ─┤  Wait 2s after last change
Edit file C at T+2s    ─┘
                        │
Upload all 3 files at T+4s ─► Single API call
```

### 2. Batch Operations
```javascript
// Instead of:
uploadFile(A)  // 3 separate API calls
uploadFile(B)  // = slow
uploadFile(C)

// Do:
uploadFiles([A, B, C])  // 1 API call = fast
```

### 3. Intelligent Caching
```javascript
// Cache project structure
const projectCache = new Map()

// Only re-fetch if expired (5 min)
if (!projectCache.has(id) || Date.now() - cache.time > 300000) {
  projectCache.set(id, await api.getProject(id))
}
```

---

## 🔄 Sync Strategies

### Strategy 1: Poll-Based (Not Used)
```
Every 5 seconds:
  Check Overleaf for changes
  If changed → Download
```
❌ Inefficient, high API usage

### Strategy 2: Event-Based (Current)
```
When local file changes:
  Wait 2 seconds
  Upload to Overleaf
```
✅ Efficient, low API usage

### Strategy 3: WebSocket (Future)
```
Overleaf ←WebSocket→ Extension
Real-time bidirectional sync
```
⚠️ Requires more complex implementation

---

## 🧩 Extension Points

Want to extend the functionality? Here are the key interfaces:

### Add a New MCP Tool
```javascript
// In server/index.js
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // ... existing tools
      {
        name: 'overleaf_new_feature',
        description: 'Does something cool',
        inputSchema: { /* ... */ }
      }
    ]
  }
})

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    // ... existing cases
    case 'overleaf_new_feature':
      // Your implementation
      break
  }
})
```

### Add a New CLI Command
```javascript
// In server/cli.js
async function newCommand() {
  // Your implementation
}

switch (command) {
  // ... existing commands
  case 'new-command':
    await newCommand()
    break
}
```

### Add a New API Method
```javascript
// In server/overleaf-api.js
async newApiMethod(projectId) {
  const response = await this.client.post(`/project/${projectId}/new-endpoint`)
  return response.data
}
```

---

## 📊 Data Models

### Project Structure
```javascript
{
  id: "68c0b895d8bca38ce7a59ba6",
  name: "My Thesis",
  owner: { email: "user@example.com" },
  rootFolder: [{
    _id: "root-id",
    docs: [
      { _id: "doc1", name: "main.tex" }
    ],
    fileRefs: [
      { _id: "file1", name: "image.png" }
    ],
    folders: [
      { _id: "folder1", name: "chapters", docs: [...] }
    ]
  }]
}
```

### Local Metadata
```javascript
// .overleaf-meta.json
{
  projectId: "68c0b895d8bca38ce7a59ba6",
  projectName: "My Thesis",
  localPath: "/Users/you/.overleaf-zed/projects/My_Thesis",
  setupDate: "2025-12-09T10:30:00Z",
  useGit: true
}
```

### Config File
```javascript
// ~/.overleaf-zed/config.json
{
  cookie: "overleaf_session2=...",
  email: "user@example.com",
  serverUrl: "https://www.overleaf.com"
}
```

---

## 🚦 Error Handling

### Network Errors
```javascript
try {
  await api.uploadFile(...)
} catch (error) {
  if (error.code === 'ECONNREFUSED') {
    // No internet
    console.error('No internet connection')
    // Queue for retry
  } else if (error.response?.status === 401) {
    // Cookie expired
    console.error('Please login again')
  }
}
```

### API Rate Limits
```javascript
if (response.status === 429) {
  // Too many requests
  await sleep(5000)  // Wait 5 seconds
  retry()
}
```

### File Conflicts
```javascript
if (localTimestamp > remoteTimestamp && remoteChanged) {
  // Conflict!
  prompt('Which version to keep?')
}
```

---

## 🔮 Future Enhancements

1. **WebSocket Support** - Real-time collaboration
2. **SyncTeX** - Click in PDF → Jump to source
3. **Spell Check** - Integrate Overleaf's spell checker
4. **Templates** - Quick project creation
5. **Diff View** - Visual comparison of changes
6. **Multi-user Cursors** - See collaborators in real-time
7. **In-editor PDF Preview** - View PDF in Zed
8. **Compilation Cache** - Faster recompiles

---

**Understanding how it works makes you a power user!** 💪
