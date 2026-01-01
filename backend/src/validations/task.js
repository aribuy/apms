const Joi = require('joi');

const taskCreateSchema = Joi.object({
  site_id: Joi.string().required(),
  task_type: Joi.string().min(2).max(50).required(),
  title: Joi.string().min(2).max(200).required(),
  description: Joi.string().allow('', null).optional(),
  assigned_to: Joi.string().allow('', null).optional(),
  workflow_type: Joi.string().allow('', null).optional(),
  stage_number: Joi.number().integer().min(1).optional(),
  priority: Joi.string().allow('', null).optional(),
  sla_deadline: Joi.string().allow('', null).optional(),
  parent_task_id: Joi.string().allow('', null).optional(),
  depends_on: Joi.string().allow('', null).optional(),
  task_data: Joi.object().optional(),
  workspaceId: Joi.string().uuid().optional(),
  workspace_id: Joi.string().uuid().optional()
});

const taskUpdateSchema = Joi.object({
  site_id: Joi.string().optional(),
  task_type: Joi.string().min(2).max(50).optional(),
  title: Joi.string().min(2).max(200).optional(),
  description: Joi.string().allow('', null).optional(),
  assigned_to: Joi.string().allow('', null).optional(),
  workflow_type: Joi.string().allow('', null).optional(),
  stage_number: Joi.number().integer().min(1).optional(),
  priority: Joi.string().allow('', null).optional(),
  sla_deadline: Joi.string().allow('', null).optional(),
  parent_task_id: Joi.string().allow('', null).optional(),
  depends_on: Joi.string().allow('', null).optional(),
  task_data: Joi.object().optional(),
  workspaceId: Joi.string().uuid().optional(),
  workspace_id: Joi.string().uuid().optional(),
  started_at: Joi.string().allow('', null).optional(),
  completed_at: Joi.string().allow('', null).optional()
});

module.exports = {
  taskCreateSchema,
  taskUpdateSchema
};
