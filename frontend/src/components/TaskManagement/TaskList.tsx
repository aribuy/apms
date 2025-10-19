import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, AlertCircle, ArrowRight, Upload, FileText, Search } from 'lucide-react';

interface Task {
  id: string;
  task_code: string;
  task_type: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  site_id?: string;
  created_at: string;
  sites?: {
    site_id: string;
    site_name: string;
    region: string;
  };
}

interface TaskListProps {
  viewType: 'all' | 'pending';
}

const TaskList: React.FC<TaskListProps> = ({ viewType }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [uploadedDocument, setUploadedDocument] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
  }, [viewType]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const endpoint = viewType === 'pending' 
        ? 'http://localhost:3011/api/v1/tasks?status=pending'
        : 'http://localhost:3011/api/v1/tasks';
      
      const response = await fetch(endpoint);
      
      if (response.ok) {
        const data = await response.json();
        setTasks(data.success ? data.data : data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'normal':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const performTask = async (taskId: string) => {
    try {
      const response = await fetch(`http://localhost:3011/api/v1/tasks/${taskId}/complete`, {
        method: 'POST'
      });
      
      if (response.ok) {
        alert('Task completed successfully!');
        fetchTasks(); // Refresh task list
      }
    } catch (error) {
      console.error('Error completing task:', error);
      alert('Failed to complete task');
    }
  };

  const handlePerformTask = (task: Task) => {
    setSelectedTask(task);
    // Check if document already uploaded
    checkExistingDocument(task);
    setShowUploadModal(true);
  };

  const checkExistingDocument = async (task: Task) => {
    try {
      const response = await fetch(`http://localhost:3011/api/v1/atp/document/${task.task_code}`);
      if (response.ok) {
        const data = await response.json();
        setUploadedDocument(data.document_path || null);
      } else {
        setUploadedDocument(null);
      }
    } catch (error) {
      setUploadedDocument(null);
    }
  };

  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedTask) return;

    const formData = new FormData();
    formData.append('document', file);
    formData.append('task_code', selectedTask.task_code);
    formData.append('site_id', selectedTask.sites?.site_id || '');

    try {
      const response = await fetch('http://localhost:3011/api/v1/atp/upload', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        setUploadedDocument(data.document_path);
        alert('ATP document uploaded successfully!');
        fetchTasks();
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Failed to upload document');
    }
  };

  const completeTask = async () => {
    if (!selectedTask) return;

    try {
      const response = await fetch(`http://localhost:3011/api/v1/tasks/${selectedTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      });
      
      if (response.ok) {
        alert('Task completed successfully!');
        setShowUploadModal(false);
        fetchTasks();
      }
    } catch (error) {
      console.error('Error completing task:', error);
      alert('Failed to complete task');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading tasks...</div>
      </div>
    );
  }

  const filteredTasks = tasks.filter(task => 
    task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.task_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTasks = filteredTasks.slice(startIndex, startIndex + itemsPerPage);

  const handleBulkUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('documents', file);
    });

    try {
      const response = await fetch('http://localhost:3011/api/v1/atp/bulk-upload', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        alert('ATP documents uploaded successfully!');
        fetchTasks();
        setShowBulkUpload(false);
      }
    } catch (error) {
      console.error('Error uploading documents:', error);
      alert('Failed to upload documents');
    }
  };

  return (
    <div className="space-y-6">
      {/* Bulk Upload Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Bulk ATP Document Upload</h3>
          <button
            onClick={() => setShowBulkUpload(!showBulkUpload)}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload Documents
          </button>
        </div>
        
        {showBulkUpload && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx"
              onChange={handleBulkUpload}
              className="w-full"
            />
            <p className="text-sm text-gray-500 mt-2">
              Select multiple PDF or Word documents to upload
            </p>
          </div>
        )}
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Tasks Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ATP Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedTasks.map((task) => (
                <tr key={task.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {task.task_code}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="font-medium">ATP Document Upload</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs ${
                      task.task_type === 'ATP_SOFTWARE' ? 'bg-blue-100 text-blue-800' :
                      task.task_type === 'ATP_HARDWARE' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {task.task_type === 'ATP_SOFTWARE' ? 'Software' : 
                       task.task_type === 'ATP_HARDWARE' ? 'Hardware' : 'ATP'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {task.sites?.site_id || task.task_code?.split('-')[1] || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {task.sites?.site_name || task.title?.replace('ATP Document Upload - ', '') || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs ${
                      task.priority === 'high' ? 'bg-red-100 text-red-800' :
                      task.priority === 'normal' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs ${
                      task.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      task.status === 'completed' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(task.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {task.status === 'pending' && (
                      <button
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-1 text-xs"
                        onClick={() => handlePerformTask(task)}
                      >
                        <ArrowRight className="w-3 h-3" />Perform
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-700">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredTasks.length)} of {filteredTasks.length} tasks
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 border rounded text-sm ${
                    currentPage === page
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {filteredTasks.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No {viewType === 'pending' ? 'pending' : ''} tasks found
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              Upload ATP Document
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Task:</strong> {selectedTask.task_code}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <strong>Site:</strong> {selectedTask.sites?.site_id} - {selectedTask.sites?.site_name}
              </p>
              <p className="text-sm text-gray-600 mb-4">
                <strong>Type:</strong> {selectedTask.task_type === 'ATP_SOFTWARE' ? 'Software' : 'Hardware'}
              </p>
            </div>

            {uploadedDocument ? (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-800">Document already uploaded</span>
                </div>
                <p className="text-xs text-green-600 mt-1">{uploadedDocument}</p>
              </div>
            ) : (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select ATP Document
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleDocumentUpload}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supported formats: PDF, DOC, DOCX
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowUploadModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              {uploadedDocument && (
                <button
                  onClick={completeTask}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Complete Task
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskList;
