const request = require('supertest');
const express = require('express');

// Создаем тестовое Express приложение
const app = express();
app.use(express.json());

// Интерфейсы для TypeScript
interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  status: string;
  friends: number[];
  avatar: string;
  birthDate: string;
}

interface NewsPost {
  id: number;
  authorId: number;
  content: string;
  date: string;
  authorName: string;
}

interface Message {
  id: number;
  user_id: number;
  recipient_id: number;
  content: string;
  date: string;
  read: boolean;
}

interface Friendship {
  userId: number;
  friendId: number;
}

// Mock данные для тестов
const mockUsers: User[] = [
  {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    password: 'password123',
    role: 'user',
    status: 'active',
    friends: [2, 3],
    avatar: 'default.jpg',
    birthDate: '1990-01-01'
  },
  {
    id: 2,
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    password: 'password123',
    role: 'user',
    status: 'active',
    friends: [1],
    avatar: 'default.jpg',
    birthDate: '1992-05-15'
  },
  {
    id: 3,
    firstName: 'Bob',
    lastName: 'Johnson',
    email: 'bob@example.com',
    password: 'password123',
    role: 'user',
    status: 'active',
    friends: [],
    avatar: 'default.jpg',
    birthDate: '1988-03-20'
  }
];

const mockNews: NewsPost[] = [
  {
    id: 1,
    authorId: 1,
    content: 'Test post content',
    date: '2024-01-01T10:00:00Z',
    authorName: 'John Doe'
  },
  {
    id: 2,
    authorId: 2,
    content: 'Another test post',
    date: '2024-01-02T12:00:00Z',
    authorName: 'Jane Smith'
  }
];

const mockMessages: Message[] = [
  {
    id: 1,
    user_id: 1,
    recipient_id: 2,
    content: 'Hello!',
    date: '2024-01-01T10:00:00Z',
    read: false
  },
  {
    id: 2,
    user_id: 2,
    recipient_id: 1,
    content: 'Hi there!',
    date: '2024-01-01T10:05:00Z',
    read: false
  }
];

const mockFriends: Friendship[] = [
  { userId: 1, friendId: 2 },
  { userId: 2, friendId: 1 },
  { userId: 1, friendId: 3 }
];

// Mock endpoints для тестов
app.get('/api/users', async (req: any, res: any) => {
  try {
    // Возвращаем пользователей без паролей
    const safeUsers = mockUsers.map(({ password, ...user }) => user);
    return res.json(safeUsers);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load users' });
  }
});

app.get('/api/users/:id', async (req: any, res: any) => {
  try {
    const user = mockUsers.find(u => u.id === parseInt(req.params['id']));
    if (user) {
      const { password, ...safeUser } = user;
      return res.json(safeUser);
    } else {
      return res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load user' });
  }
});

app.post('/api/auth/login', async (req: any, res: any) => {
  try {
    const { email, password } = req.body;
    const user = mockUsers.find(u => u.email === email);
    
    if (!user) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }
    
    const { password: _, ...safeUser } = user;
    return res.json(safeUser);
  } catch (error) {
    return res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/users/register', async (req: any, res: any) => {
  try {
    const { email, firstName, lastName, password, birthDate } = req.body;
    
    const existingUser = mockUsers.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
    }
    
    const newUser: User = {
      id: Math.max(...mockUsers.map(u => u.id)) + 1,
      firstName,
      lastName,
      email,
      password,
      birthDate: birthDate || '',
      role: 'user',
      status: 'active',
      friends: [],
      avatar: 'default.jpg'
    };
    
    const { password: _, ...safeUser } = newUser;
    return res.json(safeUser);
  } catch (error) {
    return res.status(500).json({ error: 'Registration failed' });
  }
});

