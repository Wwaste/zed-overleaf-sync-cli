# 🚀 改进路线图 - 基于新用户测试

**当前版本**: v0.2.0  
**测试日期**: 2025-12-09  
**总体评分**: ⭐⭐⭐⭐ (4.2/5)

---

## 📊 当前状态总结

### ✅ 核心功能（已完成）
- [x] 自定义项目目录
- [x] 双向自动同步
- [x] Git 集成
- [x] 自动启动脚本（macOS/Linux）
- [x] 跨平台支持
- [x] 向后兼容

### 🎯 用户体验（需改进）
- [ ] 新用户引导流程
- [ ] 项目命名友好性
- [ ] 状态监控
- [ ] 交互式设置
- [ ] 文档更新

---

## 🔥 优先级改进计划

### 🚨 P0 - 紧急（影响新用户体验）

#### 1. 改进 help 输出，添加快速开始指引
**问题**: 新用户不知道从哪里开始  
**优先级**: 🔴 高  
**工作量**: 1小时  
**影响**: 极大改善新用户体验

**实现**:
```javascript
// 在 cli.js 的 help 命令中添加
if (!command || command === "help") {
  log("\n🌟 Overleaf CLI - Bidirectional Sync Tool", "cyan");
  log("════════════════════════════════════════\n");
  
  // 新增：快速开始
  log("🚀 Quick Start (New Users):", "green");
  log("  1. overleaf-cli login           # Login to Overleaf");
  log("  2. overleaf-cli list            # List your projects");
  log("  3. overleaf-cli setup           # Clone a project");
  log("  4. overleaf-cli auto-sync       # Start syncing\n");
  
  log("Commands:", "blue");
  log("  login                     Login to Overleaf");
  // ... 其他命令
}
```

#### 2. 更新 README.md 添加 v0.2.0 新功能
**问题**: README 没有提到新功能  
**优先级**: 🔴 高  
**工作量**: 30分钟  
**影响**: 用户了解新功能

**实现**:
- 在 README 顶部添加 "🆕 What's New in v0.2.0" 章节
- 列出 config, pull, auto-sync 命令
- 链接到 NEW-FEATURES.md

---

### ⚠️ P1 - 重要（改善用户体验）

#### 3. 使用项目名称而非 ID 作为文件夹名
**问题**: 文件夹名 `68c0b895d8bca38ce7a59ba6` 不友好  
**优先级**: 🟡 中  
**工作量**: 2小时  
**影响**: 中等改善用户体验

**实现选项**:
```javascript
// 选项A: 使用项目名称
const projectDir = path.join(
  PROJECTS_DIR,
  projectName.replace(/[^a-zA-Z0-9-_\s]/g, '_')
);

// 选项B: 名称 + ID（避免冲突）
const projectDir = path.join(
  PROJECTS_DIR,
  `${projectName}_${projectId.slice(0, 8)}`
);

// 选项C: 让用户选择
const rl = createInterface();
const customName = await question(
  rl, 
  `Folder name (default: ${projectName}):`
);
```

**推荐**: 选项B，既友好又避免冲突

#### 4. 添加 `status` 命令查看同步状态
**问题**: 用户不知道哪些项目在同步  
**优先级**: 🟡 中  
**工作量**: 3小时  
**影响**: 提升可见性和控制感

**实现**:
```javascript
async function statusCommand() {
  const config = await loadConfig();
  const projectsDir = getProjectsDir(config);
  
  log("\n📊 Sync Status", "blue");
  log("════════════════════════════════════════\n");
  
  // 查找所有项目
  const projects = await fs.readdir(projectsDir);
  
  for (const project of projects) {
    const metaPath = path.join(projectsDir, project, ".overleaf-meta.json");
    if (await fileExists(metaPath)) {
      const meta = JSON.parse(await fs.readFile(metaPath));
      
      // 检查是否有同步进程运行
      const isRunning = await checkSyncRunning(meta.projectId);
      
      if (isRunning) {
        log(`✓ ${meta.projectName}`, "green");
        log(`  Status: Syncing (PID: ${isRunning.pid})`);
      } else {
        log(`✗ ${meta.projectName}`, "yellow");
        log(`  Status: Not syncing`);
      }
      log(`  Path: ${metaPath}\n`);
    }
  }
}
```

