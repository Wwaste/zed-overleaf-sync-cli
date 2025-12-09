# Release Notes - v0.2.0

## 重要更新

### 🎯 项目文件夹使用项目名称
- ✅ 下载的项目文件夹现在使用项目名称而不是项目 ID
- ✅ 支持中文、日文等 Unicode 字符
- ✅ 自动清理文件系统不安全字符（/, \, :, *, ?, ", <, >, |）

### 🔄 双向自动同步
- ✅ 本地 → Overleaf：实时监控文件变化并立即同步
- ✅ Overleaf → 本地：30秒轮询检测远程变化
- ✅ 自动启动支持（macOS launchd / Linux systemd）

### ⚙️ 自定义项目目录
- ✅ 配置文件支持：`~/.overleaf-zed/config.json`
- ✅ 环境变量支持：`OVERLEAF_PROJECTS_DIR`
- ✅ 默认目录：`~/overleaf-projects`
- ✅ 三级优先级：配置文件 > 环境变量 > 默认值

### 📝 新增命令
```bash
# 配置管理
overleaf-cli config                           # 查看所有配置
overleaf-cli config projectsDir ~/Documents/overleaf  # 设置项目目录

# 手动拉取更新
overleaf-cli pull [项目路径]                   # 拉取远程更新

# 双向自动同步
overleaf-cli auto-sync [项目路径]              # 启动双向自动同步
```

### 🔧 技术改进
- 修复了 `getProjectDetails` API 调用，正确获取项目名称
- 优化了文件名清理逻辑，支持国际化字符
- 完全向后兼容，无需修改现有配置

### 📊 测试结果
- 21 项测试全部通过
- 新用户体验评分：4.2/5
- 支持中英文项目名称

## 升级方法

1. 卸载旧版本（如果已安装）：
```bash
npm unlink -g overleaf-mcp-server
```

2. 安装新版本：
```bash
cd /path/to/overleaf-zed-extension/server
npm link
```

3. 验证安装：
```bash
overleaf-cli help
```

## 下一步计划
查看 IMPROVEMENT-ROADMAP.md 了解未来改进方向

## 日常使用
查看 DAILY-USAGE-GUIDE.md 了解完整的命令列表和使用方法
