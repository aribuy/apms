const Joi = require('joi');

const workgroupCreateSchema = Joi.object({
  name: Joi.string().min(2).max(150).required(),
  organizationId: Joi.string().optional(),
  workgroupType: Joi.string().allow('', null).optional(),
  classification: Joi.string().allow('', null).optional(),
  category: Joi.string().allow('', null).optional(),
  maxMembers: Joi.number().integer().min(1).optional(),
  status: Joi.string().allow('', null).optional(),
  email: Joi.string().email().allow('', null).optional()
}).unknown(true);

const workgroupUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(150).optional(),
  organizationId: Joi.string().optional(),
  workgroupType: Joi.string().allow('', null).optional(),
  classification: Joi.string().allow('', null).optional(),
  category: Joi.string().allow('', null).optional(),
  maxMembers: Joi.number().integer().min(1).optional(),
  status: Joi.string().allow('', null).optional(),
  email: Joi.string().email().allow('', null).optional()
}).unknown(true);

const workgroupMemberSchema = Joi.object({
  userId: Joi.string().required(),
  memberRole: Joi.string().allow('', null).optional()
});

module.exports = {
  workgroupCreateSchema,
  workgroupUpdateSchema,
  workgroupMemberSchema
};
