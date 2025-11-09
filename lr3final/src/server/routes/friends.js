import express from 'express';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const router = express.Router();

const userDataPath = path.join(currentDir, '../data/users.json');
const friendDataPath = path.join(currentDir, '../data/friends.json');

router.get('/:id', async (request, response) => {
    try {
        const targetUserId = parseInt(request.params.id);
        const allUsers = await fs.readJson(userDataPath);
        const allFriendships = await fs.readJson(friendDataPath);
        
        const targetUser = allUsers.find(user => user.id === targetUserId);

        if (!targetUser) {
            return response.status(404).json({ error: 'Пользователь не найден' });
        }

        const userFriendRelations = allFriendships.filter(relation =>
            relation.userId === targetUserId || relation.friendId === targetUserId
        );

        const friendList = userFriendRelations
            .map(relation => {
                const friendId = relation.userId === targetUserId ? relation.friendId : relation.userId;
                const friendData = allUsers.find(user => user.id === friendId);
                return friendData ? { ...friendData } : null;
            })
            .filter((friend, index, array) =>
                index === array.findIndex(item => item.id === friend.id)
            );
            
        response.json(friendList);
    } catch (error) {
        response.status(500).json({ error: 'Не удалось загрузить друзей' });
    }
});

export default router;
