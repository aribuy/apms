import React, { useMemo, useState, useEffect } from 'react';
import ATPSubmission from './ATPSubmission';
import ReviewDashboard from './ReviewDashboard';
import ApprovalInterface from './ApprovalInterface';
import PunchlistManagement from './PunchlistManagement';
import { usePermissions } from '../../hooks/usePermissions';

interface ATPProcessFlowProps {
  userRole?: string;
}

const ATPProcessFlow: React.FC<ATPProcessFlowProps> = ({ userRole }) => {
  const { canUploadATP, canReviewATP } = usePermissions();
  const [selectedView, setSelectedView] = useState<'submission' | 'reviews' | 'approval' | 'punchlist'>('submission');
  const [selectedAtpId, setSelectedAtpId] = useState<string | null>(null);

  // Determine available views based on user role
  const availableViews = useMemo(() => {
    const views = [];
    
    if (canUploadATP() || ['VENDOR', 'DOC_CONTROL'].includes(userRole || '')) {
      views.push({ key: 'submission', label: 'Submit ATP Documents', icon: '📤' });
    }
    
    if (canReviewATP() || ['BO', 'SME', 'HEAD_NOC', 'FOP_RTS', 'REGION_TEAM', 'RTH'].includes(userRole || '')) {
      views.push({ key: 'reviews', label: 'Review Dashboard', icon: '📋' });
    }
    
    views.push({ key: 'punchlist', label: 'Punchlist Management', icon: '🔧' });
    
    return views;
  }, [canUploadATP, canReviewATP, userRole]);
  
  // Set default view based on available views
  useEffect(() => {
    if (availableViews.length > 0 && !availableViews.find(v => v.key === selectedView)) {
      setSelectedView(availableViews[0].key as any);
    }
  }, [availableViews, selectedView]);

  const renderContent = () => {
    switch (selectedView) {
      case 'submission':
        return <ATPSubmission userRole={userRole} />;
      case 'reviews':
        return <ReviewDashboard userRole={userRole || ''} />;
      case 'approval':
        if (selectedAtpId) {
          return <ApprovalInterface atpId={selectedAtpId} userRole={userRole || ''} />;
        }
        return <ReviewDashboard userRole={userRole || ''} />;
      case 'punchlist':
        return <PunchlistManagement userRole={userRole || ''} />;
      default:
        return <div>Select a view</div>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">ATP Process Flow</h1>
          <p className="text-gray-600 mt-1">Complete ATP document workflow management - Role: {userRole}</p>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {availableViews.map((view) => (
                <button
                  key={view.key}
                  onClick={() => {
                    setSelectedView(view.key as any);
                    if (view.key !== 'approval') {
                      setSelectedAtpId(null);
                    }
                  }}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    selectedView === view.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{view.icon}</span>
                  <span>{view.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default ATPProcessFlow;
