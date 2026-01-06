import request from 'supertest';
import app from './app';

describe('App', () => {
  describe('GET /health', () => {
    it('should return ok status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('GET /unknown', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/unknown');

      expect(response.status).toBe(404);
    });
  });
});
