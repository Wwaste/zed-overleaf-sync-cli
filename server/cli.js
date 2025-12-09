#!/usr/bin/env node

/**
 * Overleaf CLI - Intelligent project management tool
 * Supports Git + MCP hybrid workflow with bidirectional sync
 */

import { OverleafAPI } from "./overleaf-api.js";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { spawn, execSync } from "child_process";
import readline from "readline";

const CONFIG_DIR = path.join(os.homedir(), ".overleaf-zed");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

// Get projects directory from config or environment variable
function getProjectsDir(config = null) {
  // Priority: 1. Config file, 2. Environment variable, 3. Default
  if (config && config.projectsDir) {
    return path.resolve(config.projectsDir);
  }
  if (process.env.OVERLEAF_PROJECTS_DIR) {
    return path.resolve(process.env.OVERLEAF_PROJECTS_DIR);
  }
  return path.join(CONFIG_DIR, "projects");
}

// Colors for terminal output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  console.error(`${colors.red}✗ ${message}${colors.reset}`);
}

function success(message) {
  console.log(`${colors.green}✓ ${message}${colors.reset}`);
}

function info(message) {
  console.log(`${colors.blue}ℹ ${message}${colors.reset}`);
}

// Initialize configuration
async function initConfig() {
  await fs.mkdir(CONFIG_DIR, { recursive: true });
  const config = await loadConfig();
  const projectsDir = getProjectsDir(config);
  await fs.mkdir(projectsDir, { recursive: true });
}

