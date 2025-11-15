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
try {
  app.use('/admin', express.static(adminModulePath));
  console.log(`✅ Admin module mounted at /admin from: ${adminModulePath}`);
} catch (error) {
  console.log('❌ Admin module not found, running without admin panel');
}

// ✅ СОЗДАЕМ РЕАЛЬНЫЕ ДАННЫЕ (если нет админ-модуля)
const dataPath = path.join(__dirname, 'data');
const ensureDataExists = async () => {
  try {
    await fs.access(dataPath);
  } catch (error) {
    await fs.mkdir(dataPath, { recursive: true });
    
    // Создаем базовые данные
    const initialData = {
      users: [
        {
          id: 1,
          firstName: 'Иван',
          lastName: 'Иванов',
          email: 'ivan@mail.ru',
          role: 'admin',
          status: 'active',
          friends: [2, 3],
          avatar: 'user1.jpg',
          birthDate: '1990-01-01'
        },
        {
          id: 2,
          firstName: 'Петр',
          lastName: 'Петров',
          email: 'petr@mail.ru',
          role: 'user',
          status: 'active',
          friends: [1],
          avatar: 'user2.jpg',
          birthDate: '1991-02-02'
        },
        {
          id: 3,
          firstName: 'Мария',
          lastName: 'Сидорова',
          email: 'maria@mail.ru',
          role: 'user',
          status: 'active',
          friends: [1],
          avatar: 'user3.jpg',
          birthDate: '1992-03-03'
        }
      ],
      friends: [
        { userId: 1, friendId: 2 },
        { userId: 1, friendId: 3 },
        { userId: 2, friendId: 1 },
        { userId: 3, friendId: 1 }
      ],
      news: [
        {
          id: 1,
          authorId: 2,
          content: 'Привет всем! Это моя первая новость.',
          date: '2024-01-15'
        },
        {
          id: 2,
          authorId: 3,
          content: 'Сегодня отличный день для программирования!',
          date: '2024-01-16'
        }
      ],
      messages: [
        {
          id: 1,
          user_id: 1,
          recipient_id: 2,
          content: 'Привет! Как дела?',
          date: '2024-01-15T10:00:00Z'
        },
        {
          id: 2,
          user_id: 2,
          recipient_id: 1,
          content: 'Привет! Все отлично, спасибо!',
          date: '2024-01-15T10:05:00Z'
        }
      ]
    };

    await fs.writeFile(path.join(dataPath, 'users.json'), JSON.stringify(initialData.users, null, 2));
    await fs.writeFile(path.join(dataPath, 'friends.json'), JSON.stringify(initialData.friends, null, 2));
    await fs.writeFile(path.join(dataPath, 'news.json'), JSON.stringify(initialData.news, null, 2));
    await fs.writeFile(path.join(dataPath, 'messages.json'), JSON.stringify(initialData.messages, null, 2));
  }
};

