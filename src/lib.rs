use std::fs;
use std::process;
use zed_extension_api::{
    self as zed, Command, ContextServerId, Project, Result, SlashCommand, SlashCommandOutput,
};

struct OverleafExtension;

impl zed::Extension for OverleafExtension {
    fn new() -> Self {
        Self
    }

    fn context_server_command(
        &mut self,
        context_server_id: &ContextServerId,
        _project: &Project,
    ) -> Result<Command> {
        if context_server_id.as_ref() != "overleaf" {
            return Err("Unknown context server".into());
        }

        // Return command to start the Node.js MCP server
        Ok(Command {
            command: "node".to_string(),
            args: vec!["server/index.js".to_string()],
            env: Default::default(),
        })
    }

    fn run_slash_command(
        &self,
        command: SlashCommand,
        args: Vec<String>,
        _worktree: Option<&zed::Worktree>,
    ) -> Result<SlashCommandOutput> {
        let output_text = match command.name.as_str() {
            "overleaf-login" => {
                let cookie = args.first().cloned().unwrap_or_default();
                if cookie.is_empty() {
                    "❌ Please provide your Overleaf cookie.\n\nHow to get cookie:\n1. Open https://www.overleaf.com in browser\n2. Login to your account\n3. Press F12 → Network tab\n4. Find Cookie in request headers\n5. Copy and paste here".to_string()
                } else {
                    // Save cookie
                    let home = std::env::var("HOME").unwrap_or_default();
                    let config_dir = format!("{}/.overleaf-zed", home);
                    fs::create_dir_all(&config_dir).ok();

                    let creds = format!(
                        r#"{{
  "serverUrl": "https://www.overleaf.com",
  "type": "cookie",
  "cookie": "{}"
}}"#,
                        cookie
                    );

                    fs::write(format!("{}/credentials.json", config_dir), creds).ok();

                    "✅ Login successful! Cookie saved.\n\nNow you can:\n- /overleaf-projects - List your projects\n- /overleaf-download <project_id> - Download a project".to_string()
                }
            }

            "overleaf-projects" => {
                // Get extension directory
                let home = std::env::var("HOME").unwrap_or_default();
                let ext_dir = format!("{}/.config/zed/extensions/overleaf-sync", home);

                // Run Node.js script to list projects
                let output = process::Command::new("node")
                    .arg("scripts/list-projects.js")
                    .current_dir(&ext_dir)
                    .output();

                match output {
                    Ok(out) if out.status.success() => {
                        String::from_utf8_lossy(&out.stdout).to_string()
                    }
                    Ok(out) => {
                        let stderr = String::from_utf8_lossy(&out.stderr);
                        format!("❌ Failed to list projects.\n\nError: {}", stderr)
                    }
                    Err(e) => format!("❌ Failed to execute command: {}", e),
                }
            }

            "overleaf-download" => {
                let project_id = args.first().cloned().unwrap_or_default();
                if project_id.is_empty() {
                    "❌ Please provide project ID.\n\nUsage: /overleaf-download <project_id>\n\nGet project ID from /overleaf-projects".to_string()
                } else {
                    let home = std::env::var("HOME").unwrap_or_default();
                    let ext_dir = format!("{}/.config/zed/extensions/overleaf-sync", home);

                    let output = process::Command::new("node")
                        .arg("download-projects.js")
                        .arg(&project_id)
                        .current_dir(&ext_dir)
                        .output();

                    match output {
                        Ok(out) if out.status.success() => {
                            format!("✅ Project downloaded!\n\nLocation: ~/.overleaf-zed/projects/{}\n\nOpen with: Cmd+O → Select folder", project_id)
                        }
                        Ok(out) => {
                            let stderr = String::from_utf8_lossy(&out.stderr);
                            format!("❌ Failed to download project.\n\nError: {}", stderr)
                        }
                        Err(e) => format!("❌ Failed to execute command: {}", e),
                    }
                }
            }

            "overleaf-compile" => {
                let project_id = args.first().cloned().unwrap_or_default();
                if project_id.is_empty() {
                    "❌ Please provide project ID.\n\nUsage: /overleaf-compile <project_id>"
                        .to_string()
                } else {
                    let home = std::env::var("HOME").unwrap_or_default();
                    let ext_dir = format!("{}/.config/zed/extensions/overleaf-sync", home);

                    let output = process::Command::new("bash")
                        .arg("compile.sh")
                        .arg(&project_id)
                        .current_dir(&ext_dir)
                        .output();

                    match output {
                        Ok(out) if out.status.success() => {
                            format!("✅ Compilation complete!\n\nPDF: ~/.overleaf-zed/projects/{}/output.pdf", project_id)
                        }
                        Ok(out) => {
                            let stderr = String::from_utf8_lossy(&out.stderr);
                            format!("❌ Compilation failed.\n\nError: {}", stderr)
                        }
                        Err(e) => format!("❌ Failed to execute command: {}", e),
                    }
                }
            }

            _ => format!("Unknown command: {}", command.name),
        };

        Ok(SlashCommandOutput {
            text: output_text,
            sections: vec![],
        })
    }
}

zed::register_extension!(OverleafExtension);
