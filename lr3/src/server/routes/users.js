import express from 'express';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const router = express.Router();

const userDataPath = path.join(currentDir, '../data/users.json');

router.get('/', async (request, response) => {
    try {
        const allUsers = await fs.readJson(userDataPath);
        response.json(allUsers);
    } catch (error) {
        console.error('Ошибка чтения пользователей:', error);
        response.status(500).json({ error: 'Не удалось прочитать пользователей' });
    }
});

router.put('/:id', async (request, response) => {
    try {
        const allUsers = await fs.readJson(userDataPath);
        const targetUserId = parseInt(request.params.id);
        const userIndex = allUsers.findIndex(user => user.id === targetUserId);
        
        if (userIndex !== -1) {
            allUsers[userIndex] = { ...allUsers[userIndex], ...request.body };
            await fs.writeJson(userDataPath, allUsers, { spaces: 2 });
            response.json(allUsers[userIndex]);
        } else {
            response.status(404).json({ error: 'Пользователь не найден' });
        }
    } catch (error) {
        console.error('Ошибка обновления пользователя:', error);
        response.status(500).json({ error: 'Не удалось обновить пользователя' });
    }
});

export default router;
