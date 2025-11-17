const request = require('supertest');
const fs = require('fs').promises;
const path = require('path');

// Базовый URL реального сервера
const BASE_URL = 'http://localhost:3000';

// Глобальные переменные для хранения тестовых данных
let testUser: any = null;
let testFriend: any = null;
let testPost: any = null;
let testMessage: any = null;

describe('Real Server API Integration Tests', () => {
  beforeAll(async () => {
    console.log('Testing against real server at:', BASE_URL);
    console.log('Make sure server is running on port 3000');
  });

  describe('Users API - Real Endpoints', () => {
    test('GET /api/users should return array of users without passwords', async () => {
      const response = await request(BASE_URL)
        .get('/api/users')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      
      // Проверяем структуру пользователей
      if (response.body.length > 0) {
        const user = response.body[0];
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('firstName');
        expect(user).toHaveProperty('lastName');
        expect(user).toHaveProperty('email');
        expect(user).not.toHaveProperty('password'); // Пароль не должен возвращаться
      }
    });

    test('GET /api/users/:id should return specific user', async () => {
      // Сначала получаем список пользователей
      const usersResponse = await request(BASE_URL)
        .get('/api/users')
        .expect(200);

      if (usersResponse.body.length > 0) {
        const firstUser = usersResponse.body[0];
        const response = await request(BASE_URL)
          .get(`/api/users/${firstUser.id}`)
          .expect(200);

        expect(response.body.id).toBe(firstUser.id);
        expect(response.body.firstName).toBe(firstUser.firstName);
        expect(response.body).not.toHaveProperty('password');
      }
    });

    test('GET /api/users/:id should return 404 for non-existent user', async () => {
      await request(BASE_URL)
        .get('/api/users/999999')
        .expect(404);
    });
  });

  describe('Authentication API - Real Endpoints', () => {
    test('POST /api/users/register should create new user', async () => {
      const uniqueEmail = `test${Date.now()}@example.com`;
      
      const newUser = {
        firstName: 'Test',
        lastName: 'User',
        email: uniqueEmail,
        password: 'password123',
        birthDate: '1990-01-01'
      };

      const response = await request(BASE_URL)
        .post('/api/users/register')
        .send(newUser)
        .expect(200);

      expect(response.body.email).toBe(uniqueEmail);
      expect(response.body.firstName).toBe('Test');
      expect(response.body.lastName).toBe('User');
      expect(response.body).not.toHaveProperty('password');

      // Сохраняем для последующих тестов
      testUser = response.body;
    });

    test('POST /api/auth/login should work with valid credentials', async () => {
      if (!testUser) {
        // Если тестовый пользователь не создан, создаем его
        const uniqueEmail = `test${Date.now()}@example.com`;
        const newUser = {
          firstName: 'Login',
          lastName: 'Test',
          email: uniqueEmail,
          password: 'password123',
          birthDate: '1990-01-01'
        };

        const registerResponse = await request(BASE_URL)
          .post('/api/users/register')
          .send(newUser)
          .expect(200);

        testUser = registerResponse.body;
      }

      const credentials = {
        email: testUser.email,
        password: 'password123'
      };

      const response = await request(BASE_URL)
        .post('/api/auth/login')
        .send(credentials)
        .expect(200);

      expect(response.body.email).toBe(testUser.email);
      expect(response.body.id).toBe(testUser.id);
    });

    test('POST /api/auth/login should fail with invalid credentials', async () => {
      const credentials = {
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      };

      const response = await request(BASE_URL)
        .post('/api/auth/login')
        .send(credentials)
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('Friends API - Real Endpoints', () => {
    beforeAll(async () => {
      // Создаем второго пользователя для тестов друзей
      if (!testUser) {
        const uniqueEmail = `test${Date.now()}@example.com`;
        const newUser = {
          firstName: 'Main',
          lastName: 'User',
          email: uniqueEmail,
          password: 'password123',
          birthDate: '1990-01-01'
        };

        const response = await request(BASE_URL)
          .post('/api/users/register')
          .send(newUser)
          .expect(200);

        testUser = response.body;
      }

      // Создаем потенциального друга
      const friendEmail = `friend${Date.now()}@example.com`;
      const friendUser = {
        firstName: 'Friend',
        lastName: 'Test',
        email: friendEmail,
        password: 'password123',
        birthDate: '1992-01-01'
      };

      const response = await request(BASE_URL)
        .post('/api/users/register')
        .send(friendUser)
        .expect(200);

      testFriend = response.body;
    });

    test('GET /api/friends/:userId should return user friends', async () => {
      const response = await request(BASE_URL)
        .get(`/api/friends/${testUser.id}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    test('POST /api/friends should add friend', async () => {
      const friendRequest = {
        userId: testUser.id,
        friendId: testFriend.id
      };

      const response = await request(BASE_URL)
        .post('/api/friends')
        .send(friendRequest)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBeDefined();
    });

    test('GET /api/users/search/:query should find users', async () => {
      const response = await request(BASE_URL)
        .get(`/api/users/search/friend?currentUserId=${testUser.id}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      
      // Должен найти нашего тестового друга
      if (response.body.length > 0) {
        const found = response.body.some((user: any) => user.id === testFriend.id);
        expect(found).toBe(true);
      }
    });
  });

  describe('News API - Real Endpoints', () => {
    test('GET /api/news/:userId should return news feed', async () => {
      if (!testUser) {
        const uniqueEmail = `test${Date.now()}@example.com`;
        const newUser = {
          firstName: 'News',
          lastName: 'Test',
          email: uniqueEmail,
          password: 'password123',
          birthDate: '1990-01-01'
        };

        const response = await request(BASE_URL)
          .post('/api/users/register')
          .send(newUser)
          .expect(200);

        testUser = response.body;
      }

      const response = await request(BASE_URL)
        .get(`/api/news/${testUser.id}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    test('POST /api/news should create new post', async () => {
      const postData = {
        authorId: testUser.id,
        content: `Test post content ${Date.now()}`
      };

      const response = await request(BASE_URL)
        .post('/api/news')
        .send(postData)
        .expect(200);

      expect(response.body.content).toBe(postData.content);
      expect(response.body.authorId).toBe(testUser.id);
      expect(response.body.id).toBeDefined();
      expect(response.body.date).toBeDefined();

      testPost = response.body;
    });
  });

  describe('Messages API - Real Endpoints', () => {
    test('GET /api/messages/:userId should return user messages', async () => {
      if (!testUser) {
        const uniqueEmail = `test${Date.now()}@example.com`;
        const newUser = {
          firstName: 'Message',
          lastName: 'Test',
          email: uniqueEmail,
          password: 'password123',
          birthDate: '1990-01-01'
        };

        const response = await request(BASE_URL)
          .post('/api/users/register')
          .send(newUser)
          .expect(200);

        testUser = response.body;
      }

      const response = await request(BASE_URL)
        .get(`/api/messages/${testUser.id}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    test('POST /api/messages should send message', async () => {
      if (!testFriend) {
        const friendEmail = `friend${Date.now()}@example.com`;
        const friendUser = {
          firstName: 'Message',
          lastName: 'Friend',
          email: friendEmail,
          password: 'password123',
          birthDate: '1992-01-01'
        };

        const response = await request(BASE_URL)
          .post('/api/users/register')
          .send(friendUser)
          .expect(200);

        testFriend = response.body;
      }

      const messageData = {
        senderId: testUser.id,
        recipientId: testFriend.id,
        content: `Test message ${Date.now()}`
      };

      const response = await request(BASE_URL)
        .post('/api/messages')
        .send(messageData)
        .expect(200);

      expect(response.body.content).toBe(messageData.content);
      expect(response.body.user_id).toBe(testUser.id);
      expect(response.body.recipient_id).toBe(testFriend.id);
      expect(response.body.id).toBeDefined();
      expect(response.body.date).toBeDefined();

      testMessage = response.body;
    });
  });

  describe('Profile API - Real Endpoints', () => {
    test('PUT /api/users/:id/profile should update user profile', async () => {
      if (!testUser) {
        const uniqueEmail = `test${Date.now()}@example.com`;
        const newUser = {
          firstName: 'Profile',
          lastName: 'Test',
          email: uniqueEmail,
          password: 'password123',
          birthDate: '1990-01-01'
        };

        const response = await request(BASE_URL)
          .post('/api/users/register')
          .send(newUser)
          .expect(200);

        testUser = response.body;
      }

      const updateData = {
        firstName: 'UpdatedFirstName',
        lastName: 'UpdatedLastName',
        email: testUser.email, // Оставляем тот же email
        birthDate: '1995-01-01'
      };

      const response = await request(BASE_URL)
        .put(`/api/users/${testUser.id}/profile`)
        .send(updateData)
        .expect(200);

      expect(response.body.firstName).toBe(updateData.firstName);
      expect(response.body.lastName).toBe(updateData.lastName);
      expect(response.body.birthDate).toBe(updateData.birthDate);
    });
  });

  describe('Error Handling - Real Endpoints', () => {
    test('Should handle invalid JSON gracefully', async () => {
      // Ваш сервер возвращает 400 для невалидного JSON, что корректно
      await request(BASE_URL)
        .post('/api/users/register')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400); // Сервер возвращает 400 для невалидного JSON
    });
  });

  describe('Static Files Serving', () => {
    test('Should serve Angular app', async () => {
      await request(BASE_URL)
        .get('/')
        .expect(200)
        .expect('Content-Type', /html/);
    });

    test('Should serve admin panel', async () => {
      await request(BASE_URL)
        .get('/admin-panel')
        .expect(200)
        .expect('Content-Type', /html/);
    });
  });
});
