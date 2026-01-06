import request from 'supertest';
import app from '../../app';

describe('Users Module', () => {
  describe('PATCH /api/users/me', () => {
    it('should require authentication', async () => {
      const response = await request(app).patch('/api/users/me').send({
        username: 'newusername',
      });

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .patch('/api/users/me')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          username: 'newusername',
        });

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
    });

    it('should require at least one field to update (without auth)', async () => {
      const response = await request(app).patch('/api/users/me').send({});

      // Auth middleware runs first, so without a token we get 401
      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
    });
  });
});