#### 5. 集成自动启动功能到 CLI
**问题**: 用户需要手动运行脚本  
**优先级**: 🟡 中  
**工作量**: 2小时  
**影响**: 简化自动启动设置

**实现**:
```javascript
async function enableAutostartCommand(projectPath) {
  const currentDir = projectPath || process.cwd();
  const metadata = JSON.parse(
    await fs.readFile(path.join(currentDir, ".overleaf-meta.json"))
  );
  
  log("\n🚀 Setting up autostart...", "blue");
  
  // 检测平台并调用相应设置
  const platform = os.platform();
  if (platform === "darwin") {
    await setupMacOSAutostart(currentDir, metadata);
  } else if (platform === "linux") {
    await setupLinuxAutostart(currentDir, metadata);
  } else {
    error("Autostart not supported on this platform");
  }
}
```

---

### 💡 P2 - 优化（增强功能）

#### 6. 添加交互式初始化向导 `init` 命令
**问题**: 新用户需要记住多个命令  
**优先级**: 🟢 低  
**工作量**: 4小时  
**影响**: 极大简化新用户设置

**实现**:
```javascript
async function initCommand() {
  const rl = createInterface();
  
  log("\n🎉 Welcome to Overleaf CLI!", "cyan");
  log("════════════════════════════════════════\n");
  
  // Step 1: Check login
  const config = await loadConfig();
  if (!config || !config.cookie) {
    log("Step 1: Login to Overleaf", "blue");
    await loginCommand();
  } else {
    success(`Already logged in as ${config.email}`);
  }
  
  // Step 2: Set projects directory
  log("\nStep 2: Where do you want to store projects?", "blue");
  const defaultDir = path.join(os.homedir(), "Documents", "overleaf");
  const projectsDir = await question(
    rl, 
    `Projects directory (default: ${defaultDir}):`
  ) || defaultDir;
  
  await configCommand("projectsDir", projectsDir);
  
  // Step 3: List and select project
  log("\nStep 3: Select a project to clone", "blue");
  const projects = await api.getProjects();
  projects.forEach((p, i) => log(`  ${i + 1}. ${p.name}`));
  
  const choice = await question(rl, "\nSelect project (number):");
  const selectedProject = projects[parseInt(choice) - 1];
  
  await setupCommand(selectedProject.id);
  
  // Step 4: Auto-sync
  log("\nStep 4: Enable auto-sync?", "blue");
  const enableSync = await question(rl, "Enable auto-sync? (y/n):");
  
  if (enableSync.toLowerCase() === 'y') {
    const projectPath = path.join(projectsDir, selectedProject.id);
    await enableAutostartCommand(projectPath);
  }
  
  rl.close();
  
  log("\n✅ Setup complete! Happy writing!", "green");
}
```

#### 7. 添加 `rename` 命令重命名项目文件夹
**问题**: 克隆后无法修改文件夹名  
**优先级**: 🟢 低  
**工作量**: 1小时  
**影响**: 小幅提升灵活性

**实现**:
```javascript
async function renameCommand(oldName, newName) {
  const config = await loadConfig();
  const projectsDir = getProjectsDir(config);
  
  const oldPath = path.join(projectsDir, oldName);
  const newPath = path.join(projectsDir, newName);
  
  await fs.rename(oldPath, newPath);
  
  // Update metadata
  const metaPath = path.join(newPath, ".overleaf-meta.json");
  const meta = JSON.parse(await fs.readFile(metaPath));
  meta.localPath = newPath;
  await fs.writeFile(metaPath, JSON.stringify(meta, null, 2));
  
  success(`Renamed: ${oldName} → ${newName}`);
}
```

#### 8. 添加 `stop` 命令停止同步
**问题**: 用户不知道如何停止同步  
**优先级**: 🟢 低  
**工作量**: 2小时  
**影响**: 提升控制能力

**实现**:
```javascript
async function stopCommand(projectPath) {
  const currentDir = projectPath || process.cwd();
  const metadata = JSON.parse(
    await fs.readFile(path.join(currentDir, ".overleaf-meta.json"))
  );
  
  // 查找并终止同步进程
  const pids = await findSyncProcesses(metadata.projectId);
  
  if (pids.length === 0) {
    info("No sync process running");
    return;
  }
  
  for (const pid of pids) {
    process.kill(pid);
    success(`Stopped sync process (PID: ${pid})`);
  }
}
```

