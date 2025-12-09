#!/usr/bin/env node

/**
 * Overleaf MCP Server for Zed
 * Provides tools for syncing, compiling, and managing Overleaf projects
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { OverleafAPI } from "./overleaf-api.js";
import { OverleafRealtimeSync } from "./realtime-sync.js";
import fs from "fs/promises";
import path from "path";
import os from "os";

// Global API instance
let api = null;
let configDir = null;
let syncDir = null;

// 全局同步实例管理器
const activeSyncs = new Map(); // projectId -> OverleafRealtimeSync

/**
 * Initialize configuration directories
 */
async function initConfig() {
  const homeDir = os.homedir();
  configDir = path.join(homeDir, ".overleaf-zed");
  syncDir = path.join(configDir, "projects");

  await fs.mkdir(configDir, { recursive: true });
  await fs.mkdir(syncDir, { recursive: true });
}

/**
 * Load saved credentials
 */
async function loadCredentials() {
  try {
    const credPath = path.join(configDir, "credentials.json");
    const data = await fs.readFile(credPath, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    return null;
  }
}

/**
 * Save credentials
 */
async function saveCredentials(creds) {
  const credPath = path.join(configDir, "credentials.json");
  await fs.writeFile(credPath, JSON.stringify(creds, null, 2), "utf-8");
}

/**
 * Get project local directory
 */
function getProjectDir(projectId) {
  return path.join(syncDir, projectId);
}

/**
 * Recursively build file tree
 */
function buildFileTree(folder, basePath = "") {
  const files = [];

  if (folder.docs) {
    folder.docs.forEach((doc) => {
      files.push({
        id: doc._id,
        name: doc.name,
        path: path.join(basePath, doc.name),
        type: "doc",
      });
    });
  }

  if (folder.fileRefs) {
    folder.fileRefs.forEach((file) => {
      files.push({
        id: file._id,
        name: file.name,
        path: path.join(basePath, file.name),
        type: "file",
      });
    });
  }

  if (folder.folders) {
    folder.folders.forEach((subfolder) => {
      const subPath = path.join(basePath, subfolder.name);
      files.push({
        id: subfolder._id,
        name: subfolder.name,
        path: subPath,
        type: "folder",
      });

      // Recursively process subfolders
      const subFiles = buildFileTree(subfolder, subPath);
      files.push(...subFiles);
    });
  }

  return files;
}

/**
 * Create MCP server
 */
const server = new Server(
  {
    name: "overleaf-mcp-server",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

/**
 * List available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "overleaf_login_password",
        description: "Login to Overleaf with email and password",
        inputSchema: {
          type: "object",
          properties: {
            server_url: {
              type: "string",
              description:
                "Overleaf server URL (default: https://www.overleaf.com)",
              default: "https://www.overleaf.com",
            },
            email: {
              type: "string",
              description: "Your Overleaf email",
            },
            password: {
              type: "string",
              description: "Your Overleaf password",
            },
          },
          required: ["email", "password"],
        },
      },
      {
        name: "overleaf_login_cookie",
        description:
          "Login to Overleaf with cookie (for SSO/captcha-enabled servers)",
        inputSchema: {
          type: "object",
          properties: {
            server_url: {
              type: "string",
              description:
                "Overleaf server URL (default: https://www.overleaf.com)",
              default: "https://www.overleaf.com",
            },
            cookie: {
              type: "string",
              description:
                'Cookie string from browser (e.g., "overleaf_session2=...; sharelatex.sid=...")',
            },
          },
          required: ["cookie"],
        },
      },
      {
        name: "overleaf_list_projects",
        description: "List all Overleaf projects",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "overleaf_get_project",
        description: "Get project details and file structure",
        inputSchema: {
          type: "object",
          properties: {
            project_id: {
              type: "string",
              description: "Project ID",
            },
          },
          required: ["project_id"],
        },
      },
      {
        name: "overleaf_sync_download",
        description: "Download project files to local directory",
        inputSchema: {
          type: "object",
          properties: {
            project_id: {
              type: "string",
              description: "Project ID",
            },
          },
          required: ["project_id"],
        },
      },
      {
        name: "overleaf_sync_upload",
        description: "Upload local file changes to Overleaf",
        inputSchema: {
          type: "object",
          properties: {
            project_id: {
              type: "string",
              description: "Project ID",
            },
            file_path: {
              type: "string",
              description: "Relative file path within project",
            },
          },
          required: ["project_id", "file_path"],
        },
      },
      {
        name: "overleaf_compile",
        description: "Compile LaTeX project and download PDF",
        inputSchema: {
          type: "object",
          properties: {
            project_id: {
              type: "string",
              description: "Project ID",
            },
            draft: {
              type: "boolean",
              description: "Draft mode (faster compilation)",
              default: false,
            },
            stop_on_first_error: {
              type: "boolean",
              description: "Stop compilation on first error",
              default: false,
            },
          },
          required: ["project_id"],
        },
      },
      {
        name: "overleaf_create_project",
        description: "Create a new Overleaf project",
        inputSchema: {
          type: "object",
          properties: {
            project_name: {
              type: "string",
              description: "Project name",
            },
            template: {
              type: "string",
              description: "Template name (default: blank)",
              default: "blank",
            },
          },
          required: ["project_name"],
        },
      },
      {
        name: "overleaf_read_file",
        description: "Read file content from Overleaf project",
        inputSchema: {
          type: "object",
          properties: {
            project_id: {
              type: "string",
              description: "Project ID",
            },
            file_id: {
              type: "string",
              description: "File ID",
            },
          },
          required: ["project_id", "file_id"],
        },
      },
      {
        name: "overleaf_update_file",
        description: "Update file content in Overleaf project",
        inputSchema: {
          type: "object",
          properties: {
            project_id: {
              type: "string",
              description: "Project ID",
            },
            file_id: {
              type: "string",
              description: "File ID",
            },
            content: {
              type: "string",
              description: "New file content",
            },
          },
          required: ["project_id", "file_id", "content"],
        },
      },
      {
        name: "overleaf_start_sync",
        description:
          "Start realtime bidirectional sync (auto-syncs local <-> Overleaf in background)",
        inputSchema: {
          type: "object",
          properties: {
            project_id: {
              type: "string",
              description: "Project ID",
            },
          },
          required: ["project_id"],
        },
      },
      {
        name: "overleaf_stop_sync",
        description: "Stop realtime sync for a project",
        inputSchema: {
          type: "object",
          properties: {
            project_id: {
              type: "string",
              description: "Project ID",
            },
          },
          required: ["project_id"],
        },
      },
      {
        name: "overleaf_sync_status",
        description: "Check realtime sync status",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };
});

/**
 * Handle tool calls
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "overleaf_login_password": {
        const serverUrl = args.server_url || "https://www.overleaf.com";
        api = new OverleafAPI(serverUrl);

        const result = await api.loginWithPassword(args.email, args.password);

        // Save credentials
        await saveCredentials({
          serverUrl,
          type: "password",
          email: args.email,
          password: args.password,
        });

        return {
          content: [
            {
              type: "text",
              text: `Successfully logged in to ${serverUrl}`,
            },
          ],
        };
      }

      case "overleaf_login_cookie": {
        const serverUrl = args.server_url || "https://www.overleaf.com";
        api = new OverleafAPI(serverUrl);

        const result = await api.loginWithCookie(args.cookie);

        // Save credentials
        await saveCredentials({
          serverUrl,
          type: "cookie",
          cookie: args.cookie,
        });

        return {
          content: [
            {
              type: "text",
              text: `Successfully logged in to ${serverUrl} with cookie\nUser: ${result.user.email || result.user.id}`,
            },
          ],
        };
      }

      case "overleaf_list_projects": {
        if (!api) {
          // Try to restore session
          const creds = await loadCredentials();
          if (creds) {
            api = new OverleafAPI(creds.serverUrl);
            if (creds.type === "password") {
              await api.loginWithPassword(creds.email, creds.password);
            } else {
              await api.loginWithCookie(creds.cookie);
            }
          } else {
            throw new Error("Not logged in. Please login first.");
          }
        }

        const projects = await api.getProjects();
        const projectList = projects
          .map(
            (p) =>
              `- ${p.name} (ID: ${p.id}, Owner: ${p.owner?.email || "unknown"})`,
          )
          .join("\n");

        return {
          content: [
            {
              type: "text",
              text: `Found ${projects.length} projects:\n\n${projectList}`,
            },
          ],
        };
      }

      case "overleaf_get_project": {
        if (!api) throw new Error("Not logged in");

        const project = await api.getProjectDetails(args.project_id);
        const files = buildFileTree(project.rootFolder[0]);

        const fileList = files
          .map((f) => {
            const indent = "  ".repeat((f.path.match(/\//g) || []).length);
            return `${indent}- [${f.type}] ${f.name} (ID: ${f.id})`;
          })
          .join("\n");

        return {
          content: [
            {
              type: "text",
              text: `Project: ${project.name}\n\nFile Structure:\n${fileList}`,
            },
          ],
        };
      }

      case "overleaf_sync_download": {
        if (!api) throw new Error("Not logged in");

        const project = await api.getProjectDetails(args.project_id);
        const projectDir = getProjectDir(args.project_id);
        await fs.mkdir(projectDir, { recursive: true });

        const files = buildFileTree(project.rootFolder[0]);
        let downloadedCount = 0;

        for (const file of files) {
          const localPath = path.join(projectDir, file.path);

          if (file.type === "folder") {
            await fs.mkdir(localPath, { recursive: true });
          } else if (file.type === "doc") {
            const content = await api.getFileContent(args.project_id, file.id);
            await fs.mkdir(path.dirname(localPath), { recursive: true });
            await fs.writeFile(localPath, content, "utf-8");
            downloadedCount++;
          } else if (file.type === "file") {
            const buffer = await api.downloadFile(args.project_id, file.id);
            await fs.mkdir(path.dirname(localPath), { recursive: true });
            await fs.writeFile(localPath, buffer);
            downloadedCount++;
          }
        }

        return {
          content: [
            {
              type: "text",
              text: `Downloaded ${downloadedCount} files to ${projectDir}`,
            },
          ],
        };
      }

      case "overleaf_sync_upload": {
        if (!api) throw new Error("Not logged in");

        const projectDir = getProjectDir(args.project_id);
        const localPath = path.join(projectDir, args.file_path);

        // Read local file
        const content = await fs.readFile(localPath, "utf-8");

        // Find file ID
        const project = await api.getProjectDetails(args.project_id);
        const files = buildFileTree(project.rootFolder[0]);
        const file = files.find((f) => f.path === args.file_path);

        if (!file) {
          throw new Error(`File not found: ${args.file_path}`);
        }

        // Upload changes
        await api.updateFileContent(args.project_id, file.id, content);

        return {
          content: [
            {
              type: "text",
              text: `Uploaded ${args.file_path} to Overleaf`,
            },
          ],
        };
      }

      case "overleaf_compile": {
        if (!api) throw new Error("Not logged in");

        // Start compilation
        const result = await api.compileProject(args.project_id, {
          draft: args.draft || false,
          stopOnFirstError: args.stop_on_first_error || false,
        });

        if (result.status === "success") {
          // Download PDF
          const pdfBuffer = await api.downloadPdf(args.project_id);
          const projectDir = getProjectDir(args.project_id);
          const pdfPath = path.join(projectDir, "output.pdf");

          await fs.writeFile(pdfPath, pdfBuffer);

          return {
            content: [
              {
                type: "text",
                text: `Compilation successful!\nPDF saved to: ${pdfPath}\n\nLog output:\n${result.outputFiles?.find((f) => f.path === "output.log")?.url || "No log available"}`,
              },
            ],
          };
        } else {
          const errors =
            result.outputFiles
              ?.filter((f) => f.type === "error")
              .map((f) => f.message)
              .join("\n") || "Unknown error";

          return {
            content: [
              {
                type: "text",
                text: `Compilation failed:\n${errors}`,
              },
            ],
            isError: true,
          };
        }
      }

      case "overleaf_create_project": {
        if (!api) throw new Error("Not logged in");

        const result = await api.createProject(
          args.project_name,
          args.template || "blank",
        );

        return {
          content: [
            {
              type: "text",
              text: `Created project: ${args.project_name}\nProject ID: ${result.projectId}`,
            },
          ],
        };
      }

      case "overleaf_read_file": {
        if (!api) throw new Error("Not logged in");

        const content = await api.getFileContent(args.project_id, args.file_id);

        return {
          content: [
            {
              type: "text",
              text: content,
            },
          ],
        };
      }

      case "overleaf_update_file": {
        if (!api) throw new Error("Not logged in");

        await api.updateFileContent(
          args.project_id,
          args.file_id,
          args.content,
        );

        return {
          content: [
            {
              type: "text",
              text: `File updated successfully`,
            },
          ],
        };
      }

      case "overleaf_start_sync": {
        if (!api) throw new Error("Not logged in");

        const projectId = args.project_id;

        // 检查是否已经在同步
        if (activeSyncs.has(projectId)) {
          return {
            content: [
              {
                type: "text",
                text: `Sync already active for project ${projectId}`,
              },
            ],
          };
        }

        // 确保项目已下载
        const projectDir = getProjectDir(projectId);
        try {
          await fs.access(projectDir);
        } catch {
          return {
            content: [
              {
                type: "text",
                text: `Project not downloaded yet. Please run overleaf_sync_download first.`,
              },
            ],
          };
        }

        // 创建同步实例
        const sync = new OverleafRealtimeSync(
          "https://www.overleaf.com",
          api.cookies,
          projectId,
          projectDir,
        );

        try {
          // 连接并启动同步
          await sync.connect();
          await sync.startFileWatch();

          // 保存实例
          activeSyncs.set(projectId, sync);

          // 监听事件并记录日志
          sync.on("remote-change", (doc) => {
            console.error(`[Sync ${projectId}] Remote change: ${doc.name}`);
          });

          return {
            content: [
              {
                type: "text",
                text: `✅ Realtime sync started for project ${projectId}\n\nNow editing files in Zed will automatically sync to Overleaf!\nChanges from Overleaf web will also sync to local.\n\nProject directory: ${projectDir}`,
              },
            ],
          };
        } catch (err) {
          return {
            content: [
              {
                type: "text",
                text: `Failed to start sync: ${err.message}`,
              },
            ],
            isError: true,
          };
        }
      }

      case "overleaf_stop_sync": {
        const projectId = args.project_id;
        const sync = activeSyncs.get(projectId);

        if (!sync) {
          return {
            content: [
              {
                type: "text",
                text: `No active sync for project ${projectId}`,
              },
            ],
          };
        }

        await sync.disconnect();
        activeSyncs.delete(projectId);

        return {
          content: [
            {
              type: "text",
              text: `Sync stopped for project ${projectId}`,
            },
          ],
        };
      }

      case "overleaf_sync_status": {
        if (activeSyncs.size === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No active syncs`,
              },
            ],
          };
        }

        const statuses = Array.from(activeSyncs.keys())
          .map((id) => `- Project ${id}: Active`)
          .join("\n");

        return {
          content: [
            {
              type: "text",
              text: `Active syncs (${activeSyncs.size}):\n${statuses}`,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

/**
 * Start server
 */
async function main() {
  await initConfig();

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("Overleaf MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
