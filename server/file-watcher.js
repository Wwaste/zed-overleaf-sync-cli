/**
 * File Watcher - Automatic sync with Overleaf
 * Watches for file changes and syncs to Overleaf
 * Supports automatic git commit/push
 */

import chokidar from 'chokidar';
import { OverleafAPI } from './overleaf-api.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';

const CONFIG_FILE = path.join(os.homedir(), '.overleaf-zed', 'config.json');

export class FileWatcher {
  constructor(projectDir, projectId) {
    this.projectDir = projectDir;
    this.projectId = projectId;
    this.api = null;
    this.watcher = null;
    this.uploadQueue = new Map();
    this.uploadTimer = null;
    this.isGitEnabled = false;
    this.rootFolderId = null;
  }

  async loadConfig() {
    const data = await fs.readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(data);
  }

  async init() {
    const config = await this.loadConfig();
    this.api = new OverleafAPI(config.serverUrl);
    await this.api.loginWithCookie(config.cookie);

    // Check if git is enabled
    try {
      execSync('git rev-parse --git-dir', { cwd: this.projectDir, stdio: 'ignore' });
      this.isGitEnabled = true;
      console.log('✓ Git integration enabled');
    } catch (err) {
      this.isGitEnabled = false;
      console.log('ℹ Git not initialized (local-only mode)');
    }
  }

  async start() {
    await this.init();

    // Watch for file changes
    this.watcher = chokidar.watch(this.projectDir, {
      ignored: [
        /(^|[\/\\])\../, // Ignore dotfiles
        /node_modules/,
        /output\.pdf/,
        /\.git/,
        /\.overleaf-meta\.json/,
      ],
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 1000,
        pollInterval: 100,
      },
    });

    this.watcher
      .on('add', (filePath) => this.onFileChange('added', filePath))
      .on('change', (filePath) => this.onFileChange('modified', filePath))
      .on('unlink', (filePath) => this.onFileChange('deleted', filePath));

