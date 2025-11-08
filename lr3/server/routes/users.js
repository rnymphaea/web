import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();
const usersPath = path.join(__dirname, '../data/users.json');

router.get('/', async (req, res) => {
    try {
        const data = await fs.readFile(usersPath, 'utf8');
        const users = JSON.parse(data);
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Error reading users' });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const users = JSON.parse(await fs.readFile(usersPath, 'utf8'));
        const userId = parseInt(req.params.id);
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex !== -1) {
            users[userIndex] = { ...users[userIndex], ...req.body };
            await fs.writeFile(usersPath, JSON.stringify(users, null, 2));
            res.json(users[userIndex]);
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error updating user' });
    }
});

export default router;
