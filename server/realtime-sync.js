/**
 * Overleaf 实时同步模块
 * 基于 Socket.IO 实现与 Overleaf 的实时双向同步
 */

import { io } from "socket.io-client";
import DiffMatchPatch from "diff-match-patch";
import chokidar from "chokidar";
import fs from "fs/promises";
import path from "path";
import { EventEmitter } from "events";

const dmp = new DiffMatchPatch();

export class OverleafRealtimeSync extends EventEmitter {
  constructor(serverUrl, cookies, projectId, projectDir) {
    super();
    this.serverUrl = serverUrl;
    this.cookies = cookies;
    this.projectId = projectId;
    this.projectDir = projectDir;
    this.socket = null;
    this.docs = new Map(); // docId -> {version, content, _id}
    this.watcher = null;
    this.isConnected = false;
  }

  /**
   * 连接到 Overleaf Socket.IO
   */
  async connect() {
    return new Promise((resolve, reject) => {
      console.log("🔌 连接 Overleaf WebSocket...");

      // 构建 Cookie 字符串
      const cookieStr = Object.entries(this.cookies)
        .map(([k, v]) => `${k}=${v}`)
        .join("; ");

      this.socket = io(this.serverUrl, {
        path: "/socket.io",
        transports: ["websocket", "polling"],
        extraHeaders: {
          Cookie: cookieStr,
        },
      });

      // 连接成功
      this.socket.on("connect", () => {
        console.log("✅ WebSocket 已连接");
        this.isConnected = true;
        this.joinProject().then(resolve).catch(reject);
      });

      // 连接错误
      this.socket.on("connect_error", (err) => {
        console.error("❌ 连接失败:", err.message);
        reject(err);
      });

      // 连接超时
      setTimeout(() => {
        if (!this.isConnected) {
          reject(new Error("连接超时"));
        }
      }, 10000);
    });
  }

  /**
   * 加入项目
   */
  async joinProject() {
    return new Promise((resolve, reject) => {
      console.log(`📂 加入项目: ${this.projectId}`);

      this.socket.emit(
        "joinProject",
        { project_id: this.projectId },
        (error, ...args) => {
          if (error) {
            console.error("❌ 加入项目失败:", error);
            reject(error);
            return;
          }

          const [project, permissionsLevel, protocolVersion] = args;
          console.log("✅ 已加入项目");
          console.log(`   权限: ${permissionsLevel}`);
          console.log(`   协议版本: ${protocolVersion}`);

          // 保存项目结构
          this.project = project;
          this.buildDocMap(project.rootFolder[0]);

          // 设置远程变化监听
          this.setupRemoteListeners();

          resolve(project);
        },
      );
    });
  }

  /**
   * 构建文档映射
   */
  buildDocMap(folder, basePath = "") {
    if (folder.docs) {
      folder.docs.forEach((doc) => {
        const docPath = path.join(basePath, doc.name);
        this.docs.set(doc._id, {
          _id: doc._id,
          name: doc.name,
          path: docPath,
          version: 0,
          content: null,
        });
      });
    }

    if (folder.folders) {
      folder.folders.forEach((subfolder) => {
        this.buildDocMap(subfolder, path.join(basePath, subfolder.name));
      });
    }
  }

  /**
   * 设置远程变化监听
   */
  setupRemoteListeners() {
    // 文档更新
    this.socket.on("otUpdateApplied", (update) => {
      this.handleRemoteUpdate(update);
    });

    // 文档创建
    this.socket.on("reciveNewDoc", (parentFolderId, doc) => {
      console.log(`➕ 远程创建文档: ${doc.name}`);
      this.emit("remote-add", doc);
    });

    // 文档删除
    this.socket.on("removeEntity", (entityId) => {
      console.log(`❌ 远程删除: ${entityId}`);
      this.emit("remote-delete", entityId);
    });
  }

  /**
   * 处理远程更新
   */
  async handleRemoteUpdate(update) {
    const docId = update.doc_id;
    const doc = this.docs.get(docId);

    if (!doc) return;

    console.log(`📥 收到远程更新: ${doc.name}`);

    // 更新版本
    doc.version = update.v;

    // 应用操作
    if (doc.content && update.op) {
      doc.content = this.applyOps(doc.content, update.op);

      // 写入本地文件
      const localPath = path.join(this.projectDir, doc.path);
      await fs.writeFile(localPath, doc.content, "utf-8");

      this.emit("remote-change", doc);
    }
  }

