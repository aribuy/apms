const Joi = require('joi');

const siteItemSchema = Joi.object({
  siteId: Joi.string().min(2).max(100).required(),
  siteName: Joi.string().min(2).max(255).required(),
  region: Joi.string().min(1).max(100).required(),
  city: Joi.string().min(1).max(100).required(),
  siteType: Joi.string().allow('', null).optional(),
  scope: Joi.string().allow('', null).optional(),
  status: Joi.string().allow('', null).optional(),
  neLatitude: Joi.number().optional(),
  neLongitude: Joi.number().optional(),
  feLatitude: Joi.number().optional(),
  feLongitude: Joi.number().optional(),
  atpRequired: Joi.alternatives().try(Joi.boolean(), Joi.string()).optional(),
  atp_required: Joi.alternatives().try(Joi.boolean(), Joi.string()).optional(),
  atpType: Joi.string().allow('', null).optional(),
  atp_type: Joi.string().allow('', null).optional(),
  workflowStage: Joi.string().allow('', null).optional(),
  workspaceId: Joi.string().uuid().optional()
});

const siteBulkCreateSchema = Joi.object({
  sites: Joi.array().items(siteItemSchema).min(1).required(),
  workspaceId: Joi.string().uuid().optional(),
  workspace_id: Joi.string().uuid().optional()
});

const siteBulkUpdateSchema = Joi.object({
  sites: Joi.array().items(
    Joi.object({
      siteId: Joi.string().min(2).max(100).required(),
      siteName: Joi.string().min(2).max(255).optional(),
      region: Joi.string().min(1).max(100).optional(),
      city: Joi.string().min(1).max(100).optional()
    })
  ).min(1).required(),
  workspaceId: Joi.string().uuid().optional(),
  workspace_id: Joi.string().uuid().optional()
});

const siteUpdateSchema = Joi.object({
  siteName: Joi.string().min(2).max(255).optional(),
  scope: Joi.string().allow('', null).optional(),
  region: Joi.string().min(1).max(100).optional(),
  city: Joi.string().min(1).max(100).optional(),
  status: Joi.string().allow('', null).optional(),
  atpType: Joi.string().allow('', null).optional(),
  workflowStage: Joi.string().allow('', null).optional(),
  neLatitude: Joi.number().optional(),
  neLongitude: Joi.number().optional(),
  feLatitude: Joi.number().optional(),
  feLongitude: Joi.number().optional(),
  workspaceId: Joi.string().uuid().optional()
}).unknown(true);

const siteDuplicateCheckSchema = Joi.object({
  sites: Joi.array().items(
    Joi.object({
      siteId: Joi.string().min(2).max(100).required()
    })
  ).min(1).required()
});

module.exports = {
  siteBulkCreateSchema,
  siteBulkUpdateSchema,
  siteUpdateSchema,
  siteDuplicateCheckSchema
};
