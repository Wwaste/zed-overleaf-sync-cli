/**
 * Overleaf API Client
 * Based on the implementation from Overleaf-Workshop
 * Provides cookie-based authentication and API access
 */

import axios from "axios";
import FormData from "form-data";
import path from "path";

export class OverleafAPI {
  constructor(serverUrl = "https://www.overleaf.com") {
    this.serverUrl = serverUrl;
    this.csrfToken = null;
    this.cookies = {};

    // Create axios instance with default config
    this.client = axios.create({
      baseURL: serverUrl,
      timeout: 30000,
      maxRedirects: 5,
      validateStatus: (status) => status < 500, // Accept all status codes < 500
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    // Add request interceptor to include cookies and CSRF token
    this.client.interceptors.request.use((config) => {
      config.headers = config.headers || {};

      // Add cookies to headers
      if (Object.keys(this.cookies).length > 0) {
        const cookieHeader = Object.entries(this.cookies)
          .map(([key, value]) => `${key}=${value}`)
          .join("; ");
        config.headers["Cookie"] = cookieHeader;
      }

      // Add CSRF token for POST/PUT/DELETE requests
      if (["post", "put", "delete"].includes(config.method.toLowerCase())) {
        if (this.csrfToken) {
          config.headers["X-CSRF-Token"] = this.csrfToken;
          if (config.data instanceof FormData) {
            config.data.append("_csrf", this.csrfToken);
          } else {
            config.data = config.data || {};
            config.data._csrf = this.csrfToken;
          }
        }
      }

      return config;
    });

    // Add response interceptor to extract cookies
    this.client.interceptors.response.use((response) => {
      const setCookies = response.headers["set-cookie"];
      if (setCookies) {
        setCookies.forEach((cookieStr) => {
          const [cookiePart] = cookieStr.split(";");
          const [key, value] = cookiePart.split("=");
          if (key && value) {
            this.cookies[key.trim()] = value.trim();
          }
        });
      }
      return response;
    });
  }

  /**
   * Extract CSRF token from login page
   */
  async getCsrfToken() {
    const response = await this.client.get("/login");
    const html = response.data;

    // Extract CSRF token from HTML
    const csrfMatch = html.match(/name="_csrf"\s+value="([^"]+)"/);
    if (csrfMatch) {
      this.csrfToken = csrfMatch[1];
      return this.csrfToken;
    }

    throw new Error("Failed to extract CSRF token from login page");
  }

  /**
   * Extract CSRF token from a response (Set-Cookie or HTML)
   */
  extractCsrfFromResponse(response) {
    const setCookies = response.headers["set-cookie"];
    if (setCookies) {
      const list = Array.isArray(setCookies) ? setCookies : [setCookies];
      for (const cookie of list) {
        const m = cookie.match(/ol-csrfToken=([^;]+)/i);
        if (m) {
          console.log("✓ Found CSRF in cookie");
          return m[1];
        }
      }
    }

    if (typeof response.data === "string") {
      const html = response.data;
      const patterns = [
        /<meta[^>]+name=["'](?:ol-csrfToken|csrf-token)["'][^>]+content=["']([^"']+)["']/i,
        /name="_csrf"\s+value="([^"]+)"/i,
        /data-csrf(?:token)?=["']([^"']+)["']/i,
        /csrfToken["']?\s*[:=]\s*["']([^"']+)/i,
      ];

      for (const re of patterns) {
        const m = html.match(re);
        if (m) {
          console.log("✓ Found CSRF in HTML with pattern:", re.source.substring(0, 50));
          return m[1];
        }
      }
    }

    console.error("❌ Failed to find CSRF token in response");
    throw new Error("Failed to extract CSRF token from response");
  }

