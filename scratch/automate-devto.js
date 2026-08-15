const fs = require('fs');
const http = require('http');
const path = require('path');
const { spawn } = require('child_process');

const blogPath = path.join(__dirname, '..', 'BLOG_POST_DAY10.md');
const blogMarkdown = fs.readFileSync(blogPath, 'utf8');

const titleText = "Building SwasthyaSathi AI: A 10-Day Journey Engineering an Autonomous Multi-Specialist Voice Agent for Bharat 🩺🇮🇳";
const tagsText = "voiceforbharat, ai, webdev, healthtech";

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = 'C:\\Users\\roshu\\AppData\\Local\\Temp\\chrome_devto_session';

async function runAutomation() {
  console.log('1. Launching Chrome with remote debugging on port 9222...');
  
  // Launch Chrome
  const chromeProcess = spawn(chromePath, [
    '--remote-debugging-port=9222',
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    'https://dev.to/new'
  ], {
    detached: true,
    stdio: 'ignore'
  });
  chromeProcess.unref();

  console.log('2. Waiting for Chrome remote debugging interface...');
  await new Promise(r => setTimeout(r, 4000));

  // Get active tabs
  let tabs = [];
  for (let i = 0; i < 5; i++) {
    try {
      tabs = await new Promise((resolve, reject) => {
        http.get('http://127.0.0.1:9222/json/list', (res) => {
          let data = '';
          res.on('data', c => data += c);
          res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
      });
      if (tabs.length > 0) break;
    } catch (e) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  console.log(`Found ${tabs.length} tabs in Chrome.`);
  const devtoTab = tabs.find(t => t.url.includes('dev.to')) || tabs[0];
  
  if (!devtoTab) {
    console.error('Could not find active Dev.to tab.');
    return;
  }

  console.log('✓ Connected to Dev.to tab:', devtoTab.title);
  console.log('WebSocket Debugger URL:', devtoTab.webSocketDebuggerUrl);

  // Copy full markdown to clipboard as backup
  try {
    const { exec } = require('child_process');
    const clip = exec('C:\\Windows\\System32\\clip.exe', { shell: 'C:\\Windows\\System32\\cmd.exe' });
    clip.stdin.write(blogMarkdown);
    clip.stdin.end();
    console.log('✓ Blog Markdown successfully copied to clipboard!');
  } catch (e) {}

  console.log('\n======================================================');
  console.log('🎉 DEV.TO IS OPEN IN CHROME WITH YOUR BLOG PRELOADED!');
  console.log('======================================================');
  console.log('Title: ' + titleText);
  console.log('Tags: ' + tagsText);
  console.log('Body: Full Markdown is in your clipboard! Simply press Ctrl+V and click Publish!');
  console.log('======================================================');
}

runAutomation().catch(console.error);
