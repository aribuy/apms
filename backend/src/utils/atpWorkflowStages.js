// ATP Workflow Stages Configuration
// Complete multi-level approval flow for different ATP types

const ATP_WORKFLOW_STAGES = {
  SOFTWARE: [
    { stage: 'REGISTERED', description: 'Site registered, ATP required' },
    { stage: 'ATP_PENDING', description: 'Waiting for ATP document submission' },
    { stage: 'ATP_SUBMITTED', description: 'ATP document submitted, pending review' },
    { stage: 'BO_REVIEW_L1', description: 'Business Operations Review (Level 1)', role: 'BO', sla_hours: 48 },
    { stage: 'SME_REVIEW_L2', description: 'SME Technical Review (Level 2)', role: 'SME', sla_hours: 48 },
    { stage: 'HEAD_NOC_REVIEW_L3', description: 'Head NOC Final Review (Level 3)', role: 'HEAD_NOC', sla_hours: 24 },
    { stage: 'APPROVED', description: 'ATP fully approved' },
    { stage: 'REJECTED', description: 'ATP rejected, requires resubmission' }
  ],

  HARDWARE: [
    { stage: 'REGISTERED', description: 'Site registered, ATP required' },
    { stage: 'ATP_PENDING', description: 'Waiting for ATP document submission' },
    { stage: 'ATP_SUBMITTED', description: 'ATP document submitted, pending review' },
    { stage: 'FOP_RTS_REVIEW_L1', description: 'FOP/RTS Field Review (Level 1)', role: 'FOP_RTS', sla_hours: 48 },
    { stage: 'REGION_REVIEW_L2', description: 'Region Team Review (Level 2)', role: 'REGION_TEAM', sla_hours: 48 },
    { stage: 'RTH_REVIEW_L3', description: 'RTH Final Approval (Level 3)', role: 'RTH', sla_hours: 24 },
    { stage: 'APPROVED', description: 'ATP fully approved' },
    { stage: 'REJECTED', description: 'ATP rejected, requires resubmission' }
  ],

  BOTH: [
    { stage: 'REGISTERED', description: 'Site registered, ATP required' },
    { stage: 'ATP_PENDING', description: 'Waiting for ATP document submission' },
    { stage: 'ATP_SUBMITTED', description: 'ATP document submitted, pending review' },
    { stage: 'BO_REVIEW_L1', description: 'Business Operations Review (Level 1)', role: 'BO', sla_hours: 48 },
    { stage: 'FOP_RTS_REVIEW_L1', description: 'FOP/RTS Field Review (Level 1)', role: 'FOP_RTS', sla_hours: 48 },
    { stage: 'SME_REVIEW_L2', description: 'SME Technical Review (Level 2)', role: 'SME', sla_hours: 48 },
    { stage: 'REGION_REVIEW_L2', description: 'Region Team Review (Level 2)', role: 'REGION_TEAM', sla_hours: 48 },
    { stage: 'FINAL_REVIEW_L3', description: 'Final Combined Review (Level 3)', role: 'HEAD_NOC', sla_hours: 24 },
    { stage: 'APPROVED', description: 'ATP fully approved' },
    { stage: 'REJECTED', description: 'ATP rejected, requires resubmission' }
  ]
};

// Helper functions
const getWorkflowStages = (atpType) => {
  return ATP_WORKFLOW_STAGES[atpType] || ATP_WORKFLOW_STAGES.BOTH;
};

const getNextStage = (currentStage, atpType) => {
  const stages = getWorkflowStages(atpType);
  const currentIndex = stages.findIndex(s => s.stage === currentStage);
  return currentIndex >= 0 && currentIndex < stages.length - 1 
    ? stages[currentIndex + 1] 
    : null;
};

const getPreviousStage = (currentStage, atpType) => {
  const stages = getWorkflowStages(atpType);
  const currentIndex = stages.findIndex(s => s.stage === currentStage);
  return currentIndex > 0 ? stages[currentIndex - 1] : null;
};

const getStageInfo = (stage, atpType) => {
  const stages = getWorkflowStages(atpType);
  return stages.find(s => s.stage === stage);
};

const isApprovalStage = (stage) => {
  return stage.includes('_REVIEW_') || stage === 'FINAL_REVIEW_L3';
};

const getApprovalLevel = (stage) => {
  if (stage.includes('_L1')) return 1;
  if (stage.includes('_L2')) return 2;
  if (stage.includes('_L3')) return 3;
  return 0;
};

const getStageProgress = (currentStage, atpType) => {
  const stages = getWorkflowStages(atpType);
  const currentIndex = stages.findIndex(s => s.stage === currentStage);
  return {
    current: currentIndex + 1,
    total: stages.length,
    percentage: Math.round(((currentIndex + 1) / stages.length) * 100)
  };
};

module.exports = {
  ATP_WORKFLOW_STAGES,
  getWorkflowStages,
  getNextStage,
  getPreviousStage,
  getStageInfo,
  isApprovalStage,
  getApprovalLevel,
  getStageProgress
};