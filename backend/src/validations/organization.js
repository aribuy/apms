const Joi = require('joi');

const organizationCreateSchema = Joi.object({
  name: Joi.string().min(2).max(200).required(),
  code: Joi.string().min(2).max(50).required(),
  type: Joi.string().allow('', null).optional(),
  status: Joi.string().allow('', null).optional(),
  contactEmail: Joi.string().email().allow('', null).optional(),
  contactPhone: Joi.string().allow('', null).optional(),
  address: Joi.string().allow('', null).optional()
});

const organizationUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(200).optional(),
  code: Joi.string().min(2).max(50).optional(),
  type: Joi.string().allow('', null).optional(),
  status: Joi.string().allow('', null).optional(),
  contactEmail: Joi.string().email().allow('', null).optional(),
  contactPhone: Joi.string().allow('', null).optional(),
  address: Joi.string().allow('', null).optional()
});

module.exports = {
  organizationCreateSchema,
  organizationUpdateSchema
};
