# Quick Start Guide

## 安装

```bash
cd /path/to/overleaf-zed-extension/server
npm install
npm link
```

## 首次使用

1. 登录 Overleaf：
```bash
overleaf-cli login
```

2. 配置项目目录（可选）：
```bash
overleaf-cli config projectsDir ~/Documents/overleaf
```

3. 列出项目：
```bash
overleaf-cli list
```

4. 下载项目（文件夹名使用项目名称）：
```bash
overleaf-cli setup
# 或指定项目 ID/编号
overleaf-cli setup <project-id>
```

## 日常使用

### 手动同步
```bash
# 拉取远程更新
overleaf-cli pull ~/Documents/overleaf/我的项目

# 监控本地变化并同步到 Overleaf
overleaf-cli watch ~/Documents/overleaf/我的项目
```

### 自动双向同步
```bash
# 启动双向自动同步（推荐）
overleaf-cli auto-sync ~/Documents/overleaf/我的项目
```

### 设置开机自启动
```bash
cd /path/to/overleaf-zed-extension
./scripts/setup-auto-sync.sh
```

## 特性

✅ **项目名称文件夹**：下载的项目使用项目名称而不是 ID  
✅ **Unicode 支持**：支持中文、日文等多语言项目名  
✅ **双向同步**：本地和 Overleaf 之间实时同步  
✅ **自定义目录**：可配置项目存储位置  
✅ **自动启动**：支持 macOS 和 Linux 开机自启  

## 更多信息

- 详细使用指南：`DAILY-USAGE-GUIDE.md`
- 工作原理：`HOW-IT-WORKS.md`
- 版本更新：`RELEASE-NOTES.md`
- 改进计划：`IMPROVEMENT-ROADMAP.md`

## 故障排查

如果遇到问题，请检查：
1. 是否已登录：`overleaf-cli config`
2. Git 是否已安装：`git --version`
3. Node.js 版本：`node --version` (需要 v14+)

获取帮助：
```bash
overleaf-cli help
```
