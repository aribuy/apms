// ATP Workflow Engine - Updated with Document Control & Punchlist Logic

const WORKFLOW_STAGES = {
  // Initial
  DOCUMENT_UPLOAD: 'document_upload',
  SOW_CATEGORIZATION: 'sow_categorization',
  
  // Software Flow
  BO_REVIEW: 'bo_review',
  SME_REVIEW: 'sme_review', 
  HEAD_NOC_REVIEW: 'head_noc_review',
  
  // Hardware Flow
  FOP_RTS_REVIEW: 'fop_rts_review',
  REGION_TEAM_REVIEW: 'region_team_review',
  RTH_REVIEW: 'rth_review',
  
  // Final States
  APPROVED: 'approved',
  PUNCHLIST_RECTIFICATION: 'punchlist_rectification'
};

const PUNCHLIST_SEVERITY = {
  NONE: 'none',
  MINOR: 'minor',
  MAJOR: 'major', 
  CRITICAL: 'critical'
};

const DECISIONS = {
  APPROVE: 'approve',
  APPROVE_WITH_PL: 'approve_with_punchlist',
  REJECT_CRITICAL_PL: 'reject_critical_punchlist',
  RESUBMIT: 'resubmit'
};

class ATPWorkflowEngine {
  
  static getWorkflowPath(category) {
    if (category === 'software' || category === 'MW_UPGRADE') {
      return [
        WORKFLOW_STAGES.DOCUMENT_UPLOAD,
        WORKFLOW_STAGES.SOW_CATEGORIZATION,
        WORKFLOW_STAGES.BO_REVIEW,
        WORKFLOW_STAGES.SME_REVIEW,
        WORKFLOW_STAGES.HEAD_NOC_REVIEW
      ];
    } else {
      return [
        WORKFLOW_STAGES.DOCUMENT_UPLOAD,
        WORKFLOW_STAGES.SOW_CATEGORIZATION,
        WORKFLOW_STAGES.FOP_RTS_REVIEW,
        WORKFLOW_STAGES.REGION_TEAM_REVIEW,
        WORKFLOW_STAGES.RTH_REVIEW
      ];
    }
  }

  static getNextStage(currentStage, decision, punchlistSeverity) {
    // Critical punchlist always returns to rectification
    if (punchlistSeverity === PUNCHLIST_SEVERITY.CRITICAL) {
      return WORKFLOW_STAGES.PUNCHLIST_RECTIFICATION;
    }

    switch (currentStage) {
      case WORKFLOW_STAGES.DOCUMENT_UPLOAD:
        return WORKFLOW_STAGES.SOW_CATEGORIZATION;
        
      case WORKFLOW_STAGES.SOW_CATEGORIZATION:
        // System determines flow based on category
        return null; // Will be set by category logic
        
      // Software Flow
      case WORKFLOW_STAGES.BO_REVIEW:
        if (decision === DECISIONS.APPROVE || decision === DECISIONS.APPROVE_WITH_PL) {
          return WORKFLOW_STAGES.SME_REVIEW;
        }
        return WORKFLOW_STAGES.PUNCHLIST_RECTIFICATION;
        
      case WORKFLOW_STAGES.SME_REVIEW:
        if (decision === DECISIONS.APPROVE || decision === DECISIONS.APPROVE_WITH_PL) {
          return WORKFLOW_STAGES.HEAD_NOC_REVIEW;
        }
        return WORKFLOW_STAGES.PUNCHLIST_RECTIFICATION;
        
      case WORKFLOW_STAGES.HEAD_NOC_REVIEW:
        if (decision === DECISIONS.APPROVE || decision === DECISIONS.APPROVE_WITH_PL) {
          return WORKFLOW_STAGES.APPROVED;
        }
        return WORKFLOW_STAGES.PUNCHLIST_RECTIFICATION;
        
      // Hardware Flow  
      case WORKFLOW_STAGES.FOP_RTS_REVIEW:
        if (decision === DECISIONS.APPROVE || decision === DECISIONS.APPROVE_WITH_PL) {
          return WORKFLOW_STAGES.REGION_TEAM_REVIEW;
        }
        return WORKFLOW_STAGES.PUNCHLIST_RECTIFICATION;
        
      case WORKFLOW_STAGES.REGION_TEAM_REVIEW:
        if (decision === DECISIONS.APPROVE || decision === DECISIONS.APPROVE_WITH_PL) {
          return WORKFLOW_STAGES.RTH_REVIEW;
        }
        return WORKFLOW_STAGES.PUNCHLIST_RECTIFICATION;
        
      case WORKFLOW_STAGES.RTH_REVIEW:
        if (decision === DECISIONS.APPROVE || decision === DECISIONS.APPROVE_WITH_PL) {
          return WORKFLOW_STAGES.APPROVED;
        }
        return WORKFLOW_STAGES.PUNCHLIST_RECTIFICATION;
        
      default:
        return null;
    }
  }

