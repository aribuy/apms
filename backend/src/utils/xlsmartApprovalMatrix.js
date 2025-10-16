// PT XLSMART ATP Approval Matrix
const APPROVAL_MATRIX = {
  'RAN': {
    vendors: ['ZTE', 'HTI', 'Aviat'],
    approvers: ['RTS', 'BO', 'RTH_TEAM', 'RTH']
  },
  'PLN Upgrade': {
    vendors: ['ZTE', 'HTI', 'Aviat'],
    approvers: ['ROH', 'RTH_TEAM']
  },
  'Dismantle Keep': {
    vendors: ['ZTE', 'HTI', 'Aviat'],
    approvers: ['ROH', 'RTH_TEAM']
  },
  'Dismantle Drop': {
    vendors: ['ZTE', 'HTI', 'Aviat'],
    approvers: ['RTS', 'RTH_TEAM', 'PMO']
  },
  'MW': {
    vendors: ['ZTE', 'HTI', 'Alita', 'Aviat'],
    approvers: ['RTS', 'BO', 'RTH_TEAM', 'RTH']
  },
  'MW Upgrade': {
    vendors: ['ZTE', 'HTI', 'Alita', 'Aviat'],
    approvers: ['BO', 'NOC_HEAD']
  },
  'VLAN Tagging': {
    vendors: ['ZTE', 'HTI', 'Aviat', 'LTE'],
    approvers: ['BO', 'XLS_CONFIG']
  },
  'IPRAN': {
    vendors: ['ZTE', 'HTI', 'Aviat', 'LTE'],
    approvers: []
  },
  'IBS Lamp Site': {
    vendors: ['ZTE', 'HTI', 'Aviat', 'LTE'],
    approvers: []
  },
  'Mini CME': {
    vendors: ['ZTE', 'HTI', 'Aviat', 'LTE'],
    approvers: []
  }
};

const getApprovalWorkflow = (scope) => {
  const matrix = APPROVAL_MATRIX[scope];
  if (!matrix || !matrix.approvers.length) {
    return [];
  }
  
  return matrix.approvers.map((role, index) => ({
    stage: index + 1,
    role: role,
    required: true
  }));
};

const canVendorUpload = (vendorName, scope) => {
  const matrix = APPROVAL_MATRIX[scope];
  return matrix && matrix.vendors.includes(vendorName);
};

const canRoleApprove = (role, scope, stage) => {
  const workflow = getApprovalWorkflow(scope);
  const stageInfo = workflow.find(w => w.stage === stage);
  return stageInfo && stageInfo.role === role;
};

module.exports = {
  APPROVAL_MATRIX,
  getApprovalWorkflow,
  canVendorUpload,
  canRoleApprove
};