const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const server = http.createServer(app);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || origin.includes('localhost')) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

const wss = new WebSocket.Server({ 
  server,
  verifyClient: (info, done) => {
    if (!info.origin || info.origin.includes('localhost')) {
      done(true);
    } else {
      console.log('WebSocket connection rejected from origin:', info.origin);
      done(false, 403, 'Forbidden');
    }
  }
});

app.use(express.static(path.join(__dirname, '../dist/social-network-app')));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${req.headers.origin}`);
  next();
});

let adminServerProcess = null;

const startAdminServer = () => {
  return new Promise((resolve) => {
    try {
      const adminModulePath = path.join(__dirname, '../node_modules/social-network-admin-rnymphaea');
      
      if (!require('fs').existsSync(adminModulePath)) {
        console.log('Admin module not found');
        resolve(false);
        return;
      }

      console.log('Starting admin HTTPS server...');
      adminServerProcess = spawn('sudo node', ['src/server/main.js'], {
        cwd: adminModulePath,
        stdio: 'inherit',
        shell: true
      });

      setTimeout(() => {
        console.log('Admin HTTPS server started on port 3001');
        resolve(true);
      }, 5000);

    } catch (error) {
      console.log('Failed to start admin server:', error.message);
      resolve(false);
    }
  });
};

const setupAdminPanel = () => {
  try {
    const adminModulePath = path.join(__dirname, '../node_modules/social-network-admin-rnymphaea');
    
    if (!require('fs').existsSync(adminModulePath)) {
      console.log('Admin module not found');
      return;
    }

    const adminGulpPath = path.join(adminModulePath, 'dist-gulp');
    
    if (require('fs').existsSync(adminGulpPath)) {
      app.use('/admin-static', express.static(adminGulpPath));
      console.log('Admin static files mounted at /admin-static');
    }
    
    app.get('/admin-panel', (req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Админ-панель</title>
            <style>
                body { font-family: Arial; padding: 20px; }
                .link { display: block; margin: 10px 0; padding: 10px; background: #007bff; color: white; text-decoration: none; }
            </style>
        </head>
        <body>
            <h2>Админ-панель социальной сети</h2>
            <a href="https://localhost:3001" target="_blank" class="link">🔐 HTTPS Админ-панель (порт 3001)</a>
            <a href="/admin-static/html/users.html" target="_blank" class="link">📊 Статическая версия</a>
            <a href="/" class="link">← Назад к приложению</a>
        </body>
        </html>
      `);
    });
    
  } catch (error) {
    console.log('Admin panel setup failed:', error.message);
  }
};

const getDataPath = () => {
  try {
    const adminModulePath = path.join(__dirname, '../node_modules/social-network-admin-rnymphaea');
    const dataPath = path.join(adminModulePath, 'src/server/data');
    
    if (require('fs').existsSync(dataPath)) {
      return dataPath;
    }
  } catch (error) {
  }
  
  const localDataPath = path.join(__dirname, 'data');
  if (!require('fs').existsSync(localDataPath)) {
    require('fs').mkdirSync(localDataPath, { recursive: true });
  }
  return localDataPath;
};

