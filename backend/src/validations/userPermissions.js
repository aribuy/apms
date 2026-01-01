const Joi = require('joi');

const permissionSchema = Joi.object({
  roleId: Joi.string().required(),
  moduleId: Joi.string().required(),
  canAccess: Joi.boolean().required()
});

const permissionsUpdateSchema = Joi.object({
  permissions: Joi.array().items(permissionSchema).min(1).required()
});

const userRoleUpdateSchema = Joi.object({
  role: Joi.string().min(2).max(50).required()
});

module.exports = {
  permissionsUpdateSchema,
  userRoleUpdateSchema
};
