import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, Clock, AlertTriangle, XCircle, User } from 'lucide-react';

interface WorkflowStage {
  stage: string;
  stageName: string;
  requiredRole: string;
  status: 'completed' | 'current' | 'pending';
  decision?: string;
  reviewedAt?: string;
  comments?: string;
}

interface PunchlistItem {
  id: string;
  issue_description: string;
  severity: 'minor' | 'major' | 'critical';
  category: string;
  status: string;
}

interface ATPWorkflowViewerProps {
  atpId: string;
}

const ATPWorkflowViewer: React.FC<ATPWorkflowViewerProps> = ({ atpId }) => {
  const [workflowData, setWorkflowData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchWorkflowStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/v1/atp-workflow/${atpId}/workflow`);
      const data = await response.json();
      if (data.success) {
        setWorkflowData(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch workflow status:', error);
    } finally {
      setLoading(false);
    }
  }, [atpId]);

  useEffect(() => {
    fetchWorkflowStatus();
  }, [fetchWorkflowStatus]);

  const getStageIcon = (status: string, decision?: string) => {
    switch (status) {
      case 'completed':
        return decision === 'approve' || decision === 'approve_with_punchlist' ? 
          <CheckCircle className="w-6 h-6 text-green-500" /> :
          <XCircle className="w-6 h-6 text-red-500" />;
      case 'current':
        return <Clock className="w-6 h-6 text-yellow-500" />;
      default:
        return <div className="w-6 h-6 rounded-full border-2 border-gray-300" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'major': return 'text-orange-600 bg-orange-100';
      case 'minor': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading workflow...</div>;
  }

  if (!workflowData) {
    return <div className="text-center p-8 text-gray-500">No workflow data available</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Workflow Status Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">ATP Workflow Status</h2>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            workflowData.currentStatus === 'approved' ? 'bg-green-100 text-green-800' :
            workflowData.currentStatus === 'pending_rectification' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {workflowData.workflowStatus}
          </div>
        </div>
        
        <div className="text-sm text-gray-600">
          Current Stage: <span className="font-medium">{workflowData.currentStage?.replace(/_/g, ' ').toUpperCase()}</span>
        </div>
      </div>

      {/* Workflow Path */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Approval Flow</h3>
        
        <div className="space-y-4">
          {workflowData.workflowPath?.map((stage: WorkflowStage, index: number) => (
            <div key={stage.stage} className="flex items-start space-x-4">
              {/* Stage Icon */}
              <div className="flex-shrink-0 mt-1">
                {getStageIcon(stage.status, stage.decision)}
              </div>
              
              {/* Stage Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">{stage.stageName}</h4>
                  <div className="flex items-center text-sm text-gray-500">
                    <User className="w-4 h-4 mr-1" />
                    {stage.requiredRole}
                  </div>
                </div>
                
                {stage.status === 'completed' && (
                  <div className="mt-2 space-y-1">
                    <div className="text-sm text-gray-600">
                      Decision: <span className="font-medium capitalize">{stage.decision?.replace(/_/g, ' ')}</span>
                    </div>
                    {stage.reviewedAt && (
                      <div className="text-sm text-gray-500">
                        Reviewed: {new Date(stage.reviewedAt).toLocaleString()}
                      </div>
                    )}
                    {stage.comments && (
                      <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        {stage.comments}
                      </div>
                    )}
                  </div>
                )}
                
                {stage.status === 'current' && (
                  <div className="mt-2 text-sm text-yellow-600">
                    Awaiting review...
                  </div>
                )}
              </div>
              
              {/* Connector Line */}
              {index < workflowData.workflowPath.length - 1 && (
                <div className="absolute left-8 mt-8 w-0.5 h-8 bg-gray-200" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Punchlist Items */}
      {workflowData.punchlistItems?.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
            Punchlist Items ({workflowData.punchlistItems.length})
          </h3>
          
          <div className="space-y-3">
            {workflowData.punchlistItems.map((item: PunchlistItem) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(item.severity)}`}>
                        {item.severity.toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-500">{item.category}</span>
                    </div>
                    <p className="text-gray-800">{item.issue_description}</p>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    item.status === 'open' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {item.status.toUpperCase()}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {!workflowData.canProceed && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <XCircle className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-red-800 font-medium">
                  Critical punchlist items must be resolved before proceeding
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ATPWorkflowViewer;
