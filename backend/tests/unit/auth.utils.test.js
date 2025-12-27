// Unit Tests for Authentication Utilities
const { generateToken, verifyToken, hashPassword } = require('../../src/utils/auth.utils');

describe('Authentication Utilities', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@apms.com',
    role: 'Administrator'
  };

  describe('generateToken()', () => {
    it('should generate a valid JWT token', () => {
      const token = generateToken(mockUser);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should include user data in token payload', () => {
      const token = generateToken(mockUser);
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());

      expect(payload.id).toBe(mockUser.id);
      expect(payload.email).toBe(mockUser.email);
      expect(payload.role).toBe(mockUser.role);
    });

    it('should set appropriate expiration time', () => {
      const token = generateToken(mockUser, '1h');
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());

      expect(payload.exp).toBeDefined();
      expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });
  });

  describe('verifyToken()', () => {
    it('should verify a valid token', () => {
      const token = generateToken(mockUser);
      const decoded = verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.id).toBe(mockUser.id);
      expect(decoded.email).toBe(mockUser.email);
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => {
        verifyToken(invalidToken);
      }).toThrow();
    });

    it('should throw error for expired token', () => {
      const expiredToken = generateToken(mockUser, '-1h'); // Expired

      expect(() => {
        verifyToken(expiredToken);
      }).toThrow();
    });
  });

  describe('hashPassword()', () => {
    it('should hash password successfully', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(typeof hash).toBe('string');
    });

    it('should generate different hash for same password', async () => {
      const password = 'TestPassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });

    it('should produce hash with correct format', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);

      // bcrypt hash format: $2b$[cost]$[hash]
      expect(hash).toMatch(/^\$2[aby]\$\d+\$/);
    });
  });
});