  /**
   * Login with email and password
   */
  async loginWithPassword(email, password) {
    await this.getCsrfToken();

    const response = await this.client.post("/login", {
      email,
      password,
      _csrf: this.csrfToken,
    });

    if (response.status === 200 && response.data.redir) {
      return { success: true, redirect: response.data.redir };
    }

    throw new Error(
      "Login failed: " + (response.data.message || "Unknown error"),
    );
  }

  /**
   * Login with cookie string (for SSO/captcha-enabled servers)
   * Cookie format: "overleaf_session2=...; sharelatex.sid=..."
   */
  async loginWithCookie(cookieString) {
    // Parse cookie string
    const cookiePairs = cookieString.split(";").map((s) => s.trim());
    cookiePairs.forEach((pair) => {
      const [key, value] = pair.split("=");
      if (key && value) {
        this.cookies[key.trim()] = value.trim();
      }
    });

    // Fetch homepage with provided cookies to extract CSRF token
    const response = await this.client.get("/");
    this.csrfToken = this.extractCsrfFromResponse(response);

    // Verify login by fetching user info
    const userInfo = await this.getUserInfo();
    if (userInfo && userInfo.id) {
      return { success: true, user: userInfo };
    }

    throw new Error("Cookie authentication failed");
  }

  /**
   * Get current user information
   */
  async getUserInfo() {
    const response = await this.client.get("/user/personal_info");
    if (response.status === 200) {
      return response.data;
    }
    return null;
  }

  /**
   * Get all user projects
   */
  async getProjects() {
    const response = await this.client.get("/user/projects");
    if (response.status === 200) {
      const projects = response.data.projects || [];
      // Overleaf 返回的项目使用 _id 而不是 id
      return projects.map((p) => ({
        ...p,
        id: p.id || p._id,
      }));
    }
    throw new Error("Failed to fetch projects");
  }

  /**
   * Get project details including file structure
   */
  async getProjectDetails(projectId) {
    // First get project metadata to get the name
    let projectName = projectId;
    try {
      const projects = await this.getProjects();
      const project = projects.find(p => p.id === projectId);
      if (project) projectName = project.name;
    } catch (err) {
      // If we cannot get the name, use the ID
    }

    const response = await this.client.get(`/project/${projectId}/entities`);
    if (response.status === 200) {
      const data = response.data;
      const docDebug = (data.entities || [])
        .filter((entity) => entity.type === "doc")
        .slice(0, 3);
      console.log(
        `[OverleafAPI] Full entity objects (first 3):`,
        JSON.stringify(docDebug, null, 2)
      );

      // 将扁平的文件列表转换为树形结构
      const rootFolder = {
        name: "",
        docs: [],
        fileRefs: [],
        folders: [],
      };

      // 按路径分组文件
      const folderMap = new Map();
      folderMap.set("", rootFolder);

      // 先创建所有文件夹
      data.entities.forEach((entity) => {
        const parts = entity.path.split("/").filter((p) => p);
        let currentPath = "";

        for (let i = 0; i < parts.length - 1; i++) {
          const folderName = parts[i];
          const parentPath = currentPath;
          currentPath = currentPath
            ? `${currentPath}/${folderName}`
            : folderName;

          if (!folderMap.has(currentPath)) {
            const folder = {
              name: folderName,
              docs: [],
              fileRefs: [],
              folders: [],
            };
            folderMap.set(currentPath, folder);

            const parent = folderMap.get(parentPath);
            parent.folders.push(folder);
          }
        }
      });

      // 添加文件到对应文件夹
      data.entities.forEach((entity) => {
        const parts = entity.path.split("/").filter((p) => p);
        const fileName = parts[parts.length - 1];
        const folderPath = parts.slice(0, -1).join("/");
        const folder = folderMap.get(folderPath);

        if (entity.type === "doc") {
          const docId =
            entity.id || entity.docId || entity.doc_id || entity._id || entity.path;
          folder.docs.push({
            _id: docId,
            id: docId,
            name: fileName,
            path: entity.path,
          });
        } else if (entity.type === "file") {
          const fileId = entity.id || entity.file_id || entity._id || entity.path;
          folder.fileRefs.push({
            _id: fileId,
            id: fileId,
            name: fileName,
            path: entity.path,
          });
        }
      });

      return {
        project_id: data.project_id,
        name: projectName,
        rootFolder: [rootFolder],
        entities: data.entities,
      };
    }
    throw new Error(`Failed to fetch project ${projectId}`);
  }

