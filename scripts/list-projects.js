import { OverleafAPI } from '../server/overleaf-api.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const homeDir = os.homedir();
const configDir = path.join(homeDir, '.overleaf-zed');

async function main() {
  try {
    const credPath = path.join(configDir, 'credentials.json');
    const credData = await fs.readFile(credPath, 'utf-8');
    const creds = JSON.parse(credData);

    const api = new OverleafAPI(creds.serverUrl);

    if (creds.type === 'cookie') {
      await api.loginWithCookie(creds.cookie);
    } else {
      await api.loginWithPassword(creds.email, creds.password);
    }

    const projects = await api.getProjects();

    console.log(`📋 Found ${projects.length} projects:\n`);
    projects.forEach((p, i) => {
      console.log(`${i + 1}. ${p.name}`);
      console.log(`   ID: ${p._id}\n`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
