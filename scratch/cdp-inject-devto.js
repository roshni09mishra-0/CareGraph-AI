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

async function main() {
  console.log('1. Launching Chrome with remote debugging on port 9222...');
  
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

  console.log('2. Waiting 5 seconds for Chrome to load DEV.to editor...');
  await new Promise(r => setTimeout(r, 5000));

  let tabs = [];
  for (let i = 0; i < 10; i++) {
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

  const devtoTab = tabs.find(t => t.url.includes('dev.to') || t.title.includes('DEV') || t.title.includes('New Post')) || tabs[0];
  if (!devtoTab) {
    console.error('No tab found.');
    return;
  }

  console.log('3. Connecting to WebSocket on Dev.to tab:', devtoTab.title);
  const ws = new WebSocket(devtoTab.webSocketDebuggerUrl);

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  let msgId = 1;
  function sendCDP(method, params = {}) {
    return new Promise((resolve) => {
      const id = msgId++;
      const handler = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id === id) {
          ws.removeEventListener('message', handler);
          resolve(msg.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  // Wait an extra 2 seconds for editor elements to hydrate
  await new Promise(r => setTimeout(r, 2000));

  const injectionScript = `
    (() => {
      const title = ${JSON.stringify(titleText)};
      const tags = ${JSON.stringify(tagsText)};
      const body = ${JSON.stringify(blogMarkdown)};

      // 1. Fill Title
      const titleEl = document.querySelector('#article-form-title') || 
                      document.querySelector('textarea[placeholder*="Title"]') || 
                      document.querySelector('textarea[name="article[title]"]') ||
                      document.querySelector('.crayons-article-form__title');
      if (titleEl) {
        titleEl.value = title;
        titleEl.dispatchEvent(new Event('input', { bubbles: true }));
        titleEl.dispatchEvent(new Event('change', { bubbles: true }));
      }

      // 2. Fill Tags
      const tagEl = document.querySelector('#article_tag_names') || 
                    document.querySelector('input[placeholder*="tags"]') ||
                    document.querySelector('input[name="article[tag_names]"]');
      if (tagEl) {
        tagEl.value = tags;
        tagEl.dispatchEvent(new Event('input', { bubbles: true }));
        tagEl.dispatchEvent(new Event('change', { bubbles: true }));
      }

      // 3. Fill Markdown Body
      const bodyEl = document.querySelector('#article_body_markdown') || 
                     document.querySelector('textarea[name="article[body_markdown]"]') ||
                     document.querySelector('.crayons-article-form__markdown') ||
                     document.querySelector('textarea[placeholder*="Write your post"]');
      if (bodyEl) {
        bodyEl.value = body;
        bodyEl.dispatchEvent(new Event('input', { bubbles: true }));
        bodyEl.dispatchEvent(new Event('change', { bubbles: true }));
      }

      return {
        titleFilled: !!titleEl,
        tagsFilled: !!tagEl,
        bodyFilled: !!bodyEl,
        url: window.location.href,
        documentTitle: document.title
      };
    })()
  `;

  console.log('4. Auto-filling Title, Tags, and Full Markdown Body into DEV.to...');
  const res = await sendCDP('Runtime.evaluate', {
    expression: injectionScript,
    returnByValue: true,
    awaitPromise: true
  });

  console.log('Injection Status:', res);

  // Copy to clipboard as backup
  try {
    const { exec } = require('child_process');
    const clip = exec('C:\\Windows\\System32\\clip.exe', { shell: 'C:\\Windows\\System32\\cmd.exe' });
    clip.stdin.write(blogMarkdown);
    clip.stdin.end();
  } catch (e) {}

  ws.close();
  console.log('\n======================================================');
  console.log('🎉 DEV.TO FORM AUTO-FILLED & OPEN IN YOUR CHROME WINDOW!');
  console.log('======================================================');
}

main().catch(console.error);
