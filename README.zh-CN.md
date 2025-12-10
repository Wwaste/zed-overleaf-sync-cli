# Overleaf-Zed 扩展 🚀

[English](README.md) | [简体中文](README.zh-CN.md)

> **Git + CLI 工作流** - 在 Zed 中同步、编辑并编译 Overleaf LaTeX 项目，支持智能文件监听与自动同步。

受 VS Code 的 [Overleaf Workshop](https://github.com/iamhyc/Overleaf-Workshop) 启发，此扩展通过 Git 与 CLI 自动化的组合，将流畅的 Overleaf 集成带到 Zed。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Zed Extension](https://img.shields.io/badge/Zed-Extension-blue)](https://zed.dev)

---

## ✨ 功能

### 🎯 核心能力
- 🔐 **基于 Cookie 的认证** - 通过浏览器会话安全登录（支持 SSO，无需密码）
- 📁 **智能项目管理** - CLI 工具轻松完成项目设置与管理
- 🔄 **实时文件同步** - 自动双向同步并监听文件变化
- 🌳 **Git 集成** - 为 Overleaf 高级用户提供完整的 Git 支持
- 🔨 **LaTeX 编译** - 一条命令完成编译并下载 PDF
- 📝 **完整文件操作** - 无缝创建、读取、更新、删除文件

### 🎁 额外特性
- ⚡ 文件变更自动 commit 并推送 Git
- 👀 带去抖动的文件监听（批量变更等待 2 秒）
- 📊 漂亮的 CLI，彩色输出
- 🗂️ 本地项目组织位于 `~/.overleaf-zed/projects/`
- 🔧 可扩展 API，支持自定义工作流

---

## 🚀 快速开始（5 分钟）

### 方法 1：一键安装（推荐）

```bash
# 克隆并自动完成全部配置
git clone https://github.com/YOUR_GITHUB_USERNAME/overleaf-zed-extension.git
cd overleaf-zed-extension
./setup.sh
```

### 方法 2：手动安装

```bash
# 1. 安装 Node.js 依赖
cd server && npm install

# 2. 全局安装 CLI 工具
npm link

# 3. 构建 Zed 扩展（如果你有 Rust）
cd .. && cargo build --release
```

---

## 📖 使用指南

### 第一步：登录 Overleaf

```bash
overleaf-cli login
# 按提示粘贴你的 cookie
```

**如何获取 cookie：**
1. 在浏览器中登录 [Overleaf](https://www.overleaf.com)
2. 按 `F12` → 进入 **Console** 选项卡
3. 运行：`document.cookie.split(';').find(c => c.includes('overleaf_session2'))`
4. 复制输出内容

### 第二步：列出你的项目

```bash
overleaf-cli list
# 展示所有项目及其 ID
```

### 第三步：设置项目

```bash
# 交互模式（从列表中选择）
overleaf-cli setup

# 或直接指定项目 ID
overleaf-cli setup 68c0b895d8bca38ce7a59ba6
```

上述操作将：
- ✅ 首先尝试 Git clone（高级用户）
- ✅ Git 失败则回退为直接下载
- ✅ 保存到 `~/.overleaf-zed/projects/YourProject/`
- ✅ 初始化本地 Git 仓库

### 第四步：在 Zed 中编辑

```bash
cd ~/.overleaf-zed/projects/YourProject
zed .
```

### 第五步：自动同步（可选）

```bash
# 在项目目录内
overleaf-cli watch

# 现在每次文件变更都会自动：
# 1. 上传到 Overleaf（延迟 2 秒）
# 2. 本地提交到 Git
# 3. 推送到远程（若已配置）
```

### 第六步：编译 LaTeX

```bash
overleaf-cli compile
# PDF 保存在：output.pdf
```

---

## 🛠️ 高级用法

### Git 工作流（高级用户）

```bash
# 使用官方 Git URL 克隆
overleaf-cli setup

# 启用 Git 远程以便推送/拉取
cd ~/.overleaf-zed/projects/YourProject
git remote add overleaf https://git.overleaf.com/68c0b895d8bca38ce7a59ba6

# 像平常一样使用 Git
git pull overleaf master
git push overleaf master
```

## 📂 项目结构

```
overleaf-zed-extension/
├── setup.sh                    # 一键安装脚本
├── extension.toml              # Zed 扩展清单
├── Cargo.toml                  # Rust 依赖
├── src/
│   └── lib.rs                  # Zed 扩展（WebAssembly）
├── server/
│   ├── package.json            # Node.js 依赖
│   ├── index.js                # 本地同步服务
│   ├── cli.js                  # CLI 工具
│   ├── file-watcher.js         # 文件监听与自动同步
│   └── overleaf-api.js         # Overleaf API 客户端
├── LICENSE                     # MIT 许可证
└── README.md                   # 本文件
```

---

## 🎯 工作流

### 工作流 1：简单本地编辑

```bash
1. overleaf-cli setup           # 下载项目
2. cd project && zed .          # 在 Zed 中打开
3. Edit files...                # 正常编辑
4. overleaf-cli compile         # 需要时编译
```

### 工作流 2：实时同步

```bash
1. overleaf-cli setup           # 下载项目
2. cd project                   
3. overleaf-cli watch &         # 启动后台同步
4. zed .                        # 在 Zed 中打开
# 所有变更每 2 秒自动同步到 Overleaf
```

### 工作流 3：基于 Git（高级）

```bash
1. overleaf-cli setup           # 通过 Git 克隆
2. cd project && zed .          
3. git add . && git commit      # 标准 Git 流程
4. git push                     # 推送到 Overleaf
```

## 🔧 配置

### 配置文件位置
`~/.overleaf-zed/config.json`

```json
{
  "cookie": "overleaf_session2=...",
  "email": "YOUR_EMAIL@example.com",
  "serverUrl": "https://www.overleaf.com"
}
```

### 项目存放位置
`~/.overleaf-zed/projects/`

每个项目文件夹包含：
- `.overleaf-meta.json` - 项目信息
- `.git/` - Git 仓库（若已初始化）
- 你的 LaTeX 文件

---

## 🔥 近期改进（2025-12）

### ✅ 当前可用
- **CSRF Token 修复**：正确从 Overleaf HTML 中提取 CSRF token，用于写操作
- **自动推送系统**：保存文件时自动 commit 并推送到 Git 远程
- **递归创建文件夹**：同步时自动创建嵌套文件夹
- **改进错误处理**：更好的认证与网络错误提示
- **文件监听稳定性**：带 2 秒延迟的去抖动，避免重复上传

### 🚀 新增功能
1. **智能 Git 集成**
   - 设置时自动添加 `overleaf` 远程
   - 每次变更自动 commit，并生成描述性信息
   - 自动推送到 Overleaf Git 仓库（高级用户）

2. **CLI 改进**
   - 彩色输出，便于阅读
   - 交互式项目选择
   - Git 失败时自动回退为直接下载

---

## 🐛 已知问题与排障

### 🔴 当前已知问题

1. **CSRF Token 提取** ⚠️
   - **问题**：有时无法从 Overleaf HTML 提取 CSRF token
   - **影响**：写操作（上传/删除文件、编译）可能失败
   - **解决办法**：使用 `overleaf-cli login` 获取新的 cookie
   - **状态**：调查中——Overleaf 可能修改了 HTML 结构

2. **文件监听性能** ⚠️
   - **问题**：监控大型项目（>100 个文件）可能变慢
   - **解决办法**：使用 Git 工作流替代 `watch` 命令
   - **状态**：考虑优化方案

### 🟡 常见用户错误

#### “Not logged in” 错误
```bash
# 使用新 cookie 重新登录
overleaf-cli login
```

#### 文件同步不起作用
```bash
# 检查 watcher 是否运行
ps aux | grep "overleaf-cli watch"

# 重启 watcher
pkill -f "overleaf-cli watch"
overleaf-cli watch
```

#### Git clone 失败
- **免费账户的预期行为** - Overleaf Git 访问需要高级订阅
- CLI 会自动回退为直接下载
- 仍会创建本地 Git 仓库用于版本控制
- 你仍可在本地使用 Git，只是无法推送到 Overleaf 远程

#### CSRF Token 警告
```
⚠️ Warning: No CSRF token found
```
- 大多数读取操作在没有 CSRF token 的情况下也能正常工作
- 写操作（上传、删除、编译）可能失败
- **解决方案**：使用 `overleaf-cli login` 获取新的 cookie

#### 自动推送失败
```bash
# 检查远程是否配置
git remote -v

# 如缺失则添加 Overleaf 远程
git remote add overleaf https://git.overleaf.com/YOUR_PROJECT_ID

# 测试手动推送
git push overleaf master
```

### 🔧 高级排障

#### 调试模式
```bash
# 启用详细日志
DEBUG=overleaf:* overleaf-cli watch
```

#### 清理缓存数据
```bash
# 删除所有缓存数据
rm -rf ~/.overleaf-zed/cache/

# 重新登录
overleaf-cli login
```

#### 测试 API 连接
```bash
# 列出项目以测试认证
overleaf-cli list

# 如果失败，请检查：
# 1. cookie 有效（先在浏览器登录 Overleaf）
# 2. 网络连接正常
# 3. Overleaf 服务未宕机
```

---

## 📊 与 VS Code 扩展的对比

| 功能 | Overleaf Workshop (VS Code) | 本扩展（Zed） |
|------|----------------------------|---------------|
| Virtual Filesystem | ✅ Yes | ❌ No (Zed limitation) |
| Real-time Collaboration | ✅ WebSocket | ⚠️ Planned |
| File Sync | ✅ Automatic | ✅ Auto via watcher |
| Git Integration | ❌ No | ✅ Yes (Premium) |
| CLI Tool | ❌ No | ✅ Yes |
| Auto Git Commit | ❌ No | ✅ Yes |
| PDF Preview | ✅ In-editor | ⚠️ External |

---

## 🤝 贡献

欢迎贡献！以下是一些想法：

- [ ] 增加 WebSocket 支持以实现实时协作
- [ ] 实现在编辑器内的 PDF 预览
- [ ] 添加 SyncTeX 支持（PDF ↔ 源码跳转）
- [ ] 创建用于项目管理的 GUI
- [ ] 支持自建 Overleaf 实例

**参与贡献：**
1. Fork 仓库
2. 创建功能分支
3. 提交 Pull Request

---

## 📜 致谢

- 受 VS Code 的 [Overleaf Workshop](https://github.com/iamhyc/Overleaf-Workshop) 启发
- API 实现基于 [@iamhyc](https://github.com/iamhyc) 的逆向工程
- 为 [Zed Editor](https://zed.dev)（Zed Industries）而构建

---

## 📝 许可证

MIT License - 详见 [LICENSE](LICENSE)。

---

## 🌟 Star 历史

如果本项目对你有帮助，请在 GitHub 上点个 ⭐！

---

## 📧 支持

- **问题**： [GitHub Issues](https://github.com/YOUR_GITHUB_USERNAME/overleaf-zed-extension/issues)
- **讨论**： [GitHub Discussions](https://github.com/YOUR_GITHUB_USERNAME/overleaf-zed-extension/discussions)
- **邮件**： YOUR_EMAIL@example.com

---

---

## 🚀 快速命令速查

```bash
# 安装后：
overleaf-commit         # Smart commit with AI-generated message
overleaf-sync          # Sync from Overleaf to local
git pull overleaf master   # Pull from Overleaf (Git method)
git push overleaf master   # Push to Overleaf (Git method)
```

---

**Made with ❤️ for the LaTeX & Zed community**