app.get('/api/news/:userId', async (req: any, res: any) => {
  try {
    const userId = parseInt(req.params['userId']);
    const user = mockUsers.find(u => u.id === userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userNews = mockNews.filter(n => 
      user.friends.includes(n.authorId) || n.authorId === userId
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return res.json(userNews);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load news' });
  }
});

app.post('/api/news', async (req: any, res: any) => {
  try {
    const { authorId, content } = req.body;
    const author = mockUsers.find(u => u.id === authorId);
    
    const newPost: NewsPost = {
      id: Math.max(...mockNews.map(n => n.id)) + 1,
      authorId,
      content,
      date: new Date().toISOString(),
      authorName: author ? `${author.firstName} ${author.lastName}` : 'Unknown'
    };
    
    return res.json(newPost);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create post' });
  }
});

app.get('/api/messages/:userId', async (req: any, res: any) => {
  try {
    const userId = parseInt(req.params['userId']);
    const userMessages = mockMessages.filter(m => 
      m.user_id === userId || m.recipient_id === userId
    );
    
    return res.json(userMessages);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load messages' });
  }
});

app.post('/api/messages', async (req: any, res: any) => {
  try {
    const { senderId, recipientId, content } = req.body;
    
    const newMessage: Message = {
      id: Math.max(...mockMessages.map(m => m.id)) + 1,
      user_id: senderId,
      recipient_id: recipientId,
      content,
      date: new Date().toISOString(),
      read: false
    };
    
    return res.json(newMessage);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to send message' });
  }
});

app.get('/api/friends/:userId', async (req: any, res: any) => {
  try {
    const userId = parseInt(req.params['userId']);
    
    // Используем Set для уникальных ID друзей
    const friendIds = new Set<number>();
    
    mockFriends.forEach(f => {
      if (f.userId === userId) {
        friendIds.add(f.friendId);
      } else if (f.friendId === userId) {
        friendIds.add(f.userId);
      }
    });
    
    // Получаем уникальных друзей
    const userFriends = Array.from(friendIds).map(friendId => {
      const friend = mockUsers.find(u => u.id === friendId);
      return friend ? {
        id: friend.id,
        firstName: friend.firstName,
        lastName: friend.lastName,
        avatar: friend.avatar,
        email: friend.email,
        status: friend.status
      } : null;
    }).filter(Boolean);
    
    return res.json(userFriends);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load friends' });
  }
});

app.get('/api/users/search/:query', async (req: any, res: any) => {
  try {
    const query = req.params['query'].toLowerCase();
    const currentUserId = parseInt((req.query as any).currentUserId);
    
    const filteredUsers = mockUsers
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
    
    return res.json(filteredUsers);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to search users' });
  }
});

app.post('/api/friends', async (req: any, res: any) => {
  try {
    const { userId, friendId } = req.body;
    
    // Проверяем, не являются ли уже друзьями
    const existingFriendship = mockFriends.find(f => 
      (f.userId === userId && f.friendId === friendId) ||
      (f.userId === friendId && f.friendId === userId)
    );
    
    if (existingFriendship) {
      return res.status(400).json({ error: 'Пользователь уже у вас в друзьях' });
    }
    
    const userExists = mockUsers.some(u => u.id === userId);
    const friendExists = mockUsers.some(u => u.id === friendId);
    
    if (!userExists || !friendExists) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    // Добавляем новую дружбу в mock данные
    mockFriends.push({ userId, friendId });
    
    const newFriendship: Friendship = {
      userId: userId,
      friendId: friendId
    };
    
    return res.json({ 
      success: true, 
      message: 'Пользователь добавлен в друзья',
      friendship: newFriendship
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to add friend' });
  }
});

// Тесты
describe('API Tests', () => {
  // Сбрасываем состояние mock данных перед каждым тестом
  beforeEach(() => {
    // Восстанавливаем исходное состояние mockFriends
    mockFriends.length = 0;
    mockFriends.push(
      { userId: 1, friendId: 2 },
      { userId: 2, friendId: 1 },
      { userId: 1, friendId: 3 }
    );
  });

  describe('Users API', () => {
    test('GET /api/users returns users array without passwords', async () => {
      const response = await request(app).get('/api/users');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      // Проверяем что пароли не возвращаются
      response.body.forEach((user: any) => {
        expect(user.password).toBeUndefined();
      });
    });

    test('GET /api/users/:id returns specific user', async () => {
      const response = await request(app).get('/api/users/1');
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(1);
      expect(response.body.firstName).toBe('John');
      expect(response.body.password).toBeUndefined();
    });

    test('GET /api/users/:id returns 404 for non-existent user', async () => {
      const response = await request(app).get('/api/users/999');
      expect(response.status).toBe(404);
    });
  });

  describe('Authentication API', () => {
    test('POST /api/auth/login with valid credentials returns user', async () => {
      const credentials = { email: 'john@example.com', password: 'password123' };
      const response = await request(app).post('/api/auth/login').send(credentials);
      expect(response.status).toBe(200);
      expect(response.body.email).toBe('john@example.com');
      expect(response.body.password).toBeUndefined();
    });

    test('POST /api/auth/login with invalid credentials returns error', async () => {
      const credentials = { email: 'nonexistent@example.com', password: 'wrong' };
      const response = await request(app).post('/api/auth/login').send(credentials);
      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });

    test('POST /api/users/register creates new user', async () => {
      const newUser = {
        firstName: 'New',
        lastName: 'User',
        email: 'new@example.com',
        password: 'password123',
        birthDate: '1995-01-01'
      };
      
      const response = await request(app).post('/api/users/register').send(newUser);
      expect(response.status).toBe(200);
      expect(response.body.email).toBe('new@example.com');
      expect(response.body.firstName).toBe('New');
      expect(response.body.password).toBeUndefined();
    });

    test('POST /api/users/register with existing email returns error', async () => {
      const existingUser = {
        firstName: 'Existing',
        lastName: 'User',
        email: 'john@example.com', // Существующий email
        password: 'password123'
      };
      
      const response = await request(app).post('/api/users/register').send(existingUser);
      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('News API', () => {
    test('GET /api/news/:userId returns news for user', async () => {
      const response = await request(app).get('/api/news/1');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('POST /api/news creates new post', async () => {
      const newPost = { authorId: 1, content: 'Test post content' };
      const response = await request(app).post('/api/news').send(newPost);
      expect(response.status).toBe(200);
      expect(response.body.content).toBe('Test post content');
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('date');
      expect(response.body).toHaveProperty('authorName');
    });
  });

  describe('Messages API', () => {
    test('GET /api/messages/:userId returns user messages', async () => {
      const response = await request(app).get('/api/messages/1');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    test('POST /api/messages sends new message', async () => {
      const newMessage = { senderId: 1, recipientId: 2, content: 'Hello test' };
      const response = await request(app).post('/api/messages').send(newMessage);
      expect(response.status).toBe(200);
      expect(response.body.content).toBe('Hello test');
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('date');
    });
  });

  describe('Friends API', () => {
    test('GET /api/friends/:userId returns user friends', async () => {
      const response = await request(app).get('/api/friends/1');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('GET /api/users/search/:query returns search results', async () => {
      const response = await request(app).get('/api/users/search/john?currentUserId=2');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('POST /api/friends adds friend', async () => {
      // Используем пользователей, которые еще не друзья
      const friendRequest = { userId: 2, friendId: 3 };
      const response = await request(app).post('/api/friends').send(friendRequest);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBeDefined();
    });

    test('POST /api/friends returns error for existing friendship', async () => {
      const friendRequest = { userId: 1, friendId: 2 }; // Уже друзья
      const response = await request(app).post('/api/friends').send(friendRequest);
      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });
});
