const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 3000;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.json': 'application/json',
  '.tsx': 'text/plain',
  '.txt': 'text/plain',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  let url = req.url.split('?')[0];
  
  if (url === '/') {
    url = '/entrance.html';
  } else if (url === '/game') {
    url = '/index.html';
  }
  
  if (url.startsWith('/map/')) {
    url = url.substring(1);
  }
  
  let filePath = path.join(__dirname, url);
  const extname = String(path.extname(filePath)).toLowerCase();
  
  const contentType = mimeTypes[extname] || 'application/octet-stream';
  
  const isTextFile = contentType.startsWith('text/') || 
                     contentType.includes('javascript') || 
                     contentType.includes('json');

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        fs.readFile(path.join(__dirname, 'index.html'), (err2, data2) => {
          if (err2) {
            res.writeHead(404);
            res.end('File not found');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data2);
          }
        });
      } else {
        res.writeHead(500);
        res.end('Server error: ' + err.code);
      }
    } else {
      const headers = {};
      
      if (isTextFile) {
        headers['Content-Type'] = `${contentType}; charset=utf-8`;
      } else {
        headers['Content-Type'] = contentType;
      }
      
      res.writeHead(200, headers);
      res.end(data);
    }
  });
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
  console.log('Главная страница: http://localhost:3000/');
  console.log('Игра: http://localhost:3000/game');
});
