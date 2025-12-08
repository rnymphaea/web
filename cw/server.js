const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 3000;
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.json': 'application/json; charset=utf-8',
  '.mp3': 'audio/mpeg'
};

const server = http.createServer((req, res) => {
  const url = req.url === '/' ? '/entrance.html' : req.url;
  const filePath = path.join(__dirname, url);
  
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('File not found');
      return;
    }
    
    const ext = path.extname(filePath);
    res.writeHead(200, {
      'Content-Type': mimeTypes[ext] || 'application/octet-stream'
    });
    res.end(data);
  });
});

server.listen(port, () => {
  console.log(`Приложение запущено: http://localhost:${port}/`);
});
