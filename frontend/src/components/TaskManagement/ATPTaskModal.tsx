import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface Task {
  id: string;
  task_code?: string;
  title: string;
  site_id?: string;
  task_type?: string;
  taskType?: string;
  task_data?: any;
}

interface ATPTaskModalProps {
  task: Task;
  userRole: string;
  onClose: () => void;
  onComplete: () => void;
}

const ATPTaskModal: React.FC<ATPTaskModalProps> = ({ task, userRole, onClose, onComplete }) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'review' | 'punchlist'>(() => {
    // Default to upload tab for DOC_CONTROL or ATP_UPLOAD tasks
    if (userRole === 'DOC_CONTROL' || task.task_type === 'ATP_UPLOAD') return 'upload';
    // Default to review tab for reviewers
    if (['BO', 'SME', 'HEAD_NOC', 'FOP_RTS', 'REGION_TEAM', 'RTH'].includes(userRole)) return 'review';
    return 'upload'; // Default to upload if no specific match
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [reviewDecision, setReviewDecision] = useState<'approve' | 'reject' | 'approve_with_punchlist'>('approve');
  const [comments, setComments] = useState('');
  const [checklistItems, setChecklistItems] = useState([
    { id: '1', description: 'Equipment configuration verified', result: '', severity: 'major' },
    { id: '2', description: 'Software license validated', result: '', severity: 'critical' },
    { id: '3', description: 'Network connectivity tested', result: '', severity: 'minor' }
  ]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setUploadedFile(file);
    } else {
      alert('Please upload a PDF file only');
    }
  };

  const handleSubmit = async () => {
    if (activeTab === 'upload' && !uploadedFile) {
      alert('Please upload an ATP document');
      return;
    }

    try {
      let endpoint = '';
      let payload = {};

      if (activeTab === 'upload') {
        // Submit ATP document
        const formData = new FormData();
        formData.append('file', uploadedFile!);
        formData.append('siteId', task.site_id || '');
        formData.append('taskId', task.id);
        
        console.log('Submitting ATP with data:', {
          siteId: task.site_id,
          taskId: task.id,
          fileName: uploadedFile!.name
        });
        
        const response = await fetch('http://localhost:3011/api/v1/atp/submit', {
          method: 'POST',
          body: formData
        });
        
        console.log('Response status:', response.status);
        const result = await response.json();
        console.log('Response data:', result);
        
        if (result.success) {
          alert(`ATP submitted successfully!\nATP Code: ${result.atpCode}\nFile: ${result.fileName || uploadedFile!.name}`);
        } else {
          alert(`Error: ${result.error || 'Failed to submit ATP'}`);
          return;
        }
      } else if (activeTab === 'review') {
        // Submit review decision
        const failedItems = checklistItems.filter(item => item.result === 'fail');
        const punchlistItems = failedItems.map(item => ({
          description: `${item.description} - Failed evaluation`,
          severity: item.severity,
          category: 'Checklist Item'
        }));

        // Validate task data exists
        if (!task.task_data?.atp_id || !task.task_data?.stage_id) {
          alert('Task data incomplete. Cannot submit review.');
          return;
        }
        
        const atpId = task.task_data.atp_id;
        const stageId = task.task_data.stage_id;

        payload = {
          stageId: stageId,
          decision: reviewDecision,
          comments,
          checklistItems,
          punchlistItems: reviewDecision === 'approve_with_punchlist' ? punchlistItems : []
        };

        const response = await fetch(`http://localhost:3011/api/v1/atp/${atpId}/review`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          const result = await response.json();
          alert(`Review submitted: ${reviewDecision}\n${result.message || ''}`);
        }
      }

      onComplete();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to process ATP task');
    }
  };

  const getTabContent = () => {
    switch (activeTab) {
      case 'upload':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload ATP Document *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium text-gray-900">
                        Drop ATP document here or click to browse
                      </span>
                      <span className="mt-1 block text-xs text-gray-500">
                        PDF files only, max 50MB
                      </span>
                    </label>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      accept=".pdf"
                      className="sr-only"
                      onChange={handleFileUpload}
                    />
                  </div>
                </div>
              </div>
              
              {uploadedFile && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-sm text-green-800">
                      {uploadedFile.name} ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Checklist Evaluation</h3>
              <div className="space-y-3">
                {checklistItems.map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{item.description}</p>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
                          item.severity === 'critical' ? 'bg-red-100 text-red-800' :
                          item.severity === 'major' ? 'bg-orange-100 text-orange-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {item.severity.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        {['pass', 'fail', 'na'].map((result) => (
                          <label key={result} className="flex items-center">
                            <input
                              type="radio"
                              name={`result-${item.id}`}
                              value={result}
                              className="mr-1"
                              onChange={(e) => {
                                const updated = checklistItems.map(ci => 
                                  ci.id === item.id ? { ...ci, result: e.target.value } : ci
                                );
                                setChecklistItems(updated);
                              }}
                            />
                            <span className={`text-xs ${
                              result === 'pass' ? 'text-green-600' :
                              result === 'fail' ? 'text-red-600' :
                              'text-gray-600'
                            }`}>
                              {result.toUpperCase()}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review Decision
              </label>
              <div className="space-y-2">
                {[
                  { value: 'approve', label: 'Approve', icon: CheckCircle, color: 'text-green-600' },
                  { value: 'approve_with_punchlist', label: 'Approve with Punchlist', icon: AlertTriangle, color: 'text-orange-600' },
                  { value: 'reject', label: 'Reject', icon: XCircle, color: 'text-red-600' }
                ].map((option) => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      name="decision"
                      value={option.value}
                      checked={reviewDecision === option.value}
                      onChange={(e) => setReviewDecision(e.target.value as any)}
                      className="mr-3"
                    />
                    <option.icon className={`h-5 w-5 mr-2 ${option.color}`} />
                    <span className="text-sm text-gray-900">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comments
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add your review comments..."
              />
            </div>
          </div>
        );

      case 'punchlist':
        return (
          <div className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
                <h3 className="text-sm font-medium text-orange-800">Punchlist Items</h3>
              </div>
              <p className="mt-1 text-sm text-orange-700">
                {task.task_data?.punchlist_count || 0} items require rectification
              </p>
            </div>
            
            <div className="space-y-3">
              {/* Mock punchlist items */}
              {[
                { id: 1, description: 'Equipment configuration verification failed', severity: 'critical', status: 'identified' },
                { id: 2, description: 'Network connectivity test incomplete', severity: 'major', status: 'in_progress' },
                { id: 3, description: 'Documentation missing signatures', severity: 'minor', status: 'identified' }
              ].map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{item.description}</p>
                      <div className="flex items-center mt-2 space-x-2">
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                          item.severity === 'critical' ? 'bg-red-100 text-red-800' :
                          item.severity === 'major' ? 'bg-orange-100 text-orange-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {item.severity.toUpperCase()}
                        </span>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                          item.status === 'identified' ? 'bg-gray-100 text-gray-800' :
                          item.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {item.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      {item.status === 'identified' && (
                        <button className="text-sm text-blue-600 hover:text-blue-800">
                          Start Work
                        </button>
                      )}
                      {item.status === 'in_progress' && (
                        <button className="text-sm text-green-600 hover:text-green-800">
                          Mark Complete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rectification Notes
              </label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add notes about rectification work..."
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getAvailableTabs = () => {
    const tabs = [];
    
    // Always show upload tab for DOC_CONTROL or ATP_UPLOAD tasks
    if (userRole === 'DOC_CONTROL' || task.task_type === 'ATP_UPLOAD') {
      tabs.push({ key: 'upload', label: 'Upload ATP', icon: Upload });
    }
    
    // Show review tab for reviewers or ATP_REVIEW tasks
    if (['BO', 'SME', 'HEAD_NOC', 'FOP_RTS', 'REGION_TEAM', 'RTH'].includes(userRole) || task.task_type === 'ATP_REVIEW') {
      tabs.push({ key: 'review', label: 'Review ATP', icon: FileText });
    }
    
    // Always show punchlist tab
    tabs.push({ key: 'punchlist', label: 'Punchlist', icon: AlertTriangle });
    
    return tabs;
  };

  const availableTabs = getAvailableTabs();

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">{task.title}</h3>
            <p className="text-sm text-gray-500">Site: {task.site_id} | Task: {task.task_code}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {availableTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mb-6">
          {getTabContent()}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
          >
            {activeTab === 'upload' ? 'Upload & Submit ATP' : activeTab === 'review' ? 'Submit Review' : 'Update Punchlist'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ATPTaskModal;