import React, { useState, useEffect, useCallback } from 'react';
import { Upload, FileText, CheckCircle, AlertTriangle, Clock, Eye, Zap } from 'lucide-react';
import ATPReview from './ATPReview';
import MWATPForm from './MWATPForm';
import DigitalFormBuilder from './DigitalFormBuilder';
import { usePermissions } from '../../hooks/usePermissions';
import ScopeSelector from './ScopeSelector';

interface ATP {
  id: string;
  atp_code?: string;
  atpCode?: string;
  site_id?: string;
  siteId?: string;
  document_type?: string;
  documentType?: string;
  workflow_path?: string;
  workflowPath?: string;
  current_stage?: string;
  currentStage?: string;
  current_status?: string;
  currentStatus?: string;
  submission_date?: string;
  submissionDate?: string;
  completion_percentage?: number;
  completionPercentage?: number;
  atp_review_stages?: any[];
  atp_punchlist_items?: any[];
}

const ATPManagement: React.FC = () => {
  const { canUploadATP, canReviewATP } = usePermissions();
  const [activeTab, setActiveTab] = useState(canUploadATP() ? 'submission' : 'review');
  const [atps, setAtps] = useState<ATP[]>([]);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [siteId, setSiteId] = useState('');
  const [selectedScope, setSelectedScope] = useState<number>(0);
  const [scopeName, setScopeName] = useState<string>('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [showDigitalForm, setShowDigitalForm] = useState(false);
  const [currentAtpId, setCurrentAtpId] = useState<string>('');

  const fetchATPs = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3011/api/v1/atp');
      const data = await response.json();
      setAtps(data);
    } catch (error) {
      console.error('Error fetching ATPs:', error);
    }
  }, []);

  useEffect(() => {
    fetchATPs();
  }, [fetchATPs]);

  const handleFileUpload = async () => {
    if (!uploadFile || !siteId || !selectedScope) {
      alert('Please select a file, enter site ID, and select site type');
      return;
    }

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('siteId', siteId);
    formData.append('scopeId', selectedScope.toString());

    try {
      const response = await fetch('http://localhost:3011/api/v1/atp/upload-analyze', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      setAnalysis(data);
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  const submitATP = async () => {
    if (!analysis) return;

    try {
      const response = await fetch('http://localhost:3011/api/v1/atp/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId: analysis.fileId,
          siteId,
          confirmedCategory: analysis.analysis.detectedCategory,
          projectCode: 'XLSMART-2025'
        })
      });
      const data = await response.json();
      
      // Check if MW scope - redirect to digital form
      if (scopeName === 'MW' || scopeName === 'MW Upgrade') {
        setCurrentAtpId(data.atpId);
        setShowDigitalForm(true);
        setAnalysis(null);
      } else {
        alert(`ATP submitted successfully: ${data.atpCode}`);
        setAnalysis(null);
        setUploadFile(null);
        setSiteId('');
        fetchATPs();
      }
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  const handleMWFormSubmit = (formData: any) => {
    alert('MW ATP form submitted successfully!');
    setShowDigitalForm(false);
    setCurrentAtpId('');
    setUploadFile(null);
    setSiteId('');
    setSelectedScope(0);
    setScopeName('');
    fetchATPs();
  };

  const quickApprove = async (atpId: string) => {
    if (!window.confirm('Quick approve this ATP? (For testing only)')) return;
    
    try {
      const response = await fetch(`http://localhost:3011/api/v1/atp/${atpId}/quick-approve`, {
        method: 'POST'
      });
      const result = await response.json();
      
      if (result.success) {
        alert('ATP quick approved successfully!');
        fetchATPs();
      } else {
        alert('Failed to quick approve ATP');
      }
    } catch (error) {
      console.error('Quick approve error:', error);
      alert('Error during quick approve');
    }
  };

  const viewDetails = async (atpId: string) => {
    try {
      const response = await fetch(`http://localhost:3011/api/v1/atp/${atpId}`);
      const data = await response.json();
      
      const details = [
        `ATP Code: ${data.atp_code}`,
        `Site ID: ${data.site_id}`,
        `Type: ${data.document_type}`,
        `Status: ${data.current_status}`,
        `Stage: ${data.current_stage}`,
        `Progress: ${data.completion_percentage || 0}%`,
        `\nReview Stages:`,
        ...data.atp_review_stages.map((stage: any) => 
          `- ${stage.stage_name}: ${stage.review_status} ${stage.decision ? '(' + stage.decision + ')' : ''}`
        )
      ];
      
      if (data.atp_punchlist_items && data.atp_punchlist_items.length > 0) {
        details.push('\nPunchlist Items:');
        details.push(...data.atp_punchlist_items.map((item: any) => 
          `- [${item.severity}] ${item.issue_description}`
        ));
      }
      
      alert(details.join('\n'));
    } catch (error) {
      console.error('View details error:', error);
      alert('Error fetching ATP details');
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'approved': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending_review': return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'pending_review_with_punchlist': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'rejected': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default: return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">E-ATP</h1>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {canUploadATP() && (
            <button
              onClick={() => setActiveTab('submission')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'submission'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              ATP Upload
            </button>
          )}
          {canReviewATP() && (
            <button
              onClick={() => setActiveTab('review')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'review'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              ATP Review
            </button>
          )}
          <button
            onClick={() => setActiveTab('list')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'list'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            ATP List
          </button>
        </nav>
      </div>

      {activeTab === 'submission' && canUploadATP() && (
        <div>
          {showDigitalForm && currentAtpId ? (
            // MW ATP Digital Form
            scopeName === 'MW' || scopeName === 'MW Upgrade' ? (
              <MWATPForm
                atpId={currentAtpId}
                scopeType={scopeName === 'MW' ? 'MW' : 'MW_UPGRADE'}
                onFormSubmit={handleMWFormSubmit}
              />
            ) : (
              <DigitalFormBuilder
                atpId={currentAtpId}
                category={scopeName?.includes('software') ? 'software' : 'hardware'}
                onFormSubmit={handleMWFormSubmit}
              />
            )
          ) : (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Submit New ATP</h2>
              
              {!analysis ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Site ID
                </label>
                <input
                  type="text"
                  value={siteId}
                  onChange={(e) => setSiteId(e.target.value)}
                  placeholder="e.g., KAL-KB-SBS-0730"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Site Type
                </label>
                <ScopeSelector
                  value={selectedScope}
                  onChange={(scopeId, scopeName) => {
                    setSelectedScope(scopeId);
                    setScopeName(scopeName || '');
                  }}
                  showDetails={true}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ATP Document
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <button
                onClick={handleFileUpload}
                disabled={!uploadFile || !siteId}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                <Upload className="w-4 h-4 inline mr-2" />
                Upload & Analyze
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded">
                <h3 className="font-semibold mb-2">Document Analysis Results</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Detected Category:</span> {analysis.analysis.detectedCategory}</p>
                  <p><span className="font-medium">Confidence:</span> {analysis.analysis.confidence}%</p>
                  <p><span className="font-medium">Suggested Workflow:</span> {analysis.analysis.suggestedWorkflow}</p>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={submitATP}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
                >
                  Confirm & Submit
                </button>
                <button
                  onClick={() => setAnalysis(null)}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'review' && canReviewATP() && (
        <ATPReview />
      )}

      {activeTab === 'list' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold">All ATPs ({atps.length})</h2>
            <button
              onClick={fetchATPs}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Refresh
            </button>
          </div>
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
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {atps.map((atp) => (
                <tr key={atp.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {atp.atp_code || atp.atpCode}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {atp.site_id || atp.siteId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      (atp.document_type || atp.documentType) === 'hardware' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                      {atp.document_type || atp.documentType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {atp.current_stage || atp.currentStage}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      {getStatusIcon(atp.current_status || atp.currentStatus || 'pending')}
                      <span className="ml-2">{atp.current_status || atp.currentStatus || 'pending'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${atp.completion_percentage || atp.completionPercentage || 0}%` }}
                      ></div>
                    </div>
                    <span className="text-xs">{atp.completion_percentage || atp.completionPercentage || 0}%</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => quickApprove(atp.id)}
                        className="text-green-600 hover:text-green-800 flex items-center"
                        title="Quick Approve (Testing)"
                      >
                        <Zap className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => viewDetails(atp.id)}
                        className="text-blue-600 hover:text-blue-800 flex items-center"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ATPManagement;
