const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const server = http.createServer(app);

// ✅ ПРАВИЛЬНАЯ НАСТРОЙКА CORS ДЛЯ ANGULAR DEV СЕРВЕРА
const corsOptions = {
  origin: function (origin, callback) {
    // Разрешаем запросы без origin (например, из Postman) и с любых localhost портов
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

// ✅ WebSocket С ПРАВИЛЬНЫМИ НАСТРОЙКАМИ CORS
const wss = new WebSocket.Server({ 
  server,
  verifyClient: (info, done) => {
    // Разрешаем все localhost соединения
    if (!info.origin || info.origin.includes('localhost')) {
      done(true);
    } else {
      console.log('WebSocket connection rejected from origin:', info.origin);
      done(false, 403, 'Forbidden');
    }
  }
});

// ✅ СТАТИКА ДЛЯ ANGULAR ПРИЛОЖЕНИЯ
app.use(express.static(path.join(__dirname, '../dist/social-network-app')));

// ✅ Middleware для логирования запросов
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${req.headers.origin}`);
  next();
});

// ✅ ЗАПУСК HTTPS СЕРВЕРА АДМИН-ПАНЕЛИ
let adminServerProcess = null;

const startAdminServer = () => {
  return new Promise((resolve) => {
    try {
      const adminModulePath = path.join(__dirname, '../node_modules/social-network-admin-rnymphaea');
      
      if (!require('fs').existsSync(adminModulePath)) {
        console.log('❌ Admin module not found');
        resolve(false);
        return;
      }

      console.log('🚀 Starting admin HTTPS server...');
      adminServerProcess = spawn('sudo node', ['src/server/main.js'], {
        cwd: adminModulePath,
        stdio: 'inherit',
        shell: true
      });

      // Даем время на запуск
      setTimeout(() => {
        console.log('✅ Admin HTTPS server started on port 3001');
        resolve(true);
      }, 5000);

    } catch (error) {
      console.log('❌ Failed to start admin server:', error.message);
      resolve(false);
    }
  });
};

// ✅ ПРОСТАЯ ИНТЕГРАЦИЯ АДМИН-ПАНЕЛИ
const setupAdminPanel = () => {
  try {
    const adminModulePath = path.join(__dirname, '../node_modules/social-network-admin-rnymphaea');
    
    if (!require('fs').existsSync(adminModulePath)) {
      console.log('❌ Admin module not found');
      return;
    }

    const adminGulpPath = path.join(adminModulePath, 'dist-gulp');
    
    if (require('fs').existsSync(adminGulpPath)) {
      // Статика админ-панели
      app.use('/admin-static', express.static(adminGulpPath));
      console.log('✅ Admin static files mounted at /admin-static');
    }
    
    // Простая HTML страница для админ-панели
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
    console.log('❌ Admin panel setup failed:', error.message);
  }
};

// ✅ ПУТЬ К ДАННЫМ (из npm модуля)
const getDataPath = () => {
  try {
    const adminModulePath = path.join(__dirname, '../node_modules/social-network-admin-rnymphaea');
    const dataPath = path.join(adminModulePath, 'src/server/data');
    
    if (require('fs').existsSync(dataPath)) {
      return dataPath;
    }
  } catch (error) {
    // Если модуля нет, используем локальную папку
  }
  
  // Локальная папка для данных
  const localDataPath = path.join(__dirname, 'data');
  if (!require('fs').existsSync(localDataPath)) {
    require('fs').mkdirSync(localDataPath, { recursive: true });
  }
  return localDataPath;
};

// ✅ API ENDPOINTS
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
      avatar: 'default.jpg'
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
    
    // Добавляем информацию об авторе к каждой новости
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
    
    // WebSocket уведомление
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

// ✅ WEBSOCKET ДЛЯ РЕАЛЬНОГО ВРЕМЕНИ
wss.on('connection', (ws) => {
  console.log('✅ WebSocket client connected');
  
  ws.on('message', (message) => {
    try {
      const parsedMessage = JSON.parse(message);
      console.log('WebSocket message received:', parsedMessage);
      
      // Рассылаем всем подключенным клиентам
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

// ✅ ОБРАБОТКА MARKUP ДЛЯ ANGULAR
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/social-network-app/index.html'));
});

const PORT = process.env.PORT || 3000;

// ✅ ЗАПУСК СЕРВЕРОВ
const startServers = async () => {
  try {
    // Настраиваем админ-панель
    setupAdminPanel();
    
    // Запускаем основной сервер
    server.listen(PORT, () => {
      console.log(`🚀 Main server running on http://localhost:${PORT}`);
      console.log(`📱 Angular app: http://localhost:${PORT}`);
      console.log(`🛠️  Admin panel: http://localhost:${PORT}/admin-panel`);
    });

    // Пытаемся запустить HTTPS сервер админ-панели
    try {
      await startAdminServer();
    } catch (error) {
      console.log('⚠️  Admin HTTPS server not available');
    }

  } catch (error) {
    console.error('Failed to start main server:', error);
    process.exit(1);
  }
};

// Обработка завершения
process.on('SIGINT', () => {
  console.log('Shutting down servers...');
  if (adminServerProcess) {
    adminServerProcess.kill();
  }
  process.exit(0);
});

// Запускаем серверы
startServers();
