import { useAuth } from '../contexts/AuthContext';

const ATP_PERMISSIONS = {
  VENDOR_ADMIN: {
    canUpload: ['hardware', 'software', 'bulk'],
    canReview: false,
    modules: ['sites', 'tasks', 'atp.upload']
  },
  VENDOR_STAFF: {
    canUpload: ['hardware', 'software'],
    canReview: false,
    modules: ['sites', 'tasks', 'atp.upload']
  },
  FOP_RTS: {
    canUpload: false,
    canReview: ['hardware.stage1'],
    modules: ['sites', 'tasks', 'atp.review']
  },
  REGION_TEAM: {
    canUpload: false,
    canReview: ['hardware.stage2'],
    modules: ['sites', 'tasks', 'atp.review']
  },
  RTH: {
    canUpload: false,
    canReview: ['hardware.stage3'],
    modules: ['sites', 'tasks', 'atp.review']
  },
  BO: {
    canUpload: false,
    canReview: ['software.stage1'],
    modules: ['sites', 'tasks', 'atp.review']
  },
  SME: {
    canUpload: false,
    canReview: ['software.stage2'],
    modules: ['sites', 'tasks', 'atp.review']
  },
  HEAD_NOC: {
    canUpload: false,
    canReview: ['software.stage3'],
    modules: ['sites', 'tasks', 'atp.review']
  },
  SITE_MANAGER: {
    canUpload: false,
    canReview: false,
    modules: ['sites', 'tasks']
  },
  DOC_CONTROL: {
    canUpload: ['hardware', 'software'],
    canReview: false,
    modules: ['dashboard', 'sites', 'tasks', 'atp.upload']
  }
};

export const usePermissions = () => {
  const { user } = useAuth();
  const userRole = user?.role || 'USER';

  const canUploadATP = () => {
    const permissions = ATP_PERMISSIONS[userRole];
    return permissions?.canUpload && permissions.canUpload.length > 0;
  };

  const canReviewATP = () => {
    const permissions = ATP_PERMISSIONS[userRole];
    return permissions?.canReview && permissions.canReview.length > 0;
  };

  const hasModuleAccess = (module) => {
    if (userRole === 'admin') return true;
    const permissions = ATP_PERMISSIONS[userRole];
    return permissions?.modules?.includes(module) || false;
  };

  const getAccessibleModules = () => {
    if (userRole === 'admin') return 'all';
    const permissions = ATP_PERMISSIONS[userRole];
    return permissions?.modules || [];
  };

  return {
    canUploadATP,
    canReviewATP,
    hasModuleAccess,
    getAccessibleModules,
    userRole
  };
};