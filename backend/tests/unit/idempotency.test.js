const { idempotencyCheck } = require('../../src/middleware/idempotency');

describe('idempotencyCheck middleware', () => {
  it('calls next without side effects', () => {
    const req = {};
    const res = {};
    const next = jest.fn();

    idempotencyCheck(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
