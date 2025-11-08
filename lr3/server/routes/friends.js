import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();
const friendsPath = path.join(__dirname, '../data/friends.json');

router.get('/:userId', async (req, res) => {
    try {
        const data = await fs.readFile(friendsPath, 'utf8');
        const friends = JSON.parse(data);
        const userFriends = friends.find(f => f.userId === parseInt(req.params.userId));
        res.json(userFriends || { friends: [] });
    } catch (error) {
        res.status(500).json({ error: 'Error reading friends' });
    }
});

export default router;