  /**
   * 应用操作转换
   */
  applyOps(content, ops) {
    let position = 0;
    let result = content;

    for (const op of ops) {
      if (op.i !== undefined) {
        // 插入
        result =
          result.slice(0, op.p + position) +
          op.i +
          result.slice(op.p + position);
        position += op.i.length;
      } else if (op.d !== undefined) {
        // 删除
        result = result.slice(0, op.p) + result.slice(op.p + op.d.length);
        position -= op.d.length;
      }
    }

    return result;
  }

  /**
   * 加入文档编辑
   */
  async joinDoc(docId) {
    return new Promise((resolve, reject) => {
      this.socket.emit("joinDoc", docId, (error, ...args) => {
        if (error) {
          reject(error);
          return;
        }

        const [docLines, version, updates] = args;
        const content = docLines
          .map((line) => Buffer.from(line, "ascii").toString("utf-8"))
          .join("\n");

        const doc = this.docs.get(docId);
        if (doc) {
          doc.content = content;
          doc.version = version;
        }

        resolve({ content, version });
      });
    });
  }

  /**
   * 发送本地更新
   */
  async sendUpdate(docId, oldContent, newContent) {
    const doc = this.docs.get(docId);
    if (!doc) {
      console.error(`文档不存在: ${docId}`);
      return;
    }

    // 计算 diff
    const diffs = dmp.diff_main(oldContent, newContent);
    dmp.diff_cleanupSemantic(diffs);

    // 转换为 OT 操作
    const ops = [];
    let position = 0;

    for (const [type, text] of diffs) {
      if (type === 1) {
        // 插入
        ops.push({ i: text, p: position });
        position += text.length;
      } else if (type === -1) {
        // 删除
        ops.push({ d: text, p: position });
      } else {
        // 不变
        position += text.length;
      }
    }

    if (ops.length === 0) {
      return; // 没有变化
    }

    // 发送更新
    return new Promise((resolve, reject) => {
      this.socket.emit(
        "applyOtUpdate",
        docId,
        {
          doc: docId,
          op: ops,
          v: doc.version,
          meta: {
            source: "zed-extension",
            ts: Date.now(),
          },
        },
        (error) => {
          if (error) {
            console.error(`❌ 发送更新失败: ${error.message}`);
            reject(error);
          } else {
            console.log(`✅ 已发送更新: ${doc.name}`);
            doc.version++;
            doc.content = newContent;
            resolve();
          }
        },
      );
    });
  }

  /**
   * 启动本地文件监听
   */
  async startFileWatch() {
    console.log(`\n🔍 开始监听本地文件: ${this.projectDir}`);

    // 首先加载所有文档
    for (const [docId, doc] of this.docs) {
      const localPath = path.join(this.projectDir, doc.path);

      try {
        // 检查文件是否存在
        await fs.access(localPath);

        // 加入文档编辑
        const { content, version } = await this.joinDoc(docId);
        doc.content = content;
        doc.version = version;

        console.log(`  ✓ ${doc.path} (v${version})`);
      } catch (err) {
        console.log(`  ⚠️  ${doc.path} - 本地不存在`);
      }
    }

    console.log("\n✅ 文档加载完成,开始监听变化...\n");

    // 启动文件监听
    this.watcher = chokidar.watch(this.projectDir, {
      ignored: /(^|[\/\\])\..|\.pdf$|\.zip$/,
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 500,
        pollInterval: 100,
      },
    });

    this.watcher.on("change", async (filePath) => {
      await this.handleLocalChange(filePath);
    });
  }

  /**
   * 处理本地文件变化
   */
  async handleLocalChange(filePath) {
    const relativePath = path.relative(this.projectDir, filePath);

    // 查找对应的文档
    let targetDoc = null;
    for (const [docId, doc] of this.docs) {
      if (doc.path === relativePath) {
        targetDoc = doc;
        break;
      }
    }

    if (!targetDoc) {
      console.log(`⚠️  ${relativePath} - 不在同步列表中`);
      return;
    }

    console.log(`📝 检测到本地修改: ${relativePath}`);

    try {
      const newContent = await fs.readFile(filePath, "utf-8");
      const oldContent = targetDoc.content || "";

      await this.sendUpdate(targetDoc._id, oldContent, newContent);
    } catch (err) {
      console.error(`❌ 处理本地变化失败: ${err.message}`);
    }
  }

  /**
   * 断开连接
   */
  async disconnect() {
    if (this.watcher) {
      await this.watcher.close();
    }

    if (this.socket) {
      this.socket.disconnect();
    }

    console.log("\n✅ 已断开连接");
  }
}
