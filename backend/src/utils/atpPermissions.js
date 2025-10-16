// ATP Permission System
const ATP_PERMISSIONS = {
  // Site Management
  SITE_MANAGER: {
    canUpload: false,
    canReview: false,
    canApprove: false,
    modules: ['sites', 'tasks']
  },
  
  // Upload permissions (Vendor Admin only)
  VENDOR_ADMIN: {
    canUpload: ['hardware', 'software', 'bulk'],
    canReview: false,
    canApprove: false,
    modules: ['sites', 'tasks', 'atp.upload']
  },
  VENDOR_STAFF: {
    canUpload: ['hardware', 'software'],
    canReview: false,
    canApprove: false,
    modules: ['sites', 'tasks', 'atp.upload']
  },
  
  // Review permissions (Approval workflow)
  FOP_RTS: {
    canUpload: false,
    canReview: ['hardware.stage1'],
    canApprove: false,
    modules: ['sites', 'tasks', 'atp.review']
  },
  REGION_TEAM: {
    canUpload: false,
    canReview: ['hardware.stage2'],
    canApprove: false,
    modules: ['sites', 'tasks', 'atp.review']
  },
  RTH: {
    canUpload: false,
    canReview: ['hardware.stage3'],
    canApprove: ['hardware'],
    modules: ['sites', 'tasks', 'atp.review']
  },
  BO: {
    canUpload: false,
    canReview: ['software.stage1'],
    canApprove: false,
    modules: ['sites', 'tasks', 'atp.review']
  },
  SME: {
    canUpload: false,
    canReview: ['software.stage2'],
    canApprove: false,
    modules: ['sites', 'tasks', 'atp.review']
  },
  HEAD_NOC: {
    canUpload: false,
    canReview: ['software.stage3'],
    canApprove: ['software'],
    modules: ['sites', 'tasks', 'atp.review']
  }
};

const canUploadATP = (userRole) => {
  const permissions = ATP_PERMISSIONS[userRole];
  return permissions?.canUpload && permissions.canUpload.length > 0;
};

const canReviewATP = (userRole, atpType, stage) => {
  const permissions = ATP_PERMISSIONS[userRole];
  if (!permissions?.canReview) return false;
  
  const reviewPermission = `${atpType}.${stage}`;
  return permissions.canReview.includes(reviewPermission);
};

const canApproveATP = (userRole, atpType) => {
  const permissions = ATP_PERMISSIONS[userRole];
  return permissions?.canApprove?.includes(atpType) || false;
};

const hasModuleAccess = (userRole, module) => {
  const permissions = ATP_PERMISSIONS[userRole];
  return permissions?.modules?.includes(module) || false;
};

module.exports = {
  ATP_PERMISSIONS,
  canUploadATP,
  canReviewATP,
  canApproveATP,
  hasModuleAccess
};