  static getRequiredRole(stage) {
    const roleMap = {
      [WORKFLOW_STAGES.DOCUMENT_UPLOAD]: 'DOC_CONTROL',
      [WORKFLOW_STAGES.SOW_CATEGORIZATION]: 'SYSTEM',
      [WORKFLOW_STAGES.BO_REVIEW]: 'BO',
      [WORKFLOW_STAGES.SME_REVIEW]: 'SME',
      [WORKFLOW_STAGES.HEAD_NOC_REVIEW]: 'HEAD_NOC',
      [WORKFLOW_STAGES.FOP_RTS_REVIEW]: 'FOP_RTS',
      [WORKFLOW_STAGES.REGION_TEAM_REVIEW]: 'REGION_TEAM',
      [WORKFLOW_STAGES.RTH_REVIEW]: 'RTH'
    };
    return roleMap[stage];
  }

  static canUserReview(userRole, stage) {
    return this.getRequiredRole(stage) === userRole;
  }

  static processDecision(currentStage, decision, punchlistItems = []) {
    // Determine punchlist severity
    const severity = this.getPunchlistSeverity(punchlistItems);
    
    // Get next stage based on decision and severity
    const nextStage = this.getNextStage(currentStage, decision, severity);
    
    return {
      nextStage,
      severity,
      requiresRectification: severity === PUNCHLIST_SEVERITY.CRITICAL,
      canProceed: severity !== PUNCHLIST_SEVERITY.CRITICAL
    };
  }

  static getPunchlistSeverity(punchlistItems) {
    if (!punchlistItems || punchlistItems.length === 0) {
      return PUNCHLIST_SEVERITY.NONE;
    }
    
    const hasCritical = punchlistItems.some(item => item.severity === 'critical');
    if (hasCritical) return PUNCHLIST_SEVERITY.CRITICAL;
    
    const hasMajor = punchlistItems.some(item => item.severity === 'major');
    if (hasMajor) return PUNCHLIST_SEVERITY.MAJOR;
    
    return PUNCHLIST_SEVERITY.MINOR;
  }

  static getWorkflowStatus(stage, punchlistSeverity) {
    if (stage === WORKFLOW_STAGES.APPROVED) {
      if (punchlistSeverity === PUNCHLIST_SEVERITY.NONE) {
        return 'ATP Document Full Signed';
      } else {
        return 'ATP Document Full Signed (with Punchlist)';
      }
    }
    
    if (stage === WORKFLOW_STAGES.PUNCHLIST_RECTIFICATION) {
      return 'Returns to Clear Punchlist (Mandatory Site Rectification)';
    }
    
    return `Pending ${this.getRequiredRole(stage)} Review`;
  }
}

module.exports = {
  ATPWorkflowEngine,
  WORKFLOW_STAGES,
  PUNCHLIST_SEVERITY,
  DECISIONS
};