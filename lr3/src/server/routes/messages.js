import express from 'express';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const router = express.Router();

const messageDataPath = path.join(currentDir, '../data/messages.json');
const userDataPath = path.join(currentDir, '../data/users.json');

router.get('/:id', async (request, response) => {
    try {
        const targetUserId = parseInt(request.params.id);
        const allMessages = await fs.readJson(messageDataPath);
        const allUsers = await fs.readJson(userDataPath);
        
        const userMessages = allMessages.filter(message =>
            message.user_id === targetUserId || message.recipient_id === targetUserId
        );
        
        const messagesWithDetails = userMessages.map(message => {
            const sender = allUsers.find(user => user.id === message.user_id);
            const recipient = allUsers.find(user => user.id === message.recipient_id);
            
            return {
                content: message.content,
                date: message.date,
                senderName: sender ? `${sender.firstName} ${sender.lastName}` : 'Неизвестно',
                receiverName: recipient ? `${recipient.firstName} ${recipient.lastName}` : 'Неизвестно'
            };
        });
        
        response.json(messagesWithDetails);
    } catch (error) {
        console.error('Ошибка загрузки сообщений:', error);
        response.status(500).json({ error: 'Не удалось загрузить сообщения' });
    }
});

export default router;
