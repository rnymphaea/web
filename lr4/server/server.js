const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json());

// ✅ СТАТИКА ДЛЯ ANGULAR ПРИЛОЖЕНИЯ
app.use(express.static(path.join(__dirname, '../dist/social-network-app')));

// ✅ СТАТИКА ДЛЯ АДМИН-МОДУЛЯ ИЗ NPM
const adminModulePath = path.join(__dirname, '../node_modules/social-network-admin-rnymphaea/dist-gulp');
app.use('/admin', express.static(adminModulePath));

// ✅ ОБЩИЕ ДАННЫЕ - используем данные из админ-модуля
const adminDataPath = path.join(__dirname, '../node_modules/social-network-admin-rnymphaea/src/server/data');

// ✅ API ENDPOINTS (используем данные из админ-модуля)
app.get('/api/users', async (req, res) => {
  try {
    const data = await fs.readFile(path.join(adminDataPath, 'users.json'), 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to load users' });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const data = await fs.readFile(path.join(adminDataPath, 'users.json'), 'utf8');
    const users = JSON.parse(data);
    const user = users.find(u => u.id == req.params.id);
    user ? res.json(user) : res.status(404).json({ error: 'User not found' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load user' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const data = await fs.readFile(path.join(adminDataPath, 'users.json'), 'utf8');
    const users = JSON.parse(data);
    const userIndex = users.findIndex(u => u.id == req.params.id);
    
    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], ...req.body };
      await fs.writeFile(path.join(adminDataPath, 'users.json'), JSON.stringify(users, null, 2));
      res.json(users[userIndex]);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.get('/api/friends/:id', async (req, res) => {
  try {
    const [usersData, friendsData] = await Promise.all([
      fs.readFile(path.join(adminDataPath, 'users.json'), 'utf8'),
      fs.readFile(path.join(adminDataPath, 'friends.json'), 'utf8')
    ]);
    
    const users = JSON.parse(usersData);
    const friends = JSON.parse(friendsData);
    const userId = parseInt(req.params.id);
    
    const userFriends = friends
      .filter(f => f.userId === userId || f.friendId === userId)
      .map(f => {
        const friendId = f.userId === userId ? f.friendId : f.userId;
        return users.find(u => u.id === friendId);
      })
      .filter(Boolean);
    
    res.json(userFriends);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load friends' });
  }
});

app.get('/api/news/:id', async (req, res) => {
  try {
    const [newsData, usersData] = await Promise.all([
      fs.readFile(path.join(adminDataPath, 'news.json'), 'utf8'),
      fs.readFile(path.join(adminDataPath, 'users.json'), 'utf8')
    ]);
    
    const news = JSON.parse(newsData);
    const users = JSON.parse(usersData);
    const userId = parseInt(req.params.id);
    
    const user = users.find(u => u.id === userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const friendNews = news
      .filter(n => user.friends.includes(n.authorId))
      .map(n => ({
        ...n,
        authorName: users.find(u => u.id === n.authorId)?.firstName + ' ' + 
                    users.find(u => u.id === n.authorId)?.lastName
      }));
    
    res.json(friendNews);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load news' });
  }
});

app.get('/api/messages/:id', async (req, res) => {
  try {
    const [messagesData, usersData] = await Promise.all([
      fs.readFile(path.join(adminDataPath, 'messages.json'), 'utf8'),
      fs.readFile(path.join(adminDataPath, 'users.json'), 'utf8')
    ]);
    
    const messages = JSON.parse(messagesData);
    const users = JSON.parse(usersData);
    const userId = parseInt(req.params.id);
    
    const userMessages = messages
      .filter(m => m.user_id === userId || m.recipient_id === userId)
      .map(m => ({
        content: m.content,
        date: m.date,
        senderName: users.find(u => u.id === m.user_id)?.firstName + ' ' + 
                   users.find(u => u.id === m.user_id)?.lastName,
        receiverName: users.find(u => u.id === m.recipient_id)?.firstName + ' ' + 
                     users.find(u => u.id === m.recipient_id)?.lastName
      }));
    
    res.json(userMessages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load messages' });
  }
});

// ✅ НОВЫЕ ENDPOINTS ДЛЯ ANGULAR ПРИЛОЖЕНИЯ
app.post('/api/users/register', async (req, res) => {
  try {
    const data = await fs.readFile(path.join(adminDataPath, 'users.json'), 'utf8');
    const users = JSON.parse(data);
    const newUser = { 
      id: users.length + 1, 
      ...req.body, 
      friends: [], 
      status: 'active',
      role: 'user',
      avatar: 'default.jpg'
    };
    users.push(newUser);
    await fs.writeFile(path.join(adminDataPath, 'users.json'), JSON.stringify(users, null, 2));
    res.json(newUser);
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/news', async (req, res) => {
  try {
    const data = await fs.readFile(path.join(adminDataPath, 'news.json'), 'utf8');
    const news = JSON.parse(data);
    const newPost = { 
      id: news.length + 1, 
      ...req.body, 
      date: new Date().toISOString().split('T')[0] 
    };
    news.push(newPost);
    await fs.writeFile(path.join(adminDataPath, 'news.json'), JSON.stringify(news, null, 2));
    
    // ✅ WEBSOCKET УВЕДОМЛЕНИЕ ДЛЯ РЕАЛЬНОГО ВРЕМЕНИ
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'NEW_POST', data: newPost }));
      }
    });
    
    res.json(newPost);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// ✅ WEBSOCKET ДЛЯ РЕАЛЬНОГО ВРЕМЕНИ
wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket');
  ws.on('message', (message) => {
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message.toString());
      }
    });
  });
});

// ✅ ПРОКСИ ДЛЯ АДМИН-МОДУЛЯ (если нужны его API)
app.use('/admin-api', (req, res, next) => {
  // Здесь можно добавить логику проксирования к API админ-модуля
  // если он запускает свой собственный сервер
  next();
});

// ✅ ОБРАБОТКА MARKUP ДЛЯ ANGULAR (должна быть последней)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/social-network-app/index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Angular app: http://localhost:${PORT}`);
  console.log(`⚙️  Admin module: http://localhost:${PORT}/admin/users.html`);
  console.log(`📊 Using admin module from: ${adminDataPath}`);
});
