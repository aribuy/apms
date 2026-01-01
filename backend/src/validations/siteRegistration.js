const Joi = require('joi');

const atpRequirementsSchema = Joi.object({
  software: Joi.boolean().optional(),
  hardware: Joi.boolean().optional()
}).optional();

const siteRegistrationSchema = Joi.object({
  customerSiteId: Joi.string().min(2).max(100).required(),
  customerSiteName: Joi.string().min(2).max(255).required(),
  neTowerId: Joi.string().allow('', null).optional(),
  neTowerName: Joi.string().allow('', null).optional(),
  feTowerId: Joi.string().allow('', null).optional(),
  feTowerName: Joi.string().allow('', null).optional(),
  neLatitude: Joi.number().required(),
  neLongitude: Joi.number().required(),
  feLatitude: Joi.number().required(),
  feLongitude: Joi.number().required(),
  region: Joi.string().min(1).max(100).required(),
  coverageArea: Joi.string().allow('', null).optional(),
  activityFlow: Joi.string().allow('', null).optional(),
  sowCategory: Joi.string().allow('', null).optional(),
  projectCode: Joi.string().allow('', null).optional(),
  frequencyBand: Joi.string().allow('', null).optional(),
  linkCapacity: Joi.string().allow('', null).optional(),
  antennaSize: Joi.string().allow('', null).optional(),
  equipmentType: Joi.string().allow('', null).optional(),
  atpRequirements: atpRequirementsSchema
});

const siteValidateSchema = Joi.object({
  customerSiteId: Joi.string().min(2).max(100).required(),
  coordinates: Joi.object({
    neLatitude: Joi.number().required(),
    neLongitude: Joi.number().required(),
    feLatitude: Joi.number().required(),
    feLongitude: Joi.number().required()
  }).optional()
});

const atpRequirementsLookupSchema = Joi.object({
  activityFlow: Joi.string().allow('', null).optional()
});

module.exports = {
  siteRegistrationSchema,
  siteValidateSchema,
  atpRequirementsLookupSchema
};
