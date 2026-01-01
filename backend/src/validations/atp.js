const Joi = require('joi');

const atpSubmitSchema = Joi.object({
  site_id: Joi.string().min(2).max(100).optional(),
  siteId: Joi.string().min(2).max(100).optional(),
  document_type: Joi.string().min(1).max(50).optional(),
  documentType: Joi.string().min(1).max(50).optional(),
  category: Joi.string().min(1).max(50).optional(),
  template_id: Joi.string().optional(),
  templateId: Joi.string().optional(),
  submission_notes: Joi.string().allow('', null).optional(),
  submissionNotes: Joi.string().allow('', null).optional()
});

const punchlistItemSchema = Joi.object({
  description: Joi.string().allow('', null).optional(),
  issue_description: Joi.string().allow('', null).optional(),
  issue: Joi.string().allow('', null).optional(),
  severity: Joi.string().allow('', null).optional(),
  issue_severity: Joi.string().allow('', null).optional(),
  category: Joi.string().allow('', null).optional(),
  issue_category: Joi.string().allow('', null).optional(),
  assigned_team: Joi.string().allow('', null).optional(),
  assignedTeam: Joi.string().allow('', null).optional()
});

const atpReviewSchema = Joi.object({
  stageId: Joi.string().required(),
  decision: Joi.string().valid('approve', 'approve_with_punchlist', 'reject').insensitive().required(),
  comments: Joi.string().allow('', null).optional(),
  checklistItems: Joi.array().items(
    Joi.object({
      item_number: Joi.string().allow('', null).optional(),
      section_name: Joi.string().allow('', null).optional(),
      description: Joi.string().allow('', null).optional(),
      result: Joi.string().valid('pass', 'fail', 'na').allow('', null).optional(),
      severity: Joi.string().allow('', null).optional(),
      has_issue: Joi.boolean().optional(),
      issue_description: Joi.string().allow('', null).optional(),
      reviewer_notes: Joi.string().allow('', null).optional()
    })
  ).optional(),
  punchlistItems: Joi.array().items(punchlistItemSchema).optional(),
  punchlist_items: Joi.array().items(punchlistItemSchema).optional()
});

module.exports = {
  atpSubmitSchema,
  atpReviewSchema
};