  /**
   * Create new project
   */
  async createProject(projectName, template = "blank") {
    const response = await this.client.post("/project/new", {
      projectName,
      template,
    });

    if (response.status === 200 && response.data.project_id) {
      return { projectId: response.data.project_id };
    }
    throw new Error("Failed to create project");
  }

  /**
   * Get file content (for text files like .tex)
   */
  async getFileContent(projectId, fileId) {
    const response = await this.client.get(
      `/project/${projectId}/doc/${fileId}`,
    );
    if (response.status === 200) {
      return response.data.lines.join("\n");
    }
    throw new Error(`Failed to fetch file ${fileId}`);
  }

  /**
   * Update file content
   */
  async updateFileContent(projectId, fileIdOrPath, content, folderId = null) {
    console.log(`🔍 updateFileContent called with path: "${fileIdOrPath}", folderId: "${folderId}"`);
    // If we still get a real doc id, keep the old fast path
    const looksLikeId = /^[0-9a-f]{24}$/i.test(fileIdOrPath);
    if (looksLikeId) {
      const lines = content.split("\n");
      const response = await this.client.post(
        `/project/${projectId}/doc/${fileIdOrPath}`,
        { lines },
      );
      if (response.status === 200) return { success: true };
      throw new Error(`Failed to update file: status ${response.status}, data: ${JSON.stringify(response.data)}`);
    }

    // Overleaf path-based upload (replaces existing file at that path)
    const normalizedPath = fileIdOrPath.replace(/^\/+/, "");
    const fileName = path.basename(normalizedPath) || "file";
    const formData = new FormData();
    const uploadUrl = folderId
      ? `/project/${projectId}/upload?folder_id=${folderId}`
      : `/project/${projectId}/upload`;

    // When folderId is provided, Overleaf expects just the filename and folder query param.
    const relativePath = folderId ? fileName : normalizedPath;
    formData.append("relativePath", relativePath);
    formData.append("qqfile", Buffer.from(content, "utf-8"), fileName);

    const response = await this.client.post(
      uploadUrl,
      formData,
      { headers: formData.getHeaders() },
    );

    if (response.status === 200 && response.data?.success) {
      return { success: true, entityId: response.data.entity_id };
    }
    throw new Error(`Failed to update file ${fileIdOrPath}: status ${response.status}, data: ${JSON.stringify(response.data)}`);
  }

  /**
   * Upload file (for binary files like images)
   */
  async uploadFile(projectId, folderId, file, fileName) {
    const formData = new FormData();
    formData.append("qqfile", file, fileName);
    formData.append("relativePath", "null");

    const response = await this.client.post(
      `/project/${projectId}/upload?folder_id=${folderId}`,
      formData,
      {
        headers: formData.getHeaders(),
      },
    );

    if (response.status === 200 && response.data.success) {
      return response.data.entity_id;
    }
    throw new Error("Failed to upload file");
  }

  /**
   * Download file
   */
  async downloadFile(projectId, fileId) {
    const response = await this.client.get(
      `/project/${projectId}/file/${fileId}`,
      {
        responseType: "arraybuffer",
      },
    );

    if (response.status === 200) {
      return response.data;
    }
    throw new Error(`Failed to download file ${fileId}`);
  }

  /**
   * Download entire project as ZIP
   */
  async downloadProjectZip(projectId) {
    const response = await this.client.get(
      `/project/${projectId}/download/zip`,
      {
        responseType: "arraybuffer",
      },
    );

    if (response.status === 200) {
      return response.data;
    }
    throw new Error(`Failed to download project ${projectId} as ZIP`);
  }

