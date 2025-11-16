import request from 'supertest';
import { app } from './app-export.js';


describe('Registration API', () => {
  test('POST /api/registrationUser should create new user', async () => {
    const newUser = {
      data: {
        firstName: "Test",
        lastName: "User",
        middleName: "Testovich",
        birthday: "2000-01-01",
        email: "test@example.com"
      }
    };

    const response = await request(app)
      .post('/api/registrationUser')
      .send(newUser)
      .expect(200);
    
    expect(response.body).toHaveProperty('user');
    expect(response.body.user).toHaveProperty('id');
    expect(response.body.user.email).toBe('test@example.com');
  });
});

describe('Login API', () => {
  test('POST /api/loginUser should login', async () => {
    const user = {
        email: "test@example.com"
    };

    const response = await request(app)
      .post('/api/loginUser')
      .send(user)
      .expect(200);
    
    expect(response.body).toHaveProperty('user');
    expect(response.body.user).toHaveProperty('id');
    expect(response.body.user.email).toBe('test@example.com');
  });
});