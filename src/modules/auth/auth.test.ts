import request from 'supertest';
import app from '../../app';

describe('Auth Module', () => {
  describe('POST /api/auth/register', () => {
    it('should validate required fields', async () => {
      const response = await request(app).post('/api/auth/register').send({});

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });

    it('should validate email format', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'invalid-email',
        username: 'testuser',
        password: 'password123',
      });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });

    it('should validate username length', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'test@example.com',
        username: 'ab',
        password: 'password123',
      });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });

    it('should validate password length', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'test@example.com',
        username: 'testuser',
        password: 'short',
      });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should validate required fields', async () => {
      const response = await request(app).post('/api/auth/login').send({});

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });

    it('should validate email format', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'invalid-email',
        password: 'password123',
      });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should require authentication', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should require refresh token cookie', async () => {
      const response = await request(app).post('/api/auth/refresh').send({});

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('No refresh token provided');
    });
  });
});
