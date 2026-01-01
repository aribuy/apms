jest.mock('jsonwebtoken', () => ({
  verify: jest.fn()
}));
jest.mock('../../src/utils/logger', () => ({
  warn: jest.fn()
}));

const jwt = require('jsonwebtoken');
const logger = require('../../src/utils/logger');
const { authenticateToken } = require('../../src/middleware/auth');

const createReq = (authorization) => ({
  headers: authorization ? { authorization } : {}
});

describe('authenticateToken middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sets req.user when token is valid', () => {
    const req = createReq('Bearer test-token');
    const res = {};
    const next = jest.fn();
    jwt.verify.mockReturnValue({ id: 'user-1', role: 'ADMIN' });

    authenticateToken(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('test-token', expect.any(String));
    expect(req.user).toEqual({ id: 'user-1', role: 'ADMIN' });
    expect(next).toHaveBeenCalled();
  });

  it('skips when no authorization header', () => {
    const req = createReq();
    const res = {};
    const next = jest.fn();

    authenticateToken(req, res, next);

    expect(jwt.verify).not.toHaveBeenCalled();
    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });

  it('handles invalid token and continues', () => {
    const req = createReq('Bearer bad-token');
    const res = {};
    const next = jest.fn();
    jwt.verify.mockImplementation(() => {
      throw new Error('invalid token');
    });

    authenticateToken(req, res, next);

    expect(logger.warn).toHaveBeenCalled();
    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });
});