// ✅ API ENDPOINTS
app.get('/api/users', async (req, res) => {
  try {
    await ensureDataExists();
    const data = await fs.readFile(path.join(dataPath, 'users.json'), 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    console.error('Error loading users:', error);
    res.status(500).json({ error: 'Failed to load users' });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    await ensureDataExists();
    const data = await fs.readFile(path.join(dataPath, 'users.json'), 'utf8');
    const users = JSON.parse(data);
    const user = users.find(u => u.id == req.params.id);
    user ? res.json(user) : res.status(404).json({ error: 'User not found' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load user' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    await ensureDataExists();
    const data = await fs.readFile(path.join(dataPath, 'users.json'), 'utf8');
    const users = JSON.parse(data);
    const userIndex = users.findIndex(u => u.id == req.params.id);
    
    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], ...req.body };
      await fs.writeFile(path.join(dataPath, 'users.json'), JSON.stringify(users, null, 2));
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
    await ensureDataExists();
    const [usersData, friendsData] = await Promise.all([
      fs.readFile(path.join(dataPath, 'users.json'), 'utf8'),
      fs.readFile(path.join(dataPath, 'friends.json'), 'utf8')
    ]);
    
    const users = JSON.parse(usersData);
    const friends = JSON.parse(friendsData);
    const userId = parseInt(req.params.id);
    
    const userFriends = friends
      .filter(f => f.userId === userId || f.friendId === userId)
      .map(f => {
        const friendId = f.userId === userId ? f.friendId : f.userId;
        const friend = users.find(u => u.id === friendId);
        return friend ? {
          id: friend.id,
          firstName: friend.firstName,
          lastName: friend.lastName,
          avatar: friend.avatar
        } : null;
      })
      .filter(Boolean);
    
    res.json(userFriends);
  } catch (error) {
    console.error('Error loading friends:', error);
    res.status(500).json({ error: 'Failed to load friends' });
  }
});

app.get('/api/news/:id', async (req, res) => {
  try {
    await ensureDataExists();
    const [newsData, usersData] = await Promise.all([
      fs.readFile(path.join(dataPath, 'news.json'), 'utf8'),
      fs.readFile(path.join(dataPath, 'users.json'), 'utf8')
    ]);
    
    const news = JSON.parse(newsData);
    const users = JSON.parse(usersData);
    const userId = parseInt(req.params.id);
    
    const user = users.find(u => u.id === userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const friendNews = news
      .filter(n => user.friends.includes(n.authorId))
      .map(n => {
        const author = users.find(u => u.id === n.authorId);
        return {
          ...n,
          authorName: author ? `${author.firstName} ${author.lastName}` : 'Неизвестный'
        };
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date)); // Сортируем по дате (новые сначала)
    
    res.json(friendNews);
  } catch (error) {
    console.error('Error loading news:', error);
    res.status(500).json({ error: 'Failed to load news' });
  }
});

app.get('/api/messages/:id', async (req, res) => {
  try {
    await ensureDataExists();
    const [messagesData, usersData] = await Promise.all([
      fs.readFile(path.join(dataPath, 'messages.json'), 'utf8'),
      fs.readFile(path.join(dataPath, 'users.json'), 'utf8')
    ]);
    
    const messages = JSON.parse(messagesData);
    const users = JSON.parse(usersData);
    const userId = parseInt(req.params.id);
    
    const userMessages = messages
      .filter(m => m.user_id === userId || m.recipient_id === userId)
      .map(m => {
        const sender = users.find(u => u.id === m.user_id);
        const receiver = users.find(u => u.id === m.recipient_id);
        return {
          content: m.content,
          date: m.date,
          senderName: sender ? `${sender.firstName} ${sender.lastName}` : 'Неизвестно',
          receiverName: receiver ? `${receiver.firstName} ${receiver.lastName}` : 'Неизвестно'
        };
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    res.json(userMessages);
  } catch (error) {
    console.error('Error loading messages:', error);
    res.status(500).json({ error: 'Failed to load messages' });
  }
});

// ✅ АУТЕНТИФИКАЦИЯ И РЕГИСТРАЦИЯ
app.post('/api/auth/login', async (req, res) => {
  try {
    await ensureDataExists();
    const { email, password } = req.body;
    const data = await fs.readFile(path.join(dataPath, 'users.json'), 'utf8');
    const users = JSON.parse(data);
    
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Пользователь не найден' });
    }
    
    // В реальном приложении здесь должна быть проверка пароля
    res.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/users/register', async (req, res) => {
  try {
    await ensureDataExists();
    const data = await fs.readFile(path.join(dataPath, 'users.json'), 'utf8');
    const users = JSON.parse(data);
    
    const existingUser = users.find(u => u.email === req.body.email);
    if (existingUser) {
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
    }
    
    const newUser = { 
      id: Math.max(...users.map(u => u.id)) + 1,
      ...req.body, 
      friends: [], 
      status: 'active',
      role: 'user',
      avatar: 'default.jpg',
      birthDate: req.body.birthDate || null
    };
    
    users.push(newUser);
    await fs.writeFile(path.join(dataPath, 'users.json'), JSON.stringify(users, null, 2));
    
    res.json({
      id: newUser.id,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      role: newUser.role
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/news', async (req, res) => {
  try {
    await ensureDataExists();
    const data = await fs.readFile(path.join(dataPath, 'news.json'), 'utf8');
    const news = JSON.parse(data);
    
    const newPost = { 
      id: Math.max(...news.map(n => n.id)) + 1,
      ...req.body, 
      date: new Date().toISOString().split('T')[0] 
    };
    
    news.push(newPost);
    await fs.writeFile(path.join(dataPath, 'news.json'), JSON.stringify(news, null, 2));
    
    // ✅ WEBSOCKET УВЕДОМЛЕНИЕ ДЛЯ РЕАЛЬНОГО ВРЕМЕНИ
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ 
          type: 'NEW_POST', 
          data: {
            ...newPost,
            authorName: req.body.authorName || 'Новый пользователь'
          }
        }));
      }
    });
    
    res.json(newPost);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// ✅ WEBSOCKET ДЛЯ РЕАЛЬНОГО ВРЕМЕНИ
wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket');
  ws.on('message', (message) => {
    try {
      const parsedMessage = JSON.parse(message);
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(parsedMessage));
        }
      });
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  });
});

// ✅ ОБРАБОТКА MARKUP ДЛЯ ANGULAR
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/social-network-app/index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Angular app: http://localhost:${PORT}`);
  console.log(`⚙️  Admin module: http://localhost:${PORT}/admin/users.html`);
});
