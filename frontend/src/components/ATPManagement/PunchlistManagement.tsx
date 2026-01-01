import React, { useState, useEffect, useCallback } from 'react';
import { Wrench, CheckCircle, Clock, AlertTriangle, Camera, FileText, MapPin } from 'lucide-react';

interface PunchlistItem {
  id: string;
  punchlist_number: string;
  atp_id: string;
  atp_code: string;
  site_id: string;
  issue_description: string;
  severity: 'critical' | 'major' | 'minor';
  status: 'identified' | 'in_progress' | 'rectified' | 'verified';
  assigned_team: string;
  target_completion_date: string;
  evidence_before?: any[];
  evidence_after?: any[];
  rectification_notes?: string;
  identified_at: string;
}

interface PunchlistManagementProps {
  userRole: string;
}

const PunchlistManagement: React.FC<PunchlistManagementProps> = ({ userRole }) => {
  const [punchlistItems, setPunchlistItems] = useState<PunchlistItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<PunchlistItem | null>(null);
  const [selectedTab, setSelectedTab] = useState<'active' | 'completed'>('active');
  const [loading, setLoading] = useState(true);
  const [rectificationNotes, setRectificationNotes] = useState('');
  const [beforeEvidence, setBeforeEvidence] = useState<File[]>([]);
  const [afterEvidence, setAfterEvidence] = useState<File[]>([]);

  const fetchPunchlistItems = useCallback(async () => {
    try {
      // Mock data for demonstration
      const mockItems: PunchlistItem[] = [
        {
          id: '1',
          punchlist_number: 'PL-2025-0001',
          atp_id: 'atp-1',
          atp_code: 'ATP-2025-0001',
          site_id: 'JKTB001',
          issue_description: 'Sync intervals set to 60 seconds, standard requires 30-second intervals for optimal data consistency.',
          severity: 'major',
          status: 'identified',
          assigned_team: 'Field Engineering Team',
          target_completion_date: '2025-01-20',
          identified_at: '2025-01-15T10:30:00Z'
        },
        {
          id: '2',
          punchlist_number: 'PL-2025-0002',
          atp_id: 'atp-1',
          atp_code: 'ATP-2025-0001',
          site_id: 'JKTB001',
          issue_description: 'Missing version control information in document header.',
          severity: 'minor',
          status: 'in_progress',
          assigned_team: 'Documentation Team',
          target_completion_date: '2025-01-18',
          identified_at: '2025-01-15T10:30:00Z'
        }
      ];
      setPunchlistItems(mockItems);
    } catch (error) {
      console.error('Error fetching punchlist items:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPunchlistItems();
  }, [fetchPunchlistItems]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'identified':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'rectified':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'major':
        return 'bg-orange-100 text-orange-800';
      case 'minor':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    const files = Array.from(event.target.files || []);
    if (type === 'before') {
      setBeforeEvidence(prev => [...prev, ...files]);
    } else {
      setAfterEvidence(prev => [...prev, ...files]);
    }
  };

  const handleStartRectification = (item: PunchlistItem) => {
    setSelectedItem(item);
    setRectificationNotes('');
    setBeforeEvidence([]);
    setAfterEvidence([]);
  };

  const handleCompleteRectification = async () => {
    if (!selectedItem) return;

    try {
      const formData = new FormData();
      formData.append('punchlistId', selectedItem.id);
      formData.append('rectificationNotes', rectificationNotes);
      
      beforeEvidence.forEach((file, index) => {
        formData.append(`beforeEvidence_${index}`, file);
      });
      
      afterEvidence.forEach((file, index) => {
        formData.append(`afterEvidence_${index}`, file);
      });

      const response = await fetch(`/api/v1/atp/punchlist/${selectedItem.id}/complete`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        alert('Rectification completed successfully!');
        setSelectedItem(null);
        fetchPunchlistItems();
      } else {
        alert('Failed to complete rectification');
      }
    } catch (error) {
      console.error('Error completing rectification:', error);
      alert('Error completing rectification');
    }
  };

  const activeItems = punchlistItems.filter(item => 
    item.status === 'identified' || item.status === 'in_progress'
  );
  const completedItems = punchlistItems.filter(item => 
    item.status === 'rectified' || item.status === 'verified'
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Wrench className="mr-3 h-6 w-6 text-blue-600" />
            Punchlist Management
          </h1>
          <p className="text-gray-600 mt-1">Track and resolve ATP document issues</p>
        </div>

        {/* Summary Cards */}
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-red-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">Active Tasks</p>
                  <p className="text-2xl font-bold text-red-900">{activeItems.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-yellow-800">Due Today</p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {activeItems.filter(item => {
                      const today = new Date().toISOString().split('T')[0];
                      return item.target_completion_date === today;
                    }).length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center">
                <Wrench className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-800">In Progress</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {activeItems.filter(item => item.status === 'in_progress').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">Completed</p>
                  <p className="text-2xl font-bold text-green-900">{completedItems.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setSelectedTab('active')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === 'active'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Active Tasks ({activeItems.length})
              </button>
              <button
                onClick={() => setSelectedTab('completed')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === 'completed'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Completed ({completedItems.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Punchlist Items */}
        <div className="p-6">
          {selectedTab === 'active' && (
            <div className="space-y-4">
              {activeItems.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No active punchlist items</h3>
                  <p className="mt-1 text-sm text-gray-500">All issues have been resolved.</p>
                </div>
              ) : (
                activeItems.map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">{item.punchlist_number}</h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(item.severity)}`}>
                            {item.severity.toUpperCase()}
                          </span>
                          <div className="flex items-center">
                            {getStatusIcon(item.status)}
                            <span className="ml-1 text-sm text-gray-600 capitalize">{item.status.replace('_', ' ')}</span>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <p className="text-gray-700">{item.issue_description}</p>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-1" />
                            ATP: {item.atp_code}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            Site: {item.site_id}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            Due: {new Date(item.target_completion_date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleStartRectification(item)}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                          <Wrench className="h-4 w-4 mr-1" />
                          {item.status === 'identified' ? 'Start Rectification' : 'Continue'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {selectedTab === 'completed' && (
            <div className="space-y-4">
              {completedItems.length === 0 ? (
                <div className="text-center py-8">
                  <Wrench className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No completed items</h3>
                  <p className="mt-1 text-sm text-gray-500">Completed rectifications will appear here.</p>
                </div>
              ) : (
                completedItems.map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">{item.punchlist_number}</h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(item.severity)}`}>
                            {item.severity.toUpperCase()}
                          </span>
                          <div className="flex items-center">
                            {getStatusIcon(item.status)}
                            <span className="ml-1 text-sm text-green-600 capitalize">{item.status}</span>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <p className="text-gray-700">{item.issue_description}</p>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-1" />
                            ATP: {item.atp_code}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            Site: {item.site_id}
                          </div>
                          <div className="flex items-center">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Completed: {new Date(item.target_completion_date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Rectification Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Rectification - {selectedItem.punchlist_number}
                </h3>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Issue Details */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Issue Description</h4>
                  <p className="text-gray-700">{selectedItem.issue_description}</p>
                  <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                    <span>Severity: {selectedItem.severity.toUpperCase()}</span>
                    <span>Site: {selectedItem.site_id}</span>
                    <span>Due: {new Date(selectedItem.target_completion_date).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Evidence Upload */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Before Evidence</h4>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      <div className="text-center">
                        <Camera className="mx-auto h-8 w-8 text-gray-400" />
                        <div className="mt-2">
                          <label htmlFor="before-upload" className="cursor-pointer">
                            <span className="text-sm font-medium text-gray-900">Upload photos</span>
                            <span className="block text-xs text-gray-500">Current state documentation</span>
                          </label>
                          <input
                            id="before-upload"
                            type="file"
                            multiple
                            accept="image/*"
                            className="sr-only"
                            onChange={(e) => handleFileUpload(e, 'before')}
                          />
                        </div>
                      </div>
                    </div>
                    {beforeEvidence.length > 0 && (
                      <div className="mt-2 text-sm text-gray-600">
                        {beforeEvidence.length} file(s) selected
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">After Evidence</h4>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      <div className="text-center">
                        <Camera className="mx-auto h-8 w-8 text-gray-400" />
                        <div className="mt-2">
                          <label htmlFor="after-upload" className="cursor-pointer">
                            <span className="text-sm font-medium text-gray-900">Upload photos</span>
                            <span className="block text-xs text-gray-500">Corrected state documentation</span>
                          </label>
                          <input
                            id="after-upload"
                            type="file"
                            multiple
                            accept="image/*"
                            className="sr-only"
                            onChange={(e) => handleFileUpload(e, 'after')}
                          />
                        </div>
                      </div>
                    </div>
                    {afterEvidence.length > 0 && (
                      <div className="mt-2 text-sm text-gray-600">
                        {afterEvidence.length} file(s) selected
                      </div>
                    )}
                  </div>
                </div>

                {/* Rectification Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rectification Notes *
                  </label>
                  <textarea
                    value={rectificationNotes}
                    onChange={(e) => setRectificationNotes(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe the actions taken to resolve this issue..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCompleteRectification}
                    disabled={!rectificationNotes.trim() || afterEvidence.length === 0}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Complete Rectification
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PunchlistManagement;
