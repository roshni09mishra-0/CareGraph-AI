const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

const blogPath = path.join(__dirname, '..', 'BLOG_POST_DAY10.md');
const content = fs.readFileSync(blogPath, 'utf8');

const cmdExe = 'C:\\Windows\\System32\\cmd.exe';

// Copy content to Windows Clipboard using clip.exe
const clipProcess = exec('C:\\Windows\\System32\\clip.exe', { shell: cmdExe }, (err) => {
  if (err) {
    console.error('Failed to copy to clipboard:', err);
  } else {
    console.log('✓ SUCCESS: Full Blog Post Markdown copied to Windows Clipboard!');
  }
});

clipProcess.stdin.write(content);
clipProcess.stdin.end();

// Launch Chrome directly to https://dev.to/new
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
exec(`"${chromePath}" "https://dev.to/new"`, { shell: cmdExe }, (err) => {
  if (err) {
    console.warn('Chrome launch fallback:', err);
  } else {
    console.log('✓ Chrome launched successfully to https://dev.to/new');
  }
});
