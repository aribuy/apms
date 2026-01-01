// ATP Workflow Utilities

/**
 * Categorize ATP document
 */
const categorizeATP = (document, returnConfidence = false) => {
  const content = (document.content + ' ' + (document.metadata?.type || '')).toLowerCase();

  const softwareKeywords = ['software', 'application', 'system', 'program', 'configuration'];
  const hardwareKeywords = ['hardware', 'tower', 'antenna', 'cable', 'equipment', 'infrastructure'];

  const softwareMatches = softwareKeywords.filter(keyword => content.includes(keyword)).length;
  const hardwareMatches = hardwareKeywords.filter(keyword => content.includes(keyword)).length;

  let category;
  let confidence;

  if (softwareMatches > 0 && hardwareMatches > 0) {
    category = 'COMBINED';
    confidence = Math.min(0.6 + (softwareMatches + hardwareMatches) * 0.1, 0.95);
  } else if (softwareMatches > hardwareMatches) {
    category = 'SOFTWARE';
    confidence = Math.min(0.7 + softwareMatches * 0.1, 0.95);
  } else if (hardwareMatches > 0) {
    category = 'HARDWARE';
    confidence = Math.min(0.7 + hardwareMatches * 0.1, 0.95);
  } else {
    category = 'UNKNOWN';
    confidence = 0;
  }

  if (returnConfidence) {
    return { category, confidence };
  }

  return category;
};

/**
 * Calculate SLA deadline
 */
const calculateSLA = (stage, submissionDate = null) => {
  const slaHours = {
    'BO': 48,
    'SME': 48,
    'HEAD_NOC': 24,
    'FOP_RTS': 48,
    'REGION_TEAM': 48,
    'RTH': 24
  };

  const hours = slaHours[stage] || 48;

  // If submissionDate is provided and is a Date, return deadline date
  if (submissionDate instanceof Date) {
    const deadline = new Date(submissionDate);
    deadline.setHours(deadline.getHours() + hours);
    return deadline;
  }

  // Otherwise return hours
  return hours;
};

/**
 * Get next stage in workflow
 */
const getNextStage = (atpType, currentStage) => {
  const workflows = {
    'SOFTWARE': ['BO', 'SME', 'HEAD_NOC'],
    'HARDWARE': ['FOP_RTS', 'REGION_TEAM', 'RTH'],
    'COMBINED': ['BO', 'FOP_RTS', 'SME', 'REGION_TEAM', 'HEAD_NOC']
  };

  const stages = workflows[atpType];
  if (!stages) return null;

  const currentIndex = stages.indexOf(currentStage);
  if (currentIndex === -1 || currentIndex === stages.length - 1) {
    return null;
  }

  return stages[currentIndex + 1];
};

/**
 * Check if ATP is pending
 */
const isATPPending = (atp) => {
  if (!atp || !atp.review_stages) return false;

  const hasPendingStages = atp.review_stages.some(stage => stage.status === 'PENDING');
  const isNotRejected = atp.status !== 'rejected';
  const isNotApproved = atp.status !== 'approved';

  return hasPendingStages && isNotRejected && isNotApproved;
};

module.exports = {
  categorizeATP,
  calculateSLA,
  getNextStage,
  isATPPending
};
