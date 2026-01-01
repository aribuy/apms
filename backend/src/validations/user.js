const Joi = require('joi');

const userCreateSchema = Joi.object({
  email: Joi.string().email().required(),
  username: Joi.string().min(2).max(50).required(),
  name: Joi.string().min(1).max(100).optional(),
  userType: Joi.string().min(2).max(50).optional(),
  status: Joi.string().min(2).max(50).optional(),
  contactNumber: Joi.string().min(3).max(50).optional(),
  role: Joi.string().min(2).max(50).optional()
});

const userUpdateSchema = Joi.object({
  email: Joi.string().email().optional(),
  username: Joi.string().min(2).max(50).optional(),
  name: Joi.string().min(1).max(100).optional(),
  userType: Joi.string().min(2).max(50).optional(),
  status: Joi.string().min(2).max(50).optional(),
  contactNumber: Joi.string().min(3).max(50).optional(),
  role: Joi.string().min(2).max(50).optional()
});

module.exports = {
  userCreateSchema,
  userUpdateSchema
};