// Load configuration
async function loadConfig() {
  try {
    const data = await fs.readFile(CONFIG_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    return null;
  }
}

// Save configuration
async function saveConfig(config) {
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
}

// Create readline interface
function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

// Ask user a question
function question(rl, prompt) {
  return new Promise((resolve) => {
    rl.question(`${colors.cyan}${prompt}${colors.reset} `, resolve);
  });
}

// Check if git is installed
function checkGit() {
  try {
    execSync("git --version", { stdio: "ignore" });
    return true;
  } catch (err) {
    return false;
  }
}

// Config command - manage settings
async function configCommand(key, value) {
  if (!key) {
    // Show current config
    const config = await loadConfig();
    if (!config) {
      log("\n⚙️  No configuration found", "yellow");
      info("Run 'overleaf-cli login' to get started");
      return;
    }
    
    log("\n⚙️  Current Configuration", "blue");
    log("════════════════════════════════════════\n");
    
    log(`Email: ${config.email || "Not set"}`, "cyan");
    log(`Git Token: ${config.gitToken ? "***" + config.gitToken.slice(-4) : "Not set"}`, "cyan");
    log(`Projects Directory: ${getProjectsDir(config)}`, "cyan");
    log(`Server URL: ${config.serverUrl || "https://www.overleaf.com"}`, "cyan");
    
    log("\n💡 To change settings:", "yellow");
    log("  overleaf-cli config projectsDir /path/to/projects");
    log("  overleaf-cli config serverUrl https://your-overleaf.com\n");
    return;
  }
  
  const config = await loadConfig() || {};
  
  if (key === "projectsDir") {
    const newDir = path.resolve(value);
    config.projectsDir = newDir;
    await saveConfig(config);
    await fs.mkdir(newDir, { recursive: true });
    success(`Projects directory set to: ${newDir}`);
    info("Existing projects won't be moved automatically");
  } else if (key === "serverUrl") {
    config.serverUrl = value;
    await saveConfig(config);
    success(`Server URL set to: ${value}`);
  } else {
    error(`Unknown config key: ${key}`);
    log("Valid keys: projectsDir, serverUrl");
  }
}

// Login command
async function loginCommand() {
  const rl = createInterface();

  try {
    log("\n🔐 Overleaf Login", "blue");
    log("════════════════════════════════════════\n");

    info("How to get your cookie:");
    log("1. Login to https://www.overleaf.com in your browser");
    log("2. Press F12 to open Developer Tools");
    log("3. Go to Console tab");
    log('4. Run: document.cookie.split(";").find(c => c.includes("overleaf_session2"))');
    log("5. Copy the output (format: overleaf_session2=s%3A...)\n");

    const cookie = await question(rl, "Enter your Overleaf cookie: ");

    if (!cookie.includes("overleaf_session2")) {
      error("Invalid cookie format. Must contain overleaf_session2");
      return;
    }

    log("\n⏳ Verifying credentials...", "yellow");
    const api = new OverleafAPI();
    const result = await api.loginWithCookie(cookie);

    const config = await loadConfig() || {};
    config.cookie = cookie;
    config.email = result.user.email || result.user.id;
    config.serverUrl = config.serverUrl || "https://www.overleaf.com";

    log("\n🔑 Git Integration (Optional - Premium users only)", "cyan");
    log("════════════════════════════════════════\n");
    
    const gitToken = await question(rl, "Enter Git token (or press Enter to skip): ");

    if (gitToken && gitToken.trim()) {
      config.gitToken = gitToken.trim();
      success("Git token saved!");
    }

    await saveConfig(config);
    success(`\n✅ Logged in as ${config.email}`);
  } catch (err) {
    error(`\n❌ Login failed: ${err.message}`);
  } finally {
    rl.close();
  }
}

// List projects
async function listCommand() {
  try {
    const config = await loadConfig();
    if (!config) {
      error("Not logged in. Run: overleaf-cli login");
      return;
    }

    const api = new OverleafAPI(config.serverUrl);
    await api.loginWithCookie(config.cookie);

    log("\n📚 Your Overleaf Projects", "blue");
    log("════════════════════════════════════════\n");

    const projects = await api.getProjects();

    projects.forEach((project, index) => {
      log(`${index + 1}. ${project.name}`, "green");
      log(`   ID: ${project.id}\n`);
    });
  } catch (err) {
    error(`Failed to list projects: ${err.message}`);
  }
}

// Setup/clone project
async function setupCommand(projectIdOrName) {
  try {
    const config = await loadConfig();
    if (!config) {
      error("Not logged in. Run: overleaf-cli login");
      return;
    }

    const api = new OverleafAPI(config.serverUrl);
    await api.loginWithCookie(config.cookie);

    let projectId = projectIdOrName;
    let projectName = "";

    if (!projectId) {
      const projects = await api.getProjects();
      log("\n📚 Select a project:", "blue");
      projects.forEach((p, i) => log(`${i + 1}. ${p.name}`, "green"));

      const rl = createInterface();
      const choice = await question(rl, "\nEnter project number or ID:");
      rl.close();

      const index = parseInt(choice) - 1;
      if (index >= 0 && index < projects.length) {
        projectId = projects[index].id;
        projectName = projects[index].name;
      } else {
        projectId = choice;
      }
    }

    const project = await api.getProjectDetails(projectId);
    projectName = projectName || project.name;

    const PROJECTS_DIR = getProjectsDir(config);
    // Use project name as folder name, sanitize special characters
    const sanitizedName = projectName.replace(/[\/\\:*?"<>|]/g, '_').trim();
    const projectDir = path.join(PROJECTS_DIR, sanitizedName);
    log(`\n🚀 Setting up: ${projectName}`, "blue");
    log("════════════════════════════════════════\n");

    // Try Git clone first
    const hasGit = checkGit();
    let gitSuccess = false;

    if (hasGit && config.gitToken) {
      const gitUrl = `https://git:${config.gitToken}@git.overleaf.com/${projectId}`;
      log(`📥 Cloning via Git...`, "blue");

      gitSuccess = await new Promise((resolve) => {
        const gitClone = spawn("git", ["clone", gitUrl, projectDir], {
          stdio: "inherit",
        });
        gitClone.on("close", (code) => {
          if (code === 0) {
            execSync(`git -C "${projectDir}" remote rename origin overleaf`, { stdio: "ignore" });
            success("✅ Project cloned successfully via Git");
            resolve(true);
          } else {
            resolve(false);
          }
        });
      });
    }

    // Save metadata
    const metadata = {
      projectId,
      projectName,
      localPath: projectDir,
      setupDate: new Date().toISOString(),
      useGit: gitSuccess,
    };

    await fs.writeFile(
      path.join(projectDir, ".overleaf-meta.json"),
      JSON.stringify(metadata, null, 2)
    );

    success(`\n✅ Project setup complete!`);
    log(`📁 Location: ${projectDir}\n`, "cyan");
  } catch (err) {
    error(`Setup failed: ${err.message}`);
  }
}

// Watch command
async function watchCommand(projectPath) {
  const currentDir = projectPath || process.cwd();

  try {
    const metadataPath = path.join(currentDir, ".overleaf-meta.json");
    const metadata = JSON.parse(await fs.readFile(metadataPath, "utf-8"));

    log(`\n👁️  Watching: ${metadata.projectName}`, "blue");
    log("════════════════════════════════════════\n");
    info("File changes will be automatically synced to Overleaf");
    info("Press Ctrl+C to stop\n");

    const { FileWatcher } = await import("./file-watcher.js");
    const watcher = new FileWatcher(currentDir, metadata.projectId);
    await watcher.start();
  } catch (err) {
    error(`Failed to start watcher: ${err.message}`);
  }
}

// Compile command
async function compileCommand(projectPath) {
  const currentDir = projectPath || process.cwd();

  try {
    const metadataPath = path.join(currentDir, ".overleaf-meta.json");
    const metadata = JSON.parse(await fs.readFile(metadataPath, "utf-8"));

    const config = await loadConfig();
    const api = new OverleafAPI(config.serverUrl);
    await api.loginWithCookie(config.cookie);

    log(`\n🔨 Compiling: ${metadata.projectName}`, "blue");
    log("════════════════════════════════════════\n");

    const result = await api.compileProject(metadata.projectId);

    if (result.status === "success") {
      success("Compilation successful!");
      const pdfBuffer = await api.downloadPdf(metadata.projectId);
      const pdfPath = path.join(currentDir, "output.pdf");
      await fs.writeFile(pdfPath, pdfBuffer);
      success(`PDF saved: ${pdfPath}`);
    } else {
      error("Compilation failed");
    }
  } catch (err) {
    error(`Compilation failed: ${err.message}`);
  }
}

// Pull command - bidirectional sync
async function pullCommand(projectPath) {
  const currentDir = projectPath || process.cwd();

  try {
    const metadataPath = path.join(currentDir, ".overleaf-meta.json");
    const metadata = JSON.parse(await fs.readFile(metadataPath, "utf-8"));

    log(`\n📥 Pulling from Overleaf...`, "blue");

    // If Git is available, use git pull
    if (metadata.useGit) {
      execSync("git pull overleaf master --no-edit", { 
        cwd: currentDir, 
        stdio: "inherit" 
      });
      success("✓ Pulled via Git");
    } else {
      info("Git not available, manual pull not yet implemented");
    }
  } catch (err) {
    error(`Pull failed: ${err.message}`);
  }
}

// Auto-sync command - start bidirectional sync
async function autoSyncCommand(projectPath) {
  const currentDir = projectPath || process.cwd();

  try {
    const metadataPath = path.join(currentDir, ".overleaf-meta.json");
    const metadata = JSON.parse(await fs.readFile(metadataPath, "utf-8"));

    log(`\n🔄 Starting bidirectional auto-sync`, "blue");
    log("════════════════════════════════════════\n");
    info("Local → Overleaf: Auto-sync enabled");
    info("Overleaf → Local: Checking every 30 seconds");
    info("Press Ctrl+C to stop\n");

    // Start watch for local changes
    const { FileWatcher } = await import("./file-watcher.js");
    const watcher = new FileWatcher(currentDir, metadata.projectId);
    watcher.start();

    // Start pull loop for remote changes
    if (metadata.useGit) {
      setInterval(async () => {
        try {
          execSync("git fetch overleaf master", { cwd: currentDir, stdio: "ignore" });
          const local = execSync("git rev-parse master", { cwd: currentDir }).toString().trim();
          const remote = execSync("git rev-parse overleaf/master", { cwd: currentDir }).toString().trim();
          
          if (local !== remote) {
            log(`[${new Date().toLocaleTimeString()}] 📥 Remote changes detected, pulling...`, "cyan");
            execSync("git pull overleaf master --no-edit", { cwd: currentDir, stdio: "ignore" });
            success("✓ Synced remote changes");
          }
        } catch (err) {
          // Ignore errors silently
        }
      }, 30000); // Check every 30 seconds
    }
  } catch (err) {
    error(`Auto-sync failed: ${err.message}`);
  }
}

// Main CLI
async function main() {
  await initConfig();

  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === "help") {
    log("\n🌟 Overleaf CLI - Bidirectional Sync Tool", "cyan");
    log("════════════════════════════════════════\n");
    log("Commands:", "blue");
    log("  login                     Login to Overleaf");
    log("  config [key] [value]      View or update settings");
    log("  list                      List all projects");
    log("  setup [project-id]        Clone/download a project");
    log("  watch [path]              Watch and sync local changes");
    log("  pull [path]               Pull remote changes");
    log("  auto-sync [path]          Bidirectional auto-sync");
    log("  compile [path]            Compile LaTeX project");
    log("  help                      Show this help\n");
    log("Examples:", "blue");
    log("  overleaf-cli config projectsDir ~/Documents/overleaf");
    log("  overleaf-cli setup");
    log("  overleaf-cli auto-sync\n");
    return;
  }

  switch (command) {
    case "login":
      await loginCommand();
      break;
    case "config":
      await configCommand(args[1], args[2]);
      break;
    case "list":
      await listCommand();
      break;
    case "setup":
      await setupCommand(args[1]);
      break;
    case "watch":
      await watchCommand(args[1]);
      break;
    case "pull":
      await pullCommand(args[1]);
      break;
    case "auto-sync":
      await autoSyncCommand(args[1]);
      break;
    case "compile":
      await compileCommand(args[1]);
      break;
    default:
      error(`Unknown command: ${command}`);
      log('Run "overleaf-cli help" for usage');
  }
}

main().catch((err) => {
  error(`Fatal error: ${err.message}`);
  process.exit(1);
});
