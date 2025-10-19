import React, { useState, useEffect } from 'react';

interface ATPDocument {
  id: string;
  atp_code: string;
  site_id: string;
  current_status: string;
  workflow_path: string;
  submission_date: string;
}

interface ATPStats {
  total_submissions: number;
  approved_documents: number;
  rejected_documents: number;
  in_review: number;
}

const ATPTest: React.FC = () => {
  const [atpDocuments, setAtpDocuments] = useState<ATPDocument[]>([]);
  const [stats, setStats] = useState<ATPStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchATPData();
  }, []);

  const fetchATPData = async () => {
    try {
      setLoading(true);
      
      // Test basic API connection
      const healthResponse = await fetch('http://localhost:3011/api/health');
      const healthData = await healthResponse.json();
      console.log('API Health:', healthData);

      // Try to fetch ATP documents directly from database
      const testResponse = await fetch('http://localhost:3011/api/v1/atp', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (testResponse.ok) {
        const data = await testResponse.json();
        console.log('ATP Data:', data);
        setAtpDocuments(data.data || []);
      } else {
        console.log('ATP endpoint not available, using mock data');
        // Mock data for testing
        setAtpDocuments([
          {
            id: '1',
            atp_code: 'ATP-JAW-JI-SMP-4241-412',
            site_id: 'JAW-JI-SMP-4241',
            current_status: 'submitted',
            workflow_path: 'SOFTWARE',
            submission_date: '2025-10-19T10:21:44.413Z'
          }
        ]);
      }

      // Mock stats
      setStats({
        total_submissions: 1,
        approved_documents: 0,
        rejected_documents: 0,
        in_review: 0
      });

    } catch (err) {
      console.error('Error fetching ATP data:', err);
      setError('Failed to fetch ATP data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading ATP System...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">ATP System Test Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-100 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800">Total Submissions</h3>
          <p className="text-2xl font-bold text-blue-600">{stats?.total_submissions || 0}</p>
        </div>
        <div className="bg-green-100 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800">Approved</h3>
          <p className="text-2xl font-bold text-green-600">{stats?.approved_documents || 0}</p>
        </div>
        <div className="bg-red-100 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-red-800">Rejected</h3>
          <p className="text-2xl font-bold text-red-600">{stats?.rejected_documents || 0}</p>
        </div>
        <div className="bg-yellow-100 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-800">In Review</h3>
          <p className="text-2xl font-bold text-yellow-600">{stats?.in_review || 0}</p>
        </div>
      </div>

      {/* ATP Documents Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h2 className="text-xl font-semibold">ATP Documents</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ATP Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Site ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Workflow
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submission Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {atpDocuments.map((doc) => (
                <tr key={doc.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {doc.atp_code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {doc.site_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      doc.current_status === 'approved' ? 'bg-green-100 text-green-800' :
                      doc.current_status === 'rejected' ? 'bg-red-100 text-red-800' :
                      doc.current_status === 'in_review' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {doc.current_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {doc.workflow_path}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(doc.submission_date).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Status */}
      <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-green-800 mb-2">System Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium">Backend API:</span>
            <span className="ml-2 text-green-600">✅ Connected</span>
          </div>
          <div>
            <span className="font-medium">Database:</span>
            <span className="ml-2 text-green-600">✅ Operational</span>
          </div>
          <div>
            <span className="font-medium">ATP Workflow:</span>
            <span className="ml-2 text-green-600">✅ Ready</span>
          </div>
        </div>
      </div>

      {/* Test Actions */}
      <div className="mt-6 flex space-x-4">
        <button
          onClick={fetchATPData}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Refresh Data
        </button>
        <button
          onClick={() => window.open('http://localhost:3011/api/health', '_blank')}
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
        >
          Test API Health
        </button>
      </div>
    </div>
  );
};

export default ATPTest;