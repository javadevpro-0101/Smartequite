// Smartquite: sayt va buyurtma backend'i bitta serverda (Node.js 18+)
// Ishga tushirish:
//   BOT_TOKEN=123456:ABC... CHAT_ID=-1001234567890 node server.js
//
// Papkada smartquite_index.html bo‘lishi kerak.
// Sayt: GET /
// Buyurtma: POST /api/order

const http = require('http');
const fs = require('fs');
const path = require('path');

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const PORT = process.env.PORT || 3000;
const HTML_FILE = path.join(__dirname, 'smartquite_index.html');

if (!BOT_TOKEN || !CHAT_ID) {
  console.error('BOT_TOKEN va CHAT_ID muhit o‘zgaruvchilarini kiriting.');
  process.exit(1);
}

const clean = (v) => String(v || '').trim().slice(0, 1000);

async function sendToTelegram(text) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: CHAT_ID, text })
  });
  if (!res.ok) {
    throw new Error(`Telegram xatosi: ${res.status} ${await res.text()}`);
  }
}

const server = http.createServer((req, res) => {
  // Sayt bosh sahifasi
  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    return fs.readFile(HTML_FILE, (err, html) => {
      if (err) {
        res.writeHead(500);
        return res.end('Sayt fayli topilmadi');
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    });
  }

  // Buyurtma formasi
  if (req.method === 'POST' && req.url === '/api/order') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 10000) req.destroy(); // juda katta so‘rovni to‘xtatish
    });

    return req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const text =
          `🆕 Yangi buyurtma — Smartquite\n\n` +
          `👤 Ism: ${clean(data.name)}\n` +
          `📧 Email: ${clean(data.email)}\n` +
          `📞 Telefon: ${clean(data.phone) || '—'}\n` +
          `📝 Xabar: ${clean(data.message) || '—'}\n\n` +
          `🕒 ${new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}`;

        await sendToTelegram(text);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (err) {
        console.error(err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false }));
      }
    });
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => console.log(`Server ishga tushdi: http://localhost:${PORT}`));
