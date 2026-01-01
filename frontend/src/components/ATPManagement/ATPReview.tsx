import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, Clock, FileText, Plus } from 'lucide-react';

interface ATP {
  id: string;
  atp_code: string;
  site_id: string;
  document_type: string;
  workflow_path: string;
  current_stage: string;
  current_status: string;
  atp_review_stages: ReviewStage[];
  atp_punchlist_items: PunchlistItem[];
}

interface ReviewStage {
  id: string;
  stage_number: number;
  stage_code: string;
  stage_name: string;
  assigned_role: string;
  review_status: string;
  decision?: string;
  comments?: string;
  sla_deadline: string;
}

interface PunchlistItem {
  id: string;
  issue_description: string;
  severity: string;
  status: string;
}

interface NewPunchlistItem {
  description: string;
  severity: 'critical' | 'major' | 'minor';
  category: string;
}

const ATPReview: React.FC = () => {
  const [atps, setAtps] = useState<ATP[]>([]);
  const [selectedATP, setSelectedATP] = useState<ATP | null>(null);
  const [currentRole, setCurrentRole] = useState('FOP_RTS');
  const [reviewDecision, setReviewDecision] = useState('');
  const [reviewComments, setReviewComments] = useState('');
  const [punchlistItems, setPunchlistItems] = useState<NewPunchlistItem[]>([]);
  const fetchPendingReviews = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:3011/api/v1/atp/reviews/pending?role=${currentRole}`);
      const data = await response.json();
      
      // Transform data to match our interface
      const transformedData = data.map((review: any) => ({
        ...review.atp_documents,
        atp_review_stages: [review], // Current stage
        currentReviewStage: review
      }));
      
      setAtps(transformedData);
    } catch (error) {
      console.error('Error fetching pending reviews:', error);
    }
  }, [currentRole]);

  useEffect(() => {
    fetchPendingReviews();
  }, [fetchPendingReviews]);

  const fetchATPDetails = async (atpId: string) => {
    try {
      const response = await fetch(`http://localhost:3011/api/v1/atp/${atpId}`);
      const data = await response.json();
      setSelectedATP(data);
    } catch (error) {
      console.error('Error fetching ATP details:', error);
    }
  };

  const submitReview = async () => {
    if (!selectedATP || !reviewDecision) {
      alert('Please select a decision');
      return;
    }

    const currentStage = selectedATP.atp_review_stages.find(stage => 
      stage.review_status === 'pending'
    );

    if (!currentStage) {
      alert('No pending stage found');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3011/api/v1/atp/${selectedATP.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stageId: currentStage.id,
          decision: reviewDecision,
          comments: reviewComments,
          punchlistItems: punchlistItems
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`Review submitted successfully! Status: ${result.status}`);
        setSelectedATP(null);
        setReviewDecision('');
        setReviewComments('');
        setPunchlistItems([]);
        fetchPendingReviews();
      } else {
        alert('Failed to submit review');
      }
    } catch (error) {
      console.error('Review submission error:', error);
      alert('Error submitting review');
    }
  };

  const addPunchlistItem = () => {
    setPunchlistItems([...punchlistItems, {
      description: '',
      severity: 'major',
      category: 'General'
    }]);
  };

  const updatePunchlistItem = (index: number, field: keyof NewPunchlistItem, value: string) => {
    const updated = [...punchlistItems];
    updated[index] = { ...updated[index], [field]: value };
    setPunchlistItems(updated);
  };

  const removePunchlistItem = (index: number) => {
    setPunchlistItems(punchlistItems.filter((_, i) => i !== index));
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'approved': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending': return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'rejected': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />;
      default: return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'major': return 'bg-yellow-100 text-yellow-800';
      case 'minor': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (selectedATP) {
    const currentStage = selectedATP.atp_review_stages.find(stage => 
      stage.review_status === 'pending'
    );

    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <button
            onClick={() => setSelectedATP(null)}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Back to Review List
          </button>
          <h1 className="text-2xl font-bold">
            ATP Review - {selectedATP.atp_code}
          </h1>
          <p className="text-gray-600">Site: {selectedATP.site_id} | Type: {selectedATP.document_type}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Review Form */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">
              {currentStage?.stage_name} ({currentStage?.assigned_role})
            </h2>

            {/* Mock Checklist Items */}
            <div className="space-y-4 mb-6">
              <h3 className="font-medium">Review Checklist</h3>
              
              {selectedATP.document_type === 'hardware' ? (
                <div className="space-y-3">
                  <div className="border rounded p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">2.1.2.1 Power Cable Connection</span>
                      <div className="flex space-x-2">
                        <label className="flex items-center">
                          <input type="radio" name="item1" value="pass" className="mr-1" />
                          Pass
                        </label>
                        <label className="flex items-center">
                          <input type="radio" name="item1" value="fail" className="mr-1" />
                          Fail
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border rounded p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">2.1.2.2 Coax Cable Waterproofing</span>
                      <div className="flex space-x-2">
                        <label className="flex items-center">
                          <input type="radio" name="item2" value="pass" className="mr-1" />
                          Pass
                        </label>
                        <label className="flex items-center">
                          <input type="radio" name="item2" value="fail" className="mr-1" />
                          Fail
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border rounded p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">2.1.2.7 Grounding Kit Installation</span>
                      <div className="flex space-x-2">
                        <label className="flex items-center">
                          <input type="radio" name="item3" value="pass" className="mr-1" />
                          Pass
                        </label>
                        <label className="flex items-center">
                          <input type="radio" name="item3" value="fail" className="mr-1" />
                          Fail
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="border rounded p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Software Configuration Validation</span>
                      <div className="flex space-x-2">
                        <label className="flex items-center">
                          <input type="radio" name="sw1" value="pass" className="mr-1" />
                          Pass
                        </label>
                        <label className="flex items-center">
                          <input type="radio" name="sw1" value="fail" className="mr-1" />
                          Fail
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border rounded p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Network Integration Test</span>
                      <div className="flex space-x-2">
                        <label className="flex items-center">
                          <input type="radio" name="sw2" value="pass" className="mr-1" />
                          Pass
                        </label>
                        <label className="flex items-center">
                          <input type="radio" name="sw2" value="fail" className="mr-1" />
                          Fail
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Review Decision */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Review Decision
                </label>
                <select
                  value={reviewDecision}
                  onChange={(e) => setReviewDecision(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select Decision</option>
                  <option value="approve">Approve</option>
                  <option value="approve_with_punchlist">Approve with Punchlist</option>
                  <option value="reject">Reject</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comments
                </label>
                <textarea
                  value={reviewComments}
                  onChange={(e) => setReviewComments(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Add your review comments..."
                />
              </div>

              {/* Punchlist Items */}
              {(reviewDecision === 'approve_with_punchlist' || punchlistItems.length > 0) && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Punchlist Items
                    </label>
                    <button
                      onClick={addPunchlistItem}
                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Item
                    </button>
                  </div>
                  
                  {punchlistItems.map((item, index) => (
                    <div key={index} className="border rounded p-3 mb-2">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                        <select
                          value={item.severity}
                          onChange={(e) => updatePunchlistItem(index, 'severity', e.target.value)}
                          className="px-2 py-1 border rounded text-sm"
                        >
                          <option value="critical">Critical</option>
                          <option value="major">Major</option>
                          <option value="minor">Minor</option>
                        </select>
                        
                        <input
                          type="text"
                          value={item.category}
                          onChange={(e) => updatePunchlistItem(index, 'category', e.target.value)}
                          placeholder="Category"
                          className="px-2 py-1 border rounded text-sm"
                        />
                        
                        <button
                          onClick={() => removePunchlistItem(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                      
                      <textarea
                        value={item.description}
                        onChange={(e) => updatePunchlistItem(index, 'description', e.target.value)}
                        placeholder="Describe the issue..."
                        rows={2}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={submitReview}
                disabled={!reviewDecision}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                Submit Review
              </button>
            </div>
          </div>

          {/* ATP Info Sidebar */}
          <div className="space-y-6">
            {/* ATP Details */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold mb-3">ATP Details</h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Code:</span> {selectedATP.atp_code}</div>
                <div><span className="font-medium">Site:</span> {selectedATP.site_id}</div>
                <div><span className="font-medium">Type:</span> {selectedATP.document_type}</div>
                <div><span className="font-medium">Status:</span> {selectedATP.current_status}</div>
              </div>
            </div>

            {/* Review Stages */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold mb-3">Review Progress</h3>
              <div className="space-y-3">
                {selectedATP.atp_review_stages.map((stage, index) => (
                  <div key={stage.id} className="flex items-center space-x-3">
                    {getStatusIcon(stage.review_status)}
                    <div className="flex-1">
                      <div className="text-sm font-medium">{stage.stage_name}</div>
                      <div className="text-xs text-gray-500">{stage.assigned_role}</div>
                    </div>
                    {stage.review_status === 'pending' && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                        Current
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Existing Punchlist */}
            {selectedATP.atp_punchlist_items && selectedATP.atp_punchlist_items.length > 0 && (
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold mb-3">Existing Punchlist</h3>
                <div className="space-y-2">
                  {selectedATP.atp_punchlist_items.map((item) => (
                    <div key={item.id} className="border-l-4 border-yellow-400 pl-3">
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-2 py-1 rounded ${getSeverityColor(item.severity)}`}>
                          {item.severity}
                        </span>
                        <span className="text-xs text-gray-500">{item.status}</span>
                      </div>
                      <div className="text-sm mt-1">{item.issue_description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">ATP Review Dashboard</h1>
        
        {/* Role Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Role
          </label>
          <select
            value={currentRole}
            onChange={(e) => setCurrentRole(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="FOP_RTS">FOP/RTS (Hardware Stage 1)</option>
            <option value="REGION_TEAM">Region Team (Hardware Stage 2)</option>
            <option value="RTH">RTH (Hardware Stage 3)</option>
            <option value="BO">BO (Software Stage 1)</option>
            <option value="SME">SME (Software Stage 2)</option>
            <option value="HEAD_NOC">Head NOC (Software Stage 3)</option>
          </select>
        </div>
      </div>

      {/* Pending Reviews */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Pending Reviews ({atps.length})</h2>
        </div>
        
        {atps.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No pending reviews for role: {currentRole}
          </div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ATP Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Site ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SLA Deadline
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {atps.map((atp) => (
                <tr key={atp.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {atp.atp_code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {atp.site_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      atp.document_type === 'hardware' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                      {atp.document_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {atp.current_stage}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(atp as any).currentReviewStage?.sla_deadline ? 
                      new Date((atp as any).currentReviewStage.sla_deadline).toLocaleDateString() : 
                      'N/A'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => fetchATPDetails(atp.id)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ATPReview;
