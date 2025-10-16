const { canUploadATP, canReviewATP } = require('../utils/atpPermissions');

const checkUploadPermission = (req, res, next) => {
  const userRole = req.user?.role || req.headers['x-user-role'] || 'USER';
  
  const uploadRoles = ['VENDOR_ADMIN', 'VENDOR_STAFF'];
  if (!uploadRoles.includes(userRole)) {
    return res.status(403).json({
      error: 'Access denied',
      message: 'Only vendor administration can upload ATP documents'
    });
  }
  next();
};

const checkReviewPermission = async (req, res, next) => {
  const userRole = req.user?.role || req.headers['x-user-role'] || 'USER';
  
  // For now, allow review if user has any review permissions
  const hasReviewAccess = ['FOP_RTS', 'REGION_TEAM', 'RTH', 'BO', 'SME', 'HEAD_NOC'].includes(userRole);
  
  if (!hasReviewAccess) {
    return res.status(403).json({
      error: 'Access denied',
      message: 'You cannot review ATP documents'
    });
  }
  next();
};

module.exports = {
  checkUploadPermission,
  checkReviewPermission
};