# 📖 Overleaf CLI 插件 - 完整使用指南

## 🚀 基础命令

### 1. 查看帮助
```bash
overleaf-cli help
```

### 2. 登录 Overleaf
```bash
overleaf-cli login
# 按提示输入 cookie
```

### 3. 列出所有项目
```bash
overleaf-cli list
# 显示你所有的 Overleaf 项目及 ID
```

### 4. 克隆项目到本地
```bash
# 方式1: 指定项目ID
overleaf-cli setup 68c0b895d8bca38ce7a59ba6

# 方式2: 交互式选择
overleaf-cli setup
# 然后从列表中选择
```

---

## ⚙️ 配置命令

### 查看当前配置
```bash
overleaf-cli config
```

### 设置自定义项目目录
```bash
overleaf-cli config projectsDir ~/Documents/overleaf
```

### 设置自定义服务器（如果用私有部署）
```bash
overleaf-cli config serverUrl https://your-overleaf.com
```

---

## 🔄 同步命令

### 启动双向自动同步（最常用）
```bash
cd ~/Desktop/NormalFile/overleaf/68c0b895d8bca38ce7a59ba6
overleaf-cli auto-sync

# 或指定路径
overleaf-cli auto-sync ~/Desktop/NormalFile/overleaf/68c0b895d8bca38ce7a59ba6
```

**功能:**
- ✅ 本地修改 → 立即推送到 Overleaf
- ✅ Overleaf 修改 → 每30秒自动拉取

### 只监控本地修改（单向同步）
```bash
cd ~/Desktop/NormalFile/overleaf/68c0b895d8bca38ce7a59ba6
overleaf-cli watch
```

### 手动拉取 Overleaf 更新
```bash
cd ~/Desktop/NormalFile/overleaf/68c0b895d8bca38ce7a59ba6
overleaf-cli pull
```

**使用场景:** 不想等30秒，立即获取 Overleaf 的更新

---

## 🔨 编译命令

### 编译 LaTeX 项目
```bash
cd ~/Desktop/NormalFile/overleaf/68c0b895d8bca38ce7a59ba6
overleaf-cli compile

# 会生成 output.pdf
```

---

## 🛠️ 进程管理

### 查看正在运行的同步进程
```bash
ps aux | grep "overleaf-cli" | grep -v grep
```

### 停止所有同步进程
```bash
pkill -f "overleaf-cli auto-sync"
# 或
pkill -f "overleaf-cli watch"
```

### 停止特定项目的同步
```bash
# 先找到 PID
ps aux | grep "overleaf-cli auto-sync" | grep "68c0b895d8bca38ce7a59ba6"

# 然后 kill
kill <PID>
```

---

## 📋 日常工作流程

### 每天开始工作
```bash
# 1. 进入项目目录
cd ~/Desktop/NormalFile/overleaf/68c0b895d8bca38ce7a59ba6

# 2. 启动双向同步
overleaf-cli auto-sync

# 3. 开始编辑本地文件
# 修改会自动同步到 Overleaf
```

### 下班/休息时
```bash
# 停止同步（可选，也可以一直开着）
pkill -f "overleaf-cli auto-sync"
```

### 克隆新项目
```bash
# 1. 查看所有项目
overleaf-cli list

# 2. 克隆指定项目
overleaf-cli setup <project-id>

# 3. 进入新项目
cd ~/Desktop/NormalFile/overleaf/<project-id>

# 4. 启动同步
overleaf-cli auto-sync
```

---

## 🎯 常见场景

### 场景1: 在多台电脑上工作
```bash
# 电脑A
cd ~/Desktop/NormalFile/overleaf/68c0b895d8bca38ce7a59ba6
overleaf-cli auto-sync

# 电脑B（同样操作）
cd ~/Documents/overleaf/68c0b895d8bca38ce7a59ba6
overleaf-cli auto-sync

# 两台电脑都会通过 Overleaf 保持同步
```

### 场景2: 只在本地编辑，偶尔同步
```bash
# 启动单向监控
overleaf-cli watch

# 需要时手动拉取
overleaf-cli pull
```

### 场景3: 紧急修改，立即同步
```bash
# 修改文件后
echo "some changes" >> myfile.tex

# 立即推送（watch/auto-sync 会自动推送）
# 或手动推送
git add .
git commit -m "urgent fix"
git push overleaf master
```

### 场景4: 网页编辑后立即拉取
```bash
# 不想等30秒，立即拉取
cd ~/Desktop/NormalFile/overleaf/68c0b895d8bca38ce7a59ba6
overleaf-cli pull
```

---

## 🔧 高级技巧

### 使用 tmux/screen 后台运行
```bash
# 使用 tmux
tmux new -s overleaf
cd ~/Desktop/NormalFile/overleaf/68c0b895d8bca38ce7a59ba6
overleaf-cli auto-sync
# 按 Ctrl+B 然后 D 来分离会话

# 恢复会话
tmux attach -t overleaf
```

### 查看同步日志
```bash
# auto-sync 的输出会显示在终端
# 如果在后台运行，可以重定向：
overleaf-cli auto-sync > ~/overleaf-sync.log 2>&1 &

# 查看日志
tail -f ~/overleaf-sync.log
```

### 同时同步多个项目
```bash
# 项目1
cd ~/Desktop/NormalFile/overleaf/project1
overleaf-cli auto-sync &

# 项目2
cd ~/Desktop/NormalFile/overleaf/project2
overleaf-cli auto-sync &

# 查看所有同步进程
ps aux | grep "overleaf-cli auto-sync"
```

---

## ⚠️ 注意事项

1. **同步进程依赖终端**
   - 关闭终端会停止同步
   - 建议使用 tmux/screen 或设置自动启动

2. **网络要求**
   - 需要能访问 Overleaf
   - Git 操作需要网络连接

3. **冲突处理**
   - 如果同时在本地和网页编辑同一文件
   - 可能会产生 Git 冲突
   - 需要手动解决冲突

4. **Git Premium 用户**
   - 所有功能需要 Overleaf Premium（Git 支持）
   - 免费用户只能手动下载项目

---

## 📞 问题排查

### 问题: 同步不工作
```bash
# 1. 检查进程是否在运行
ps aux | grep overleaf-cli

# 2. 检查 Git 状态
cd ~/Desktop/NormalFile/overleaf/68c0b895d8bca38ce7a59ba6
git status

# 3. 手动测试 Git
git pull overleaf master
```

### 问题: 登录失效
```bash
# 重新登录
overleaf-cli login

# 检查配置
overleaf-cli config
```

### 问题: 项目找不到
```bash
# 检查项目目录配置
overleaf-cli config

# 列出所有项目
overleaf-cli list

# 检查文件系统
ls -la ~/Desktop/NormalFile/overleaf/
```

---

## 📚 相关文档

- `NEW-FEATURES.md` - v0.2.0 新功能
- `IMPROVEMENT-ROADMAP.md` - 未来改进计划
- `TEST-REPORT.md` - 测试报告
- `README.md` - 完整说明

---

## 🎓 快速参考卡片

```
┌─────────────────────────────────────────────────────────┐
│  最常用的5个命令                                         │
├─────────────────────────────────────────────────────────┤
│  1. overleaf-cli list          # 列出项目               │
│  2. overleaf-cli setup         # 克隆项目               │
│  3. overleaf-cli auto-sync     # 启动双向同步 ★★★       │
│  4. overleaf-cli pull          # 手动更新               │
│  5. pkill -f "overleaf-cli"    # 停止同步               │
└─────────────────────────────────────────────────────────┘
```

---

**就这么简单！祝你写作愉快！** 🎉
