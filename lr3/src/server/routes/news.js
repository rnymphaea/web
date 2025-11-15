import express from 'express';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const router = express.Router();

const newsDataPath = path.join(currentDir, '../data/news.json');
const userDataPath = path.join(currentDir, '../data/users.json');

router.get('/:id', async (request, response) => {
    try {
        const targetUserId = parseInt(request.params.id);
        const allNews = await fs.readJson(newsDataPath);
        const allUsers = await fs.readJson(userDataPath);
        
        const targetUser = allUsers.find(user => user.id === targetUserId);
        if (!targetUser) {
            return response.status(404).json({ error: 'Пользователь не найден' });
        }
        
        const friendIds = targetUser.friends || [];
        const friendNews = allNews.filter(newsItem =>
            friendIds.includes(newsItem.authorId)
        );
        
        const newsWithAuthorInfo = friendNews.map(newsItem => {
            const author = allUsers.find(user => user.id === newsItem.authorId);
            return {
                ...newsItem,
                authorName: author ? `${author.firstName} ${author.lastName}` : 'Неизвестный'
            };
        });
        
        response.json(newsWithAuthorInfo);
    } catch (error) {
        response.status(500).json({ error: 'Не удалось загрузить новости' });
    }
});

export default router;
