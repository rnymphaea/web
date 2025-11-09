import express from 'express';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

const usersPath = path.join(__dirname, '../data/users.json');
const friendsPath = path.join(__dirname, '../data/friends.json');

router.get('/:userId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const users = await fs.readJson(usersPath);
        const friendsData = await fs.readJson(friendsPath);
        const user = users.find(u => u.id === userId);

        if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

        const userFriends = friendsData.filter(friendship =>
            friendship.userId === userId || friendship.friendId === userId
        );

        const friendInfo = userFriends
            .map(friendship => {
                const friendId = friendship.userId === userId ? friendship.friendId : friendship.userId;
                const friend = users.find(u => u.id === friendId);
                return friend ? { ...friend } : null;
            })
            .filter((friend, index, self) =>
                index === self.findIndex(f => f.id === friend.id)
            );
        res.json(friendInfo);
    } catch (error) {
        res.status(500).json({ error: 'Не удалось загрузить друзей' });
    }
});

export default router;
