const Joi = require('joi');

const workspaceCreateSchema = Joi.object({
  code: Joi.string().min(2).max(10).required(),
  name: Joi.string().min(3).max(100).required(),
  customerGroupId: Joi.string().min(1).required(),
  vendorOwnerId: Joi.string().min(1).required()
});

const workspaceUpdateSchema = Joi.object({
  code: Joi.string().min(2).max(10).optional(),
  name: Joi.string().min(3).max(100).optional(),
  customerGroupId: Joi.string().min(1).optional(),
  vendorOwnerId: Joi.string().min(1).optional(),
  isActive: Joi.boolean().optional()
});

const userWorkspaceCreateSchema = Joi.object({
  workspaceId: Joi.string().uuid().required(),
  role: Joi.string().min(2).max(50).required(),
  isDefault: Joi.boolean().optional()
});

const userWorkspaceUpdateSchema = Joi.object({
  role: Joi.string().min(2).max(50).optional(),
  isDefault: Joi.boolean().optional()
});

const workspaceMemberCreateSchema = Joi.object({
  userId: Joi.string().optional(),
  email: Joi.string().email().optional(),
  role: Joi.string().min(2).max(50).required(),
  isDefault: Joi.boolean().optional()
}).or('userId', 'email');

const workspaceMemberUpdateSchema = Joi.object({
  role: Joi.string().min(2).max(50).optional(),
  isDefault: Joi.boolean().optional()
});

module.exports = {
  workspaceCreateSchema,
  workspaceUpdateSchema,
  userWorkspaceCreateSchema,
  userWorkspaceUpdateSchema,
  workspaceMemberCreateSchema,
  workspaceMemberUpdateSchema
};
