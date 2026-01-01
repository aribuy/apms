const validateBody = (schema, options = {}) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: options.stripUnknown ?? true
  });

  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: error.details.map((detail) => detail.message)
    });
  }

  req.body = value;
  return next();
};

module.exports = { validateBody };
