import express from 'express';
import path from 'path';
import fs from 'fs';
import https from 'https';
import { fileURLToPath } from 'url';
import userRoutes from './routes/users.js';
import friendRoutes from './routes/friends.js';
import newsRoutes from './routes/news.js';
import messageRoutes from './routes/messages.js';

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);

const server = express();
const port = 3000;
const buildPath = '../../dist-webpack';

server.set('view engine', 'pug');
server.set('views', path.join(currentDir, buildPath, 'html'));

server.use(express.json());
server.use(express.static(path.join(currentDir, buildPath)));

const staticRoutes = [
    { path: '/images', folder: 'images' },
    { path: '/css', folder: 'css' },
    { path: '/js', folder: 'js' },
    { path: '/html', folder: 'html' }
];

staticRoutes.forEach(route => {
    server.use(route.path, express.static(path.join(currentDir, buildPath, route.folder)));
});

const apiRoutes = [
    { path: '/api/users', handler: userRoutes },
    { path: '/api/friends', handler: friendRoutes },
    { path: '/api/news', handler: newsRoutes },
    { path: '/api/messages', handler: messageRoutes }
];

apiRoutes.forEach(route => {
    server.use(route.path, route.handler);
});

const pageRoutes = [
    { path: '/', file: 'users.html' },
    { path: '/users.html', file: 'users.html' },
    { path: '/friends.html', file: 'friends.html' },
    { path: '/news.html', file: 'news.html' },
    { path: '/messages.html', file: 'messages.html' }
];

pageRoutes.forEach(route => {
    server.get(route.path, (request, response) => {
        response.sendFile(path.join(currentDir, buildPath, 'html', route.file));
    });
});

server.get('*', (request, response) => {
    response.status(404).send('Страница не найдена');
});

const sslConfig = {
    key: fs.readFileSync(path.join(currentDir, 'ssl/key.pem')),
    cert: fs.readFileSync(path.join(currentDir, 'ssl/cert.pem'))
};

https.createServer(sslConfig, server).listen(port, () => {
    console.log(`HTTPS сервер запущен на https://localhost:${port}`);
});
