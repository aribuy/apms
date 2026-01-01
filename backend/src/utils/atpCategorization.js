// ATP Document Auto-Categorization Utility (v2 - Filename-based)
// Analyzes ATP documents to determine if they are Hardware or Software ATP
// Using filename analysis + optional PDF content analysis

const logger = require('./logger');

/**
 * Categorize ATP document from filename (primary method)
 * Fast and accurate for current naming convention
 * @param {string} filename - Original filename
 * @returns {Object} Categorization result
 */
const categorizeFromFilename = (filename) => {
  const lowerFilename = filename.toLowerCase();

  // Category indicators (filename-specific)
  const softwareIndicators = {
    'sw license': 100,
    'sw lic': 100,
    'sw licen': 100,
    'license ug': 90,
    'ug bw': 80,
    'bw ug': 80,
    ' ug ': 50,
    ' bw ': 50,
    'modulation': 70,
    'modulations': 70,
    'software': 60,
    'license': 60
  };

  const plnIndicators = {
    'pln': 100,
    'power': 80,
    'rectifier': 60,
    'battery': 60
  };

  const dismantleDropIndicators = {
    'dismantle drop': 120,
    'dismantle-drop': 120,
    'drop': 50
  };

  const dismantleKeepIndicators = {
    'dismantle keep': 120,
    'dismantle-keep': 120,
    'keep': 50
  };

  const ranMwIndicators = {
    'ran': 80,
    'mw': 60,
    'microwave': 80,
    'reroute': 70,
    'upgrade': 60,
    'new': 40
  };

  let softwareScore = 0;
  let plnScore = 0;
  let dismantleDropScore = 0;
  let dismantleKeepScore = 0;
  let ranMwScore = 0;

  // Check category indicators
  Object.keys(softwareIndicators).forEach(kw => {
    if (lowerFilename.includes(kw)) {
      softwareScore += softwareIndicators[kw];
    }
  });

  Object.keys(plnIndicators).forEach(kw => {
    if (lowerFilename.includes(kw)) {
      plnScore += plnIndicators[kw];
    }
  });

  Object.keys(dismantleDropIndicators).forEach(kw => {
    if (lowerFilename.includes(kw)) {
      dismantleDropScore += dismantleDropIndicators[kw];
    }
  });

  Object.keys(dismantleKeepIndicators).forEach(kw => {
    if (lowerFilename.includes(kw)) {
      dismantleKeepScore += dismantleKeepIndicators[kw];
    }
  });

  Object.keys(ranMwIndicators).forEach(kw => {
    if (lowerFilename.includes(kw)) {
      ranMwScore += ranMwIndicators[kw];
    }
  });

  // Determine category
  let category;
  let confidence;

  const maxScore = Math.max(softwareScore, plnScore, dismantleDropScore, dismantleKeepScore, ranMwScore);

  if (maxScore === 0 && lowerFilename.includes('atp')) {
    category = 'RAN_MW';
    confidence = 0.5;
  } else if (maxScore === softwareScore) {
    category = 'SOFTWARE_LICENSE';
    confidence = Math.min(softwareScore / (softwareScore + ranMwScore + plnScore + dismantleDropScore + dismantleKeepScore + 1), 0.95);
  } else if (maxScore === plnScore) {
    category = 'PLN_UPGRADE';
    confidence = 0.9;
  } else if (maxScore === dismantleDropScore) {
    category = 'DISMANTLE_DROP';
    confidence = 0.9;
  } else if (maxScore === dismantleKeepScore) {
    category = 'DISMANTLE_KEEP';
    confidence = 0.9;
  } else if (maxScore === ranMwScore) {
    category = 'RAN_MW';
    confidence = 0.7;
  } else {
    category = 'UNKNOWN';
    confidence = 0;
  }

  return {
    category,
    confidence,
    scores: {
      software: softwareScore,
      pln: plnScore,
      dismantleDrop: dismantleDropScore,
      dismantleKeep: dismantleKeepScore,
      ranMw: ranMwScore,
      filename: {
        software: softwareScore,
        pln: plnScore,
        dismantleDrop: dismantleDropScore,
        dismantleKeep: dismantleKeepScore,
        ranMw: ranMwScore
      }
    },
    method: 'filename_analysis'
  };
};

/**
 * Categorize ATP document (main function)
 * Uses filename analysis as primary method
 * PDF content analysis available but not used by default (faster)
 * @param {string} filePath - Full path to PDF file
 * @param {string} filename - Original filename
 * @returns {Promise<Object>} Categorization result with category and confidence
 */
const categorizeATPDocument = async (filePath, filename) => {
  try {
    // Primary method: Filename analysis (fast and accurate)
    const result = categorizeFromFilename(filename);

    // Optional: PDF content analysis (commented out for performance)
    // Can be enabled if needed for ambiguous cases
    /*
    if (result.confidence < 0.7) {
      // Need deeper analysis - parse PDF content
      const contentResult = await categorizeFromPDFContent(filePath, filename);

      // Combine results (weighted)
      if (contentResult.confidence > result.confidence) {
        return contentResult;
      }
    }
    */

    return result;

  } catch (error) {
    logger.error({ err: error }, 'Error categorizing ATP document');
    return {
      category: 'UNKNOWN',
      confidence: 0,
      error: error.message,
      method: 'error'
    };
  }
};

/**
/**
 * Quick categorization from filename only (fallback method)
 * @param {string} filename - Original filename
 * @returns {Object} Quick categorization result
 */
const quickCategorize = (filename) => {
  return categorizeFromFilename(filename);
};

/**
 * Get workflow stages for a given ATP category
 * @param {string} category - ATP category
 * @returns {Array} Array of stage names
 */
const getWorkflowStages = (category) => {
  const workflows = {
    'RAN_MW': ['FOP_RTS', 'REGION_TEAM', 'RTH'],
    'PLN_UPGRADE': ['ROH', 'RTH'],
    'DISMANTLE_DROP': ['FOP_RTS', 'REGION_TEAM', 'PMO'],
    'DISMANTLE_KEEP': ['ROH', 'RTH'],
    'SOFTWARE_LICENSE': ['BO', 'SME', 'HEAD_NOC']
  };

  return workflows[category] || [];
};

/**
 * Calculate SLA deadline for a workflow stage
 * @param {string} stage - Stage name
 * @param {Date} submissionDate - Submission date (optional)
 * @returns {Date|number} Deadline date or hours
 */
const calculateSLADeadline = (stage, submissionDate = null) => {
  const slaHours = {
    'BO': 48,
    'SME': 48,
    'HEAD_NOC': 24,
    'FOP_RTS': 48,
    'REGION_TEAM': 48,
    'RTH': 24,
    'ROH': 48,
    'PMO': 48
  };

  const hours = slaHours[stage] || 48;

  if (submissionDate instanceof Date) {
    const deadline = new Date(submissionDate);
    deadline.setHours(deadline.getHours() + hours);
    return deadline;
  }

  return hours;
};

module.exports = {
  categorizeATPDocument,
  categorizeFromFilename,
  quickCategorize,
  getWorkflowStages,
  calculateSLADeadline
};
