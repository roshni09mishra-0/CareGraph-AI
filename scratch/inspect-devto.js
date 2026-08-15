const http = require('http');

async function inspect() {
  const tabs = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json/list', (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  const devtoTab = tabs.find(t => t.url.includes('dev.to')) || tabs[0];
  console.log('Current URL:', devtoTab.url);
  console.log('Current Title:', devtoTab.title);

  const ws = new WebSocket(devtoTab.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let msgId = 1;
  function sendCDP(method, params = {}) {
    return new Promise((resolve) => {
      const id = msgId++;
      ws.addEventListener('message', function h(e) {
        const msg = JSON.parse(e.data);
        if (msg.id === id) {
          ws.removeEventListener('message', h);
          resolve(msg.result);
        }
      });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  const res = await sendCDP('Runtime.evaluate', {
    expression: `({
      url: window.location.href,
      htmlText: document.body.innerText.substring(0, 300),
      hasInputs: Array.from(document.querySelectorAll('input, textarea')).map(i => ({ id: i.id, name: i.name, placeholder: i.placeholder, type: i.type }))
    })`,
    returnByValue: true
  });

  console.log('Page State:', JSON.stringify(res.result.value, null, 2));
  ws.close();
}

inspect().catch(console.error);
