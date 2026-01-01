const Joi = require('joi');

const checklistItemSchema = Joi.object({
  item_number: Joi.string().allow('', null).optional(),
  section_name: Joi.string().allow('', null).optional(),
  description: Joi.string().allow('', null).optional(),
  result: Joi.string().allow('', null).optional(),
  severity: Joi.string().allow('', null).optional(),
  has_issue: Joi.boolean().optional(),
  issue_description: Joi.string().allow('', null).optional(),
  reviewer_notes: Joi.string().allow('', null).optional()
});

const punchlistItemSchema = Joi.object({
  test_item_reference: Joi.string().allow('', null).optional(),
  issue_category: Joi.string().allow('', null).optional(),
  issue_description: Joi.string().allow('', null).optional(),
  severity: Joi.string().allow('', null).optional(),
  assigned_team: Joi.string().allow('', null).optional(),
  target_completion_date: Joi.date().optional()
});

const reviewDecisionSchema = Joi.object({
  decision: Joi.string().valid('APPROVE', 'APPROVE_WITH_PUNCHLIST', 'REJECT').required(),
  comments: Joi.string().allow('', null).optional(),
  reviewer_id: Joi.string().allow('', null).optional(),
  checklist_results: Joi.array().items(checklistItemSchema).optional(),
  punchlist_items: Joi.array().items(punchlistItemSchema).optional()
});

const punchlistCompleteSchema = Joi.object({
  rectification_notes: Joi.string().allow('', null).optional(),
  evidence_after: Joi.object().optional(),
  completed_by: Joi.string().allow('', null).optional()
});

const assignReviewerSchema = Joi.object({
  review_stage_ids: Joi.array().items(Joi.string().required()).min(1).required(),
  reviewer_id: Joi.string().required()
});

module.exports = {
  reviewDecisionSchema,
  punchlistCompleteSchema,
  assignReviewerSchema
};
