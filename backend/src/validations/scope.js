const Joi = require('joi');

const scopeCreateSchema = Joi.object({
  name: Joi.string().min(2).max(150).required(),
  description: Joi.string().allow('', null).optional()
});

module.exports = {
  scopeCreateSchema
};
