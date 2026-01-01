const Joi = require('joi');

const templateItemSchema = Joi.object({
  description: Joi.string().allow('', null).optional(),
  severity: Joi.string().allow('', null).optional(),
  evidence_type: Joi.string().allow('', null).optional(),
  scope: Joi.array().items(Joi.string()).optional(),
  instructions: Joi.string().allow('', null).optional(),
  reference_photo: Joi.string().allow('', null).optional()
}).unknown(true);

const templateSectionSchema = Joi.object({
  section_name: Joi.string().allow('', null).optional(),
  description: Joi.string().allow('', null).optional(),
  items: Joi.array().items(templateItemSchema).optional()
}).unknown(true);

const templateCreateSchema = Joi.object({
  template_name: Joi.string().min(2).max(255).required(),
  category: Joi.string().min(1).max(100).required(),
  version: Joi.string().allow('', null).optional(),
  scope: Joi.array().items(Joi.string()).optional(),
  sections: Joi.array().items(templateSectionSchema).optional()
}).unknown(true);

const templateUpdateSchema = Joi.object({
  template_name: Joi.string().min(2).max(255).optional(),
  category: Joi.string().min(1).max(100).optional(),
  version: Joi.string().allow('', null).optional(),
  scope: Joi.array().items(Joi.string()).optional(),
  sections: Joi.array().items(templateSectionSchema).optional(),
  is_active: Joi.boolean().optional()
}).unknown(true);

const templatePhotoSchema = Joi.object({
  reference_photo: Joi.string().allow('', null).required()
});

module.exports = {
  templateCreateSchema,
  templateUpdateSchema,
  templatePhotoSchema
};