    console.log('👁️  Watching for changes...\n');
  }

  async onFileChange(event, filePath) {
    const relativePath = path.relative(this.projectDir, filePath);
    const timestamp = new Date().toLocaleTimeString();

    console.log(`[${timestamp}] ${event}: ${relativePath}`);

    // Add to upload queue
    this.uploadQueue.set(relativePath, {
      filePath,
      relativePath,
      event,
      timestamp: Date.now(),
    });

    // Debounce uploads (wait 2 seconds for more changes)
    if (this.uploadTimer) {
      clearTimeout(this.uploadTimer);
    }

    this.uploadTimer = setTimeout(() => {
      this.processUploadQueue();
    }, 2000);
  }

  async processUploadQueue() {
    if (this.uploadQueue.size === 0) return;

    const changes = Array.from(this.uploadQueue.values());
    this.uploadQueue.clear();

    console.log(`\n🔄 Syncing ${changes.length} file(s) to Overleaf...`);

    try {
      // Get project structure
      // Get project structure
      const project = await this.api.getProjectDetails(this.projectId);
      const rootFolder = project.rootFolder[0];
      this.rootFolderId = rootFolder._id;
      const fileMap = this.buildFileMap(rootFolder);

      // Process each change
      for (const change of changes) {
        try {
          if (change.event === 'deleted') {
            await this.handleDelete(change, fileMap);
          } else {
            await this.handleUpload(change, fileMap);
          }
        } catch (err) {
          console.error(`  ✗ Failed to sync ${change.relativePath}: ${err.message}`);
        }
      }

      console.log('✓ Sync complete\n');

      // Auto git commit if enabled
      if (this.isGitEnabled) {
        await this.autoGitCommit(changes);
      }

    } catch (err) {
      console.error(`✗ Sync failed: ${err.message}\n`);
    }
  }

  buildFileMap(folder, basePath = '', map = new Map()) {
    if (folder.docs) {
      folder.docs.forEach(doc => {
        const filePath = path.join(basePath, doc.name);
        map.set(filePath, { id: doc._id, type: 'doc', folderId: folder._id });
      });
    }

    if (folder.fileRefs) {
      folder.fileRefs.forEach(file => {
        const filePath = path.join(basePath, file.name);
        map.set(filePath, { id: file._id, type: 'file', folderId: folder._id });
      });
    }

    if (folder.folders) {
      folder.folders.forEach(subfolder => {
        const subPath = path.join(basePath, subfolder.name);
        map.set(subPath, { id: subfolder._id, type: 'folder', folderId: folder._id });
        this.buildFileMap(subfolder, subPath, map);
      });
    }

    return map;
  }

  async handleUpload(change, fileMap) {
    const fileInfo = fileMap.get(change.relativePath);

    // Read file content
    const content = await fs.readFile(change.filePath, 'utf-8');

    if (fileInfo) {
      // Update existing file
      if (fileInfo.type === 'doc') {
        await this.api.updateFileContent(this.projectId, fileInfo.id, content);
        console.log(`  ✓ Updated: ${change.relativePath}`);
      } else {
        // For binary files, need to delete and re-upload
        console.log(`  ⚠ Binary file updates not fully supported: ${change.relativePath}`);
      }
    } else {
      // Create new file
      const parentPath = path.dirname(change.relativePath);
      const fileName = path.basename(change.relativePath);
      const normalizedParentPath = parentPath === '.' ? '' : parentPath;

      const parentFolderId = await this.ensureFolderPath(normalizedParentPath, fileMap);

      const newFileId = await this.api.createDocument(
        this.projectId,
        parentFolderId,
        fileName
      );
      await this.api.updateFileContent(this.projectId, newFileId, content);
      fileMap.set(change.relativePath, { id: newFileId, type: 'doc', folderId: parentFolderId });
      console.log(`  ✓ Created: ${change.relativePath}`);
    }
  }


  async ensureFolderPath(folderPath, fileMap) {
    if (!folderPath) {
      return this.rootFolderId;
    }

    const parts = folderPath.split(path.sep).filter(Boolean);
    let currentPath = "";
    let parentId = this.rootFolderId;

    for (const part of parts) {
      currentPath = currentPath ? path.join(currentPath, part) : part;
      const existing = fileMap.get(currentPath);

      if (existing && existing.type === "folder") {
        parentId = existing.id;
        continue;
      }

      const newFolderId = await this.api.createFolder(
        this.projectId,
        parentId,
        part
      );
      fileMap.set(currentPath, { id: newFolderId, type: "folder", folderId: parentId });
      parentId = newFolderId;
    }

    return parentId;
  }

  async handleDelete(change, fileMap) {
    const fileInfo = fileMap.get(change.relativePath);

    if (fileInfo) {
      await this.api.deleteEntity(this.projectId, fileInfo.type, fileInfo.id);
      console.log(`  ✓ Deleted: ${change.relativePath}`);
    }
  }

  async autoGitCommit(changes) {
    try {
      // Stage changes
      execSync('git add -A', { cwd: this.projectDir, stdio: 'ignore' });

      // Check if there are changes to commit
      try {
        execSync('git diff --cached --quiet', { cwd: this.projectDir, stdio: 'ignore' });
        // No changes
        return;
      } catch (err) {
        // There are changes, continue to commit
      }

      // Create commit message
      const fileList = changes.map(c => `${c.event}: ${c.relativePath}`).join(', ');
      const message = `Auto-sync: ${fileList}`;

      // Commit
      execSync(`git commit -m "${message}"`, { cwd: this.projectDir, stdio: 'ignore' });
      console.log('📝 Git: Changes committed locally');

      // Try to push if remote is configured
      try {
        execSync('git remote get-url overleaf', { cwd: this.projectDir, stdio: 'ignore' });
        execSync('git push overleaf master', { cwd: this.projectDir, stdio: 'ignore' });
        console.log('📤 Git: Pushed to Overleaf');
      } catch (err) {
        // No remote or push failed, that's ok
      }

    } catch (err) {
      console.error(`⚠ Git commit failed: ${err.message}`);
    }
  }

  stop() {
    if (this.watcher) {
      this.watcher.close();
    }
    if (this.uploadTimer) {
      clearTimeout(this.uploadTimer);
    }
  }
}
