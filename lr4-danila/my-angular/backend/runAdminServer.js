import { exec } from 'child_process';
import { promisify } from 'util';
import { server } from 'ivanovdanila-lab3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execAsync = promisify(exec);

async function installBuildAdminServe() {
  try {
    const modulePath = path.join(__dirname, 'node_modules/ivanovdanila-lab3');
    
    console.log('Installing module dependencies...');
    await execAsync(`cd "${modulePath}" && npm install`);
    console.log('Dependencies installed');
    
    console.log('Building with Webpack...');
    await execAsync(`cd "${modulePath}" && npm run webpack`);
    console.log('Webpack build completed');
    
    console.log('Starting HTTPS server...');
    setTimeout(() => {
        console.log('Opening browser...');
        exec('xdg-open https://localhost:8443');
      }, 2000);
    
  } catch (error) {
    console.error('Process failed:', error);
  }
}

export { installBuildAdminServe };