  /**
   * Compile project
   */
  async compileProject(projectId, options = {}) {
    const {
      check = "silent", // 'silent', 'error', 'warning', 'validate'
      draft = false,
      incrementalCompilesEnabled = true,
      stopOnFirstError = false,
    } = options;

    const response = await this.client.post(`/project/${projectId}/compile`, {
      check,
      draft,
      incrementalCompilesEnabled,
      stopOnFirstError,
    });

    if (response.status === 200) {
      return response.data;
    }
    throw new Error("Compilation failed");
  }

  /**
   * Stop compilation
   */
  async stopCompile(projectId) {
    const response = await this.client.post(
      `/project/${projectId}/compile/stop`,
    );
    return response.status === 200;
  }

  /**
   * Download compiled PDF
   */
  async downloadPdf(projectId) {
    const response = await this.client.get(
      `/project/${projectId}/output/output.pdf`,
      {
        responseType: "arraybuffer",
      },
    );

    if (response.status === 200) {
      return response.data;
    }
    throw new Error("Failed to download PDF");
  }

  /**
   * Get PDF sync data (for forward sync: source -> PDF)
   */
  async syncPdf(projectId, filePath, line, column = 0) {
    const response = await this.client.get(`/project/${projectId}/sync/pdf`, {
      params: {
        file: filePath,
        line,
        column,
      },
    });

    if (response.status === 200) {
      return response.data.pdf;
    }
    return null;
  }

  /**
   * Get code sync data (for reverse sync: PDF -> source)
   */
  async syncCode(projectId, page, h, v) {
    const response = await this.client.get(`/project/${projectId}/sync/code`, {
      params: { page, h, v },
    });

    if (response.status === 200) {
      return response.data.code;
    }
    return null;
  }

  /**
   * Delete file or folder
   */
  async deleteEntity(projectId, entityType, entityId) {
    const response = await this.client.delete(
      `/project/${projectId}/${entityType}/${entityId}`,
    );
    return response.status === 200;
  }

  /**
   * Rename project
   */
  async renameProject(projectId, newName) {
    const response = await this.client.post(`/project/${projectId}/rename`, {
      newProjectName: newName,
    });
    return response.status === 200;
  }

  /**
   * Create folder
   */
  async createFolder(projectId, parentFolderId, folderName) {
    try {
      const response = await this.client.post(`/project/${projectId}/folder`, {
        parent_folder_id: parentFolderId,
        name: folderName,
      });

      if (response.status === 200) {
        return response.data._id;
      }
      throw new Error(`Failed to create folder: status ${response.status}`);
    } catch (err) {
      throw new Error(`Failed to create folder "${folderName}": ${err.response?.data?.message || err.message}`);
    }
  }

  /**
   * Create document
   */
  async createDocument(projectId, parentFolderId, docName) {
    const response = await this.client.post(`/project/${projectId}/doc`, {
      parent_folder_id: parentFolderId,
      name: docName,
    });

    if (response.status === 200) {
      return response.data._id;
    }
    throw new Error("Failed to create document");
  }

  /**
   * Get Git integration URL for project (Premium feature)
   */
  async getGitUrl(projectId) {
    // Git URL format for Overleaf Premium: https://git.overleaf.com/<project-id>
    return `https://git.overleaf.com/${projectId}`;
  }

  /**
   * Get Git credentials for authentication
   */
  async getGitCredentials() {
    const userInfo = await this.getUserInfo();
    if (userInfo && userInfo.email) {
      return {
        username: userInfo.email,
        // For git operations, Overleaf uses the session cookie for auth
        // The actual password is handled by git credential helper
        useCredentialHelper: true,
      };
    }
    throw new Error("Failed to get user credentials");
  }
}
