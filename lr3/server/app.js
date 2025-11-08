import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import userRoutes from './routes/users.js';
import friendRoutes from './routes/friends.js';
import messageRoutes from './routes/messages.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/dist')));

app.use('/api/users', userRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/messages', messageRoutes);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.get('/friends', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/friends.html'));
});

app.get('/news', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/news.html'));
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
