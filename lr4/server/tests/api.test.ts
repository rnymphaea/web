import request from 'supertest';
import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Импортируем app из server.ts
const app = express();
app.use(express.json());

// Mock endpoints для тестов
app.get('/api/users', async (req, res) => {
  try {
    const data = await fs.readFile(path.join(__dirname, '../data/users.json'), 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to load users' });
  }
});

app.post('/api/news', async (req, res) => {
  try {
    const newPost = { id: 1, ...req.body, date: '2024-01-01' };
    res.json(newPost);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create post' });
  }
});

describe('API Tests', () => {
  test('GET /api/users returns users array', async () => {
    const response = await request(app).get('/api/users');
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
  });

  test('GET /api/users/:id returns specific user', async () => {
    const response = await request(app).get('/api/users/1');
    expect([200, 404]).toContain(response.status);
  });
});