app.get('/api/users', async (req, res) => {
  try {
    const dataPath = getDataPath();
    const data = await fs.readFile(path.join(dataPath, 'users.json'), 'utf8');
    const users = JSON.parse(data);
    const safeUsers = users.map(({ password, ...user }) => user);
    res.json(safeUsers);
  } catch (error) {
    console.error('Error loading users:', error);
    res.status(500).json({ error: 'Failed to load users' });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const dataPath = getDataPath();
    const data = await fs.readFile(path.join(dataPath, 'users.json'), 'utf8');
    const users = JSON.parse(data);
    const user = users.find(u => u.id == req.params.id);
    
    if (user) {
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to load user' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const dataPath = getDataPath();
    const data = await fs.readFile(path.join(dataPath, 'users.json'), 'utf8');
    const users = JSON.parse(data);
    const userIndex = users.findIndex(u => u.id == req.params.id);
    
    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], ...req.body };
      await fs.writeFile(path.join(dataPath, 'users.json'), JSON.stringify(users, null, 2));
      const { password, ...safeUser } = users[userIndex];
      res.json(safeUser);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const dataPath = getDataPath();
    const data = await fs.readFile(path.join(dataPath, 'users.json'), 'utf8');
    const users = JSON.parse(data);
    
    const user = users.find(u => u.email === req.body.email);
    if (!user) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }
    
    const { password, ...safeUser } = user;
    res.json(safeUser);
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/users/register', async (req, res) => {
  try {
    const dataPath = getDataPath();
    const data = await fs.readFile(path.join(dataPath, 'users.json'), 'utf8');
    const users = JSON.parse(data);
    
    const existingUser = users.find(u => u.email === req.body.email);
    if (existingUser) {
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
    }
    
    const newUser = { 
      id: Math.max(0, ...users.map(u => u.id)) + 1,
      ...req.body,
      friends: [],
      status: 'active',
      role: 'user',
      avatar: 'default.jpg',
      birthDate: req.body.birthDate || null
    };
    
    users.push(newUser);
    await fs.writeFile(path.join(dataPath, 'users.json'), JSON.stringify(users, null, 2));
    
    const { password, ...safeUser } = newUser;
    res.json(safeUser);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.get('/api/friends/:userId', async (req, res) => {
  try {
    const dataPath = getDataPath();
    const [usersData, friendsData] = await Promise.all([
      fs.readFile(path.join(dataPath, 'users.json'), 'utf8'),
      fs.readFile(path.join(dataPath, 'friends.json'), 'utf8')
    ]);
    
    const users = JSON.parse(usersData);
    const friends = JSON.parse(friendsData);
    const userId = parseInt(req.params.userId);
    
    const friendIds = new Set();
    
    friends.forEach(f => {
      if (f.userId === userId) {
        friendIds.add(f.friendId);
      } else if (f.friendId === userId) {
        friendIds.add(f.userId);
      }
    });
    
    const userFriends = Array.from(friendIds).map(friendId => {
      const friend = users.find(u => u.id === friendId);
      return friend ? {
        id: friend.id,
        firstName: friend.firstName,
        lastName: friend.lastName,
        avatar: friend.avatar,
        email: friend.email,
        status: friend.status
      } : null;
    }).filter(Boolean);
    
    res.json(userFriends);
  } catch (error) {
    console.error('Error loading friends:', error);
    res.status(500).json({ error: 'Failed to load friends' });
  }
});

app.get('/api/news/:userId', async (req, res) => {
  try {
    const dataPath = getDataPath();
    const [newsData, usersData] = await Promise.all([
      fs.readFile(path.join(dataPath, 'news.json'), 'utf8'),
      fs.readFile(path.join(dataPath, 'users.json'), 'utf8')
    ]);
    
    const news = JSON.parse(newsData);
    const users = JSON.parse(usersData);
    const userId = parseInt(req.params.userId);
    
    const user = users.find(u => u.id === userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const userNews = news
      .filter(n => user.friends.includes(n.authorId) || n.authorId === userId)
      .map(n => {
        const author = users.find(u => u.id === n.authorId);
        return {
          ...n,
          authorName: author ? `${author.firstName} ${author.lastName}` : 'Неизвестный автор',
          authorAvatar: author ? author.avatar : 'default.jpg'
        };
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    res.json(userNews);
  } catch (error) {
    console.error('Error loading news:', error);
    res.status(500).json({ error: 'Failed to load news' });
  }
});

app.post('/api/news', async (req, res) => {
  try {
    const dataPath = getDataPath();
    const data = await fs.readFile(path.join(dataPath, 'news.json'), 'utf8');
    const news = JSON.parse(data);
    
    const newPost = { 
      id: Math.max(0, ...news.map(n => n.id)) + 1,
      ...req.body,
      date: new Date().toISOString()
    };
    
    news.push(newPost);
    await fs.writeFile(path.join(dataPath, 'news.json'), JSON.stringify(news, null, 2));
    
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ 
          type: 'NEW_POST', 
          data: newPost
        }));
      }
    });
    
    res.json(newPost);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

app.get('/api/messages/:userId', async (req, res) => {
  try {
    const dataPath = getDataPath();
    const data = await fs.readFile(path.join(dataPath, 'messages.json'), 'utf8');
    const messages = JSON.parse(data);
    const userId = parseInt(req.params.userId);
    
    const userMessages = messages.filter(m => 
      m.user_id === userId || m.recipient_id === userId
    );
    
    res.json(userMessages);
  } catch (error) {
    console.error('Error loading messages:', error);
    res.status(500).json({ error: 'Failed to load messages' });
  }
});

app.post('/api/messages', async (req, res) => {
  try {
    const dataPath = getDataPath();
    const data = await fs.readFile(path.join(dataPath, 'messages.json'), 'utf8');
    const messages = JSON.parse(data);
    
    const newMessage = {
      id: Math.max(0, ...messages.map(m => m.id)) + 1,
      user_id: req.body.senderId,
      recipient_id: req.body.recipientId,
      content: req.body.content,
      date: new Date().toISOString(),
      read: false
    };
    
    messages.push(newMessage);
    await fs.writeFile(path.join(dataPath, 'messages.json'), JSON.stringify(messages, null, 2));
    
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ 
          type: 'NEW_MESSAGE', 
          data: newMessage
        }));
      }
    });
    
    res.json(newMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

app.get('/api/users/search/:query', async (req, res) => {
  try {
    const dataPath = getDataPath();
    const data = await fs.readFile(path.join(dataPath, 'users.json'), 'utf8');
    const users = JSON.parse(data);
    
    const query = req.params.query.toLowerCase();
    const currentUserId = parseInt(req.query.currentUserId);
    
    const filteredUsers = users
      .filter(user => {
        if (user.id === currentUserId) return false;
        
        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
        const firstName = user.firstName.toLowerCase();
        const lastName = user.lastName.toLowerCase();
        
        return fullName.includes(query) || 
               firstName.includes(query) || 
               lastName.includes(query);
      })
      .map(({ password, ...user }) => user)
      .slice(0, 10);
    
    res.json(filteredUsers);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

app.post('/api/friends', async (req, res) => {
  try {
    const dataPath = getDataPath();
    const data = await fs.readFile(path.join(dataPath, 'friends.json'), 'utf8');
    const friends = JSON.parse(data);
    
    const { userId, friendId } = req.body;
    
    const existingFriendship = friends.find(f => 
      (f.userId === userId && f.friendId === friendId) ||
      (f.userId === friendId && f.friendId === userId)
    );
    
    if (existingFriendship) {
      return res.status(400).json({ error: 'Пользователь уже у вас в друзьях' });
    }
    
    const usersData = await fs.readFile(path.join(dataPath, 'users.json'), 'utf8');
    const users = JSON.parse(usersData);
    
    const userExists = users.some(u => u.id === userId);
    const friendExists = users.some(u => u.id === friendId);
    
    if (!userExists || !friendExists) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    const newFriendship = {
      userId: userId,
      friendId: friendId
    };
    
    friends.push(newFriendship);
    await fs.writeFile(path.join(dataPath, 'friends.json'), JSON.stringify(friends, null, 2));
    
    res.json({ 
      success: true, 
      message: 'Пользователь добавлен в друзья',
      friendship: newFriendship
    });
  } catch (error) {
    console.error('Error adding friend:', error);
    res.status(500).json({ error: 'Failed to add friend' });
  }
});

app.post('/api/avatar/upload', async (req, res) => {
  try {
    const { userId, imageData } = req.body;
    
    if (!userId || !imageData) {
      return res.status(400).json({ error: 'Missing userId or imageData' });
    }

    const base64Data = imageData.replace(/^data:image\/jpeg;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    const adminModulePath = path.join(__dirname, '../node_modules/social-network-admin-rnymphaea');
    const avatarsDir = path.join(adminModulePath, 'dist-gulp/images/users');
    
    if (!require('fs').existsSync(avatarsDir)) {
      require('fs').mkdirSync(avatarsDir, { recursive: true });
    }

    const avatarPath = path.join(avatarsDir, `user${userId}.jpg`);
    
    await fs.writeFile(avatarPath, imageBuffer);
    
    res.json({ success: true, message: 'Avatar uploaded successfully' });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

app.get('/api/avatar/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const adminModulePath = path.join(__dirname, '../node_modules/social-network-admin-rnymphaea');
    const avatarPath = path.join(adminModulePath, 'dist-gulp/images/users', `user${userId}.jpg`);
    
    if (require('fs').existsSync(avatarPath)) {
      res.sendFile(avatarPath);
    } else {
      const defaultAvatarPath = path.join(__dirname, 'assets/default-avatar.jpg');
      if (require('fs').existsSync(defaultAvatarPath)) {
        res.sendFile(defaultAvatarPath);
      } else {
        res.status(404).json({ error: 'Avatar not found' });
      }
    }
  } catch (error) {
    console.error('Error loading avatar:', error);
    res.status(500).json({ error: 'Failed to load avatar' });
  }
});

app.delete('/api/friends/:userId/:friendId', async (req, res) => {
  try {
    const dataPath = getDataPath();
    const data = await fs.readFile(path.join(dataPath, 'friends.json'), 'utf8');
    let friends = JSON.parse(data);
    
    const userId = parseInt(req.params.userId);
    const friendId = parseInt(req.params.friendId);
    
    const initialLength = friends.length;
    
    friends = friends.filter(f => 
      !(f.userId === userId && f.friendId === friendId) &&
      !(f.userId === friendId && f.friendId === userId)
    );
    
    if (friends.length === initialLength) {
      return res.status(404).json({ error: 'Дружба не найдена' });
    }
    
    await fs.writeFile(path.join(dataPath, 'friends.json'), JSON.stringify(friends, null, 2));
    
    res.json({ 
      success: true, 
      message: 'Друг удален'
    });
  } catch (error) {
    console.error('Error removing friend:', error);
    res.status(500).json({ error: 'Failed to remove friend' });
  }
});

app.put('/api/users/:id/profile', async (req, res) => {
  try {
    const dataPath = getDataPath();
    const data = await fs.readFile(path.join(dataPath, 'users.json'), 'utf8');
    const users = JSON.parse(data);
    const userId = parseInt(req.params.id);
    
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const { firstName, lastName, email, birthDate } = req.body;
    
    if (email && email !== users[userIndex].email) {
      const existingUser = users.find(u => u.email === email && u.id !== userId);
      if (existingUser) {
        return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
      }
    }
    
    users[userIndex] = {
      ...users[userIndex],
      firstName: firstName || users[userIndex].firstName,
      lastName: lastName || users[userIndex].lastName,
      email: email || users[userIndex].email,
      birthDate: birthDate || users[userIndex].birthDate
    };
    
    await fs.writeFile(path.join(dataPath, 'users.json'), JSON.stringify(users, null, 2));
    
    const { password, ...safeUser } = users[userIndex];
    res.json(safeUser);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

app.delete('/api/avatar/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const adminModulePath = path.join(__dirname, '../node_modules/social-network-admin-rnymphaea');
    const avatarPath = path.join(adminModulePath, 'dist-gulp/images/users', `user${userId}.jpg`);
    
    if (require('fs').existsSync(avatarPath)) {
      await fs.unlink(avatarPath);
      res.json({ success: true, message: 'Avatar deleted successfully' });
    } else {
      res.status(404).json({ error: 'Avatar not found' });
    }
  } catch (error) {
    console.error('Error deleting avatar:', error);
    res.status(500).json({ error: 'Failed to delete avatar' });
  }
});

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  
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
  
  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/social-network-app/index.html'));
});

const PORT = process.env.PORT || 3000;

const startServers = async () => {
  try {
    setupAdminPanel();
    
    server.listen(PORT, () => {
      console.log(`Main server running on http://localhost:${PORT}`);
      console.log(`Angular app: http://localhost:${PORT}`);
    });

    try {
      await startAdminServer();
    } catch (error) {
      console.log('Admin HTTPS server not available');
    }

  } catch (error) {
    console.error('Failed to start main server:', error);
    process.exit(1);
  }
};

process.on('SIGINT', () => {
  console.log('Shutting down servers...');
  if (adminServerProcess) {
    adminServerProcess.kill();
  }
  process.exit(0);
});

startServers();