---

### 🌟 P3 - 锦上添花（未来增强）

#### 9. 添加 `dashboard` 命令（Web UI）
**优先级**: 🔵 很低  
**工作量**: 8小时  
**描述**: 启动本地 Web 界面管理所有项目

#### 10. 冲突解决策略配置
**优先级**: 🔵 很低  
**工作量**: 6小时  
**描述**: 让用户选择冲突处理方式（本地优先/远程优先/手动）

#### 11. 多项目批量操作
**优先级**: 🔵 很低  
**工作量**: 4小时  
**描述**: 一次性同步所有项目

#### 12. 实时协作指示器
**优先级**: 🔵 很低  
**工作量**: 10小时  
**描述**: 显示谁在编辑同一文件

---

## 📅 实施时间表

### 第一阶段（立即）- 新用户体验
**时间**: 1-2天  
**目标**: 让新用户轻松上手

- [ ] 改进 help 输出
- [ ] 更新 README.md
- [ ] 测试新用户流程

### 第二阶段（1周内）- 功能增强
**时间**: 3-5天  
**目标**: 提升核心功能易用性

- [ ] 项目命名改进
- [ ] status 命令
- [ ] enable-autostart 命令
- [ ] 文档完善

### 第三阶段（2周内）- 高级功能
**时间**: 5-7天  
**目标**: 增加高级特性

- [ ] init 交互式向导
- [ ] rename 命令
- [ ] stop 命令
- [ ] 完整测试

### 第四阶段（未来）- 探索性功能
**时间**: 待定  
**目标**: 根据用户反馈决定

- [ ] Dashboard Web UI
- [ ] 冲突解决策略
- [ ] 批量操作
- [ ] 协作功能

---

## 📝 文档改进清单

### 立即更新
- [ ] README.md - 添加 v0.2.0 新功能
- [ ] GETTING-STARTED.md - 更新命令列表
- [ ] CLI help 输出 - 添加快速开始

### 后续添加
- [ ] TROUBLESHOOTING.md - 常见问题
- [ ] CONTRIBUTING.md - 贡献指南
- [ ] CHANGELOG.md - 版本历史
- [ ] API.md - API 文档（如果有）

---

## 🎯 成功指标

| 指标 | 当前 | 目标 |
|------|------|------|
| 新用户 5 分钟内完成设置 | 60% | 90% |
| 用户评分 | 4.2/5 | 4.5/5 |
| GitHub Stars | - | 100+ |
| 文档完整度 | 80% | 95% |
| 单元测试覆盖率 | 0% | 70% |

---

## 💬 用户反馈收集

### 需要收集的数据
- [ ] 新用户完成首次设置的时间
- [ ] 最常用的命令
- [ ] 最常遇到的错误
- [ ] 最需要的功能
- [ ] 文档中最难理解的部分

### 反馈渠道
- GitHub Issues
- Discord/Slack 社区（如果有）
- 用户调查问卷
- 使用统计（可选，匿名）

---

## 🏆 竞品对比

| 功能 | Overleaf-Zed | VS Code Extension | Overleaf Workshop |
|------|--------------|-------------------|-------------------|
| 双向同步 | ✅ | ✅ | ✅ |
| Git 集成 | ✅ | ❌ | ✅ |
| 自动启动 | ✅ | ❌ | ❌ |
| 自定义目录 | ✅ | ❌ | ❌ |
| 交互式设置 | ❌ (计划中) | ✅ | ❌ |
| Web UI | ❌ | ✅ | ❌ |

**差异化优势**:
- ✅ 完全基于 Git（更可靠）
- ✅ 跨平台自动启动
- ✅ 灵活的目录配置

**需要赶上的**:
- ❌ 交互式向导
- ❌ 图形界面

---

## 结论

**当前状态**: 功能完整，技术实现优秀  
**主要问题**: 新用户体验需要优化  
**改进方向**: 降低学习曲线，增加易用性  
**预期效果**: 完成 P0/P1 改进后，评分可达 4.5/5

**建议行动**:
1. 立即完成 P0 改进（2小时工作量）
2. 1周内完成 P1 改进（10小时工作量）
3. 收集真实用户反馈
4. 根据反馈调整 P2/P3 优先级
