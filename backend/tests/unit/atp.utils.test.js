// Unit Tests for ATP Workflow Utilities
const {
  categorizeATP,
  calculateSLA,
  getNextStage,
  isATPPending
} = require('../../src/utils/atp.utils');

describe('ATP Workflow Utilities', () => {
  describe('categorizeATP()', () => {
    it('should categorize as SOFTWARE when software keywords present', () => {
      const document = {
        content: 'Software upgrade, installation, configuration',
        metadata: { type: 'software' }
      };

      const category = categorizeATP(document);
      expect(category).toBe('SOFTWARE');
    });

    it('should categorize as HARDWARE when hardware keywords present', () => {
      const document = {
        content: 'Hardware installation, tower, antenna, cable',
        metadata: { type: 'hardware' }
      };

      const category = categorizeATP(document);
      expect(category).toBe('HARDWARE');
    });

    it('should categorize as COMBINED when both types present', () => {
      const document = {
        content: 'Software and hardware installation',
        metadata: { type: 'combined' }
      };

      const category = categorizeATP(document);
      expect(category).toBe('COMBINED');
    });

    it('should return confidence score', () => {
      const document = {
        content: 'Software upgrade',
        metadata: {}
      };

      const result = categorizeATP(document, true);
      expect(result.category).toBe('SOFTWARE');
      expect(result.confidence).toBeGreaterThan(0.7);
    });
  });

  describe('calculateSLA()', () => {
    it('should calculate correct SLA for BO stage', () => {
      const sla = calculateSLA('BO');
      expect(sla).toBe(48); // 48 hours
    });

    it('should calculate correct SLA for SME stage', () => {
      const sla = calculateSLA('SME');
      expect(sla).toBe(48); // 48 hours
    });

    it('should calculate correct SLA for HEAD_NOC stage', () => {
      const sla = calculateSLA('HEAD_NOC');
      expect(sla).toBe(24); // 24 hours
    });

    it('should calculate correct SLA for FOP_RTS stage', () => {
      const sla = calculateSLA('FOP_RTS');
      expect(sla).toBe(48); // 48 hours
    });

    it('should calculate correct SLA for REGION_TEAM stage', () => {
      const sla = calculateSLA('REGION_TEAM');
      expect(sla).toBe(48); // 48 hours
    });

    it('should calculate correct SLA for RTH stage', () => {
      const sla = calculateSLA('RTH');
      expect(sla).toBe(24); // 24 hours
    });

    it('should return deadline date', () => {
      const submissionDate = new Date('2025-12-27T10:00:00Z');
      const deadline = calculateSLA('BO', submissionDate);

      expect(deadline).toBeInstanceOf(Date);
      const hoursDiff = (deadline - submissionDate) / (1000 * 60 * 60);
      expect(hoursDiff).toBe(48);
    });
  });

  describe('getNextStage()', () => {
    it('should return next stage for Software ATP', () => {
      const current = 'BO';
      const next = getNextStage('SOFTWARE', current);
      expect(next).toBe('SME');
    });

    it('should return next stage for Hardware ATP', () => {
      const current = 'FOP_RTS';
      const next = getNextStage('HARDWARE', current);
      expect(next).toBe('REGION_TEAM');
    });

    it('should return null for final stage', () => {
      const next1 = getNextStage('SOFTWARE', 'HEAD_NOC');
      const next2 = getNextStage('HARDWARE', 'RTH');

      expect(next1).toBeNull();
      expect(next2).toBeNull();
    });

    it('should handle Combined ATP stages', () => {
      const stages = ['BO', 'FOP_RTS', 'SME', 'REGION_TEAM', 'HEAD_NOC'];

      let current = stages[0];
      for (let i = 0; i < stages.length - 1; i++) {
        const next = getNextStage('COMBINED', stages[i]);
        expect(next).toBe(stages[i + 1]);
      }
    });
  });

  describe('isATPPending()', () => {
    it('should return true for pending ATP', () => {
      const atp = {
        status: 'pending_review',
        review_stages: [
          { status: 'PENDING' },
          { status: 'PENDING' },
          { status: 'PENDING' }
        ]
      };

      expect(isATPPending(atp)).toBe(true);
    });

    it('should return false for approved ATP', () => {
      const atp = {
        status: 'approved',
        review_stages: [
          { status: 'APPROVED' },
          { status: 'APPROVED' },
          { status: 'APPROVED' }
        ]
      };

      expect(isATPPending(atp)).toBe(false);
    });

    it('should return false for rejected ATP', () => {
      const atp = {
        status: 'rejected',
        review_stages: [
          { status: 'REJECTED' }
        ]
      };

      expect(isATPPending(atp)).toBe(false);
    });

    it('should return true for partially approved ATP', () => {
      const atp = {
        status: 'pending_review',
        review_stages: [
          { status: 'APPROVED' },
          { status: 'PENDING' },
          { status: 'PENDING' }
        ]
      };

      expect(isATPPending(atp)).toBe(true);
    });
  });
});
