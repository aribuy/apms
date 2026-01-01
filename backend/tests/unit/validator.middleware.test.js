const { validateBody } = require('../../src/middleware/validator');

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('validateBody middleware', () => {
  it('passes through and replaces req.body with validated value', () => {
    const schema = {
      validate: jest.fn().mockReturnValue({ value: { name: 'test' } })
    };
    const req = { body: { name: 'test', extra: 'ignore' } };
    const res = makeRes();
    const next = jest.fn();

    validateBody(schema)(req, res, next);

    expect(schema.validate).toHaveBeenCalled();
    expect(req.body).toEqual({ name: 'test' });
    expect(next).toHaveBeenCalled();
  });

  it('returns 400 with validation details on error', () => {
    const schema = {
      validate: jest.fn().mockReturnValue({
        error: { details: [{ message: '"name" is required' }] }
      })
    };
    const req = { body: {} };
    const res = makeRes();
    const next = jest.fn();

    validateBody(schema)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Validation error',
      details: ['"name" is required']
    });
    expect(next).not.toHaveBeenCalled();
  });
});
