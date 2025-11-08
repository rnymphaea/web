import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();
const messagesPath = path.join(__dirname, '../data/messages.json');

router.get('/friends/:userId', async (req, res) => {
    try {
        const data = await fs.readFile(messagesPath, 'utf8');
        const allMessages = JSON.parse(data);
        const friendsData = await fs.readFile(
            path.join(__dirname, '../data/friends.json'), 'utf8'
        );
        const friends = JSON.parse(friendsData);
        const userFriends = friends.find(f => f.userId === parseInt(req.params.userId));
        
        const friendMessages = allMessages.filter(msg => 
            userFriends?.friends.includes(msg.userId)
        );
        
        res.json(friendMessages);
    } catch (error) {
        res.status(500).json({ error: 'Error reading messages' });
    }
});

export default router;  // ← Должен быть default export
