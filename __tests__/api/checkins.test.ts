import { createMocks } from 'node-mocks-http';
import handler from '@/app/api/checkins/route';

describe('/api/checkins', () => {
  it('handles GET request', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await handler(req, res);
    expect(res._getStatusCode()).toBe(200);
  });

  it('handles authentication', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      headers: {
        authorization: 'Bearer invalid-token',
      },
    });

    await handler(req, res);
    expect(res._getStatusCode()).toBe(401);
  });

  it('handles errors gracefully', async () => {
    // Test error scenarios
  });
});
