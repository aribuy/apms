jest.mock('express-rate-limit', () => jest.fn((options) => options), { virtual: true });

const rateLimit = require('express-rate-limit');

describe('rateLimiter middleware config', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('builds login limiter with expected defaults', () => {
    const { loginLimiter } = require('../../src/middleware/rateLimiter');

    expect(rateLimit).toHaveBeenCalled();
    expect(loginLimiter).toMatchObject({
      windowMs: 15 * 60 * 1000,
      max: 10,
      standardHeaders: true,
      legacyHeaders: false,
      message: { success: false, error: 'Too many login attempts, please try again later.' }
    });
  });

  it('builds workspace member limiter with expected defaults', () => {
    const { workspaceMemberLimiter } = require('../../src/middleware/rateLimiter');

    expect(workspaceMemberLimiter).toMatchObject({
      windowMs: 60 * 60 * 1000,
      max: 30,
      standardHeaders: true,
      legacyHeaders: false,
      message: { success: false, error: 'Too many member management attempts, please try again later.' }
    });
  });
});
