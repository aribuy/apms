// Unit Tests for Validation Utilities
const {
  validateEmail,
  validatePassword,
  validateSiteCode,
  validateATPCode
} = require('../../src/utils/validation.utils');

describe('Validation Utilities', () => {
  describe('validateEmail()', () => {
    it('should accept valid email addresses', () => {
      const validEmails = [
        'test@apms.com',
        'user.name@domain.co.id',
        'user+tag@example.org'
      ];

      validEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.valid).toBe(true);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid',
        '@example.com',
        'user@',
        'user @example.com',
        '',
        null,
        undefined
      ];

      invalidEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.valid).toBe(false);
      });
    });
  });

  describe('validatePassword()', () => {
    it('should accept strong passwords', () => {
      const strongPasswords = [
        'StrongPass123!',
        'MyP@ssw0rd',
        'Secure#123'
      ];

      strongPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.valid).toBe(true);
      });
    });

    it('should reject weak passwords', () => {
      const weakPasswords = [
        'weak',
        'password',
        '12345678',
        'PASSWORD',
        'Pass1',
        '',
        null
      ];

      weakPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.valid).toBe(false);
      });
    });

    it('should require minimum length of 8 characters', () => {
      const result = validatePassword('Pass1!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should require uppercase letter', () => {
      const result = validatePassword('password1!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should require lowercase letter', () => {
      const result = validatePassword('PASSWORD1!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should require number', () => {
      const result = validatePassword('Password!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should require special character', () => {
      const result = validatePassword('Password123');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });
  });

  describe('validateSiteCode()', () => {
    it('should accept valid site codes', () => {
      const validCodes = [
        'SITE-001',
        'JAK-123',
        'TEST-SITE-456'
      ];

      validCodes.forEach(code => {
        const result = validateSiteCode(code);
        expect(result.valid).toBe(true);
      });
    });

    it('should reject invalid site codes', () => {
      const invalidCodes = [
        '',
        null,
        'SITE',
        '123',
        'A',
        'SITE-001-EXTRA-LONG-CODE'
      ];

      invalidCodes.forEach(code => {
        const result = validateSiteCode(code);
        expect(result.valid).toBe(false);
      });
    });

    it('should enforce minimum and maximum length', () => {
      const tooShort = validateSiteCode('AB');
      const tooLong = validateSiteCode('A'.repeat(51));

      expect(tooShort.valid).toBe(false);
      expect(tooLong.valid).toBe(false);
    });
  });

  describe('validateATPCode()', () => {
    it('should accept valid ATP codes', () => {
      const validCodes = [
        'ATP-2025-001',
        'ATP-SOFT-123',
        'ATP-HARD-456'
      ];

      validCodes.forEach(code => {
        const result = validateATPCode(code);
        expect(result.valid).toBe(true);
      });
    });

    it('should reject invalid ATP codes', () => {
      const invalidCodes = [
        '',
        null,
        'ATP',
        'ATP-',
        'INVALID-123'
      ];

      invalidCodes.forEach(code => {
        const result = validateATPCode(code);
        expect(result.valid).toBe(false);
      });
    });
  });
});
