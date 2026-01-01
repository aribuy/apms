const Joi = require('joi');

const taskHistoryLogSchema = Joi.object({
  site_id: Joi.string().required(),
  task_id: Joi.string().required(),
  event_type: Joi.string().required(),
  event_description: Joi.string().required(),
  old_status: Joi.string().allow('', null).optional(),
  new_status: Joi.string().allow('', null).optional(),
  decision: Joi.string().allow('', null).optional(),
  decision_comments: Joi.string().allow('', null).optional(),
  workflow_stage: Joi.string().allow('', null).optional(),
  performed_by: Joi.string().allow('', null).optional(),
  metadata: Joi.object().optional()
}).unknown(true);

module.exports = {
  taskHistoryLogSchema
};
