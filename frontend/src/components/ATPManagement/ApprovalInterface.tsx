import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, FileText, Download, MessageSquare, Plus, Trash2 } from 'lucide-react';

interface ChecklistItem {
  id: string;
  item_number: string;
  section_name: string;
  description: string;
  result?: 'pass' | 'fail' | 'na';
  severity: 'critical' | 'major' | 'minor';
  reviewer_notes?: string;
  has_issue: boolean;
  issue_description?: string;
}

interface PunchlistItem {
  description: string;
  severity: 'critical' | 'major' | 'minor';
  category: string;
}

interface ATPDocument {
  id: string;
  atp_code: string;
  site_id: string;
  document_type: string;
  current_stage: string;
  file_path?: string;
  atp_review_stages: any[];
}

interface ApprovalInterfaceProps {
  atpId: string;
  userRole: string;
}

const ApprovalInterface: React.FC<ApprovalInterfaceProps> = ({ atpId, userRole }) => {
  const [atp, setAtp] = useState<ATPDocument | null>(null);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [selectedTab, setSelectedTab] = useState<'checklist' | 'evidence' | 'document' | 'history'>('checklist');
  const [decision, setDecision] = useState<'approve' | 'reject' | 'approve_with_punchlist'>('approve');
  const [comments, setComments] = useState('');
  const [punchlistItems, setPunchlistItems] = useState<PunchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchATPDetails();
  }, [atpId]);

  const fetchATPDetails = async () => {
    try {
      const response = await fetch(`/api/v1/atp/${atpId}`);
      const data = await response.json();
      setAtp(data);
      
      // Generate mock checklist items based on template
      const mockItems: ChecklistItem[] = [
        {
          id: '1',
          item_number: 'T001',
          section_name: 'Equipment Inventory',
          description: 'IDU/Card Information Complete',
          severity: 'major',
          has_issue: false
        },
        {
          id: '2',
          item_number: 'T005',
          section_name: 'Software License Verification',
          description: 'Radio Capacity License Verification',
          severity: 'critical',
          has_issue: false
        },
        {
          id: '3',
          item_number: 'T012',
          section_name: 'Configuration Verification',
          description: 'Sync Interval Configuration',
          severity: 'major',
          has_issue: false
        }
      ];
      setChecklistItems(mockItems);
    } catch (error) {
      console.error('Error fetching ATP details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChecklistUpdate = (itemId: string, field: string, value: any) => {
    setChecklistItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, [field]: value } : item
    ));
  };

  const addPunchlistItem = () => {
    setPunchlistItems(prev => [...prev, {
      description: '',
      severity: 'minor',
      category: 'General'
    }]);
  };

  const removePunchlistItem = (index: number) => {
    setPunchlistItems(prev => prev.filter((_, i) => i !== index));
  };

  const updatePunchlistItem = (index: number, field: string, value: string) => {
    setPunchlistItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const handleSubmitReview = async () => {
    if (!atp) return;

    setSubmitting(true);
    try {
      const currentStage = atp.atp_review_stages.find(stage => 
        stage.assigned_role === userRole && stage.review_status === 'pending'
      );

      const response = await fetch(`/api/v1/atp/${atpId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stageId: currentStage?.id,
          decision,
          comments,
          punchlistItems,
          checklistItems
        }),
      });

      if (response.ok) {
        alert('Review submitted successfully!');
        window.location.href = '/atp-management/reviews';
      } else {
        alert('Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Error submitting review');
    } finally {
      setSubmitting(false);
    }
  };

  const getEvaluationSummary = () => {
    const total = checklistItems.length;
    const passed = checklistItems.filter(item => item.result === 'pass').length;
    const failed = checklistItems.filter(item => item.result === 'fail').length;
    const na = checklistItems.filter(item => item.result === 'na').length;
    const pending = total - passed - failed - na;

    const criticalFailed = checklistItems.filter(item => 
      item.result === 'fail' && item.severity === 'critical'
    ).length;

    return { total, passed, failed, na, pending, criticalFailed };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!atp) {
    return <div className="text-center py-8">ATP document not found</div>;
  }

  const summary = getEvaluationSummary();

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <FileText className="mr-3 h-6 w-6 text-blue-600" />
                Document Review - {atp.atp_code}
              </h1>
              <p className="text-gray-600 mt-1">Site: {atp.site_id} | Type: {atp.document_type?.toUpperCase()}</p>
            </div>
            <div className="flex space-x-2">
              <button className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                <Download className="h-4 w-4 mr-1" />
                Download PDF
              </button>
              <button className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                <MessageSquare className="h-4 w-4 mr-1" />
                Contact Submitter
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {['checklist', 'evidence', 'document', 'history'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                    selectedTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {selectedTab === 'checklist' && (
            <div className="space-y-6">
              {/* Progress Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Evaluation Progress</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{summary.total}</div>
                    <div className="text-gray-500">Total Items</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{summary.passed}</div>
                    <div className="text-gray-500">Pass</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{summary.failed}</div>
                    <div className="text-gray-500">Fail</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">{summary.na}</div>
                    <div className="text-gray-500">N/A</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{summary.pending}</div>
                    <div className="text-gray-500">Pending</div>
                  </div>
                </div>
              </div>

              {/* Checklist Items */}
              <div className="space-y-4">
                {checklistItems.map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium text-gray-900">[{item.item_number}]</span>
                          <span className="text-gray-700">{item.description}</span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            item.severity === 'critical' ? 'bg-red-100 text-red-800' :
                            item.severity === 'major' ? 'bg-orange-100 text-orange-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {item.severity.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">Section: {item.section_name}</p>
                        
                        {/* Result Selection */}
                        <div className="flex items-center space-x-4 mb-3">
                          <span className="text-sm font-medium text-gray-700">Result:</span>
                          {['pass', 'fail', 'na'].map((result) => (
                            <label key={result} className="flex items-center">
                              <input
                                type="radio"
                                name={`result-${item.id}`}
                                value={result}
                                checked={item.result === result}
                                onChange={(e) => handleChecklistUpdate(item.id, 'result', e.target.value)}
                                className="mr-2"
                              />
                              <span className={`text-sm ${
                                result === 'pass' ? 'text-green-600' :
                                result === 'fail' ? 'text-red-600' :
                                'text-gray-600'
                              }`}>
                                {result.toUpperCase()}
                              </span>
                            </label>
                          ))}
                        </div>

                        {/* Comments */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Reviewer Notes:
                          </label>
                          <textarea
                            value={item.reviewer_notes || ''}
                            onChange={(e) => handleChecklistUpdate(item.id, 'reviewer_notes', e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Add your review comments..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedTab === 'evidence' && (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Evidence Review</h3>
              <p className="mt-1 text-sm text-gray-500">Evidence photos and documentation will be displayed here.</p>
            </div>
          )}

          {selectedTab === 'document' && (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Document Viewer</h3>
              <p className="mt-1 text-sm text-gray-500">PDF document viewer will be embedded here.</p>
            </div>
          )}

          {selectedTab === 'history' && (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Review History</h3>
              <p className="mt-1 text-sm text-gray-500">Previous review stages and comments will be shown here.</p>
            </div>
          )}
        </div>

        {/* Decision Panel */}
        <div className="border-t border-gray-200 px-6 py-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Approval Decision</h3>
          
          {/* Decision Options */}
          <div className="space-y-3 mb-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="decision"
                value="approve"
                checked={decision === 'approve'}
                onChange={(e) => setDecision(e.target.value as any)}
                className="mr-3"
              />
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-green-700 font-medium">Approve</span>
              <span className="text-gray-500 ml-2">- All items passed, no issues found</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="radio"
                name="decision"
                value="approve_with_punchlist"
                checked={decision === 'approve_with_punchlist'}
                onChange={(e) => setDecision(e.target.value as any)}
                className="mr-3"
              />
              <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
              <span className="text-orange-700 font-medium">Approve with Punchlist</span>
              <span className="text-gray-500 ml-2">- Minor/Major issues require rectification</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="radio"
                name="decision"
                value="reject"
                checked={decision === 'reject'}
                onChange={(e) => setDecision(e.target.value as any)}
                className="mr-3"
              />
              <XCircle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-700 font-medium">Reject</span>
              <span className="text-gray-500 ml-2">- Critical issues require full resubmission</span>
            </label>
          </div>

          {/* Punchlist Items */}
          {decision === 'approve_with_punchlist' && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">Punchlist Items</h4>
                <button
                  onClick={addPunchlistItem}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </button>
              </div>
              
              <div className="space-y-3">
                {punchlistItems.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-md p-3">
                    <div className="flex items-start space-x-3">
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          placeholder="Issue description..."
                          value={item.description}
                          onChange={(e) => updatePunchlistItem(index, 'description', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                        <div className="flex space-x-4">
                          <select
                            value={item.severity}
                            onChange={(e) => updatePunchlistItem(index, 'severity', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                          >
                            <option value="minor">Minor</option>
                            <option value="major">Major</option>
                            <option value="critical">Critical</option>
                          </select>
                          <input
                            type="text"
                            placeholder="Category"
                            value={item.category}
                            onChange={(e) => updatePunchlistItem(index, 'category', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => removePunchlistItem(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Review Comments
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add your review comments..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Save Draft
            </button>
            <button
              onClick={handleSubmitReview}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApprovalInterface;