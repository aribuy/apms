// Cache-bust: deployed at 2025-12-28 12:05 UTC - Fixed duplicate API paths
import React, { useState, useEffect, useCallback } from 'react';
import { Upload, FileText, Search, Eye, Send } from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { apiClient } from '../../utils/apiClient';

interface Task {
  id: string;
  taskCode: string;
  taskType: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  siteId?: string;
  createdAt: string;
  sites?: {
    siteId: string;
    siteName: string;
    region: string;
  };
}

interface TaskListProps {
  viewType: 'all' | 'pending';
}

const TaskList: React.FC<TaskListProps> = ({ viewType }) => {
  const { currentWorkspace } = useWorkspace();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [uploadedDocument, setUploadedDocument] = useState<string | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewDocumentPath, setViewDocumentPath] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (viewType === 'pending') {
        params.status = 'pending';
      }
      if (currentWorkspace?.id) {
        params.workspaceId = currentWorkspace.id;
      }

      const response = await apiClient.get('/api/v1/tasks', { params });
      const data = response.data;
      setTasks(data.success ? data.data : data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace?.id, viewType]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handlePerformTask = (task: Task) => {
    setSelectedTask(task);
    // Check if document already uploaded
    checkExistingDocument(task);
    setShowUploadModal(true);
  };

  const checkExistingDocument = async (task: Task) => {
    try {
      const response = await fetch(`/api/v1/atp/document/${task.taskCode}`);
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

    // Extract site_id properly
    let siteId = selectedTask.sites?.siteId;
    if (!siteId && selectedTask.taskCode) {
      // Extract from task_code format: TSK-SITEID-NUM
      const parts = selectedTask.taskCode.split('-');
      if (parts.length >= 2) {
        siteId = parts[1];
      }
    }
    if (!siteId) siteId = 'UNKNOWN';

    const formData = new FormData();
    formData.append('document', file);
    formData.append('task_code', selectedTask.taskCode);
    formData.append('site_id', siteId);

    try {
      const response = await fetch('/api/v1/atp/upload', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        setUploadedDocument(data.document_path);
        
        // Update task status to in_progress after upload
        await fetch(`/api/v1/tasks/${selectedTask.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'in_progress' })
        });
        
        alert('ATP document uploaded successfully!');
        fetchTasks();
      } else {
        const error = await response.json();
        console.error('Upload error:', error);
        alert('Failed to upload document: ' + error.message);
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Failed to upload document');
    }
  };

  const submitTask = async () => {
    if (!selectedTask) return;

    try {
      const response = await fetch(`/api/v1/tasks/${selectedTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'submitted' })
      });
      
      if (response.ok) {
        alert('Task submitted for approval!');
        setShowUploadModal(false);
        fetchTasks();
      }
    } catch (error) {
      console.error('Error submitting task:', error);
      alert('Failed to submit task');
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
    task.taskCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
      const response = await fetch('/api/v1/atp/bulk-upload', {
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

  const handleSelectTask = (taskId: string) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
  };

  const handleSelectAll = () => {
    const selectableTasks = paginatedTasks.filter(task => 
      task.status === 'in_progress' // Only tasks with uploaded documents that can be submitted
    );
    
    if (selectedTasks.size === selectableTasks.length && selectableTasks.length > 0) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(selectableTasks.map(t => t.id)));
    }
  };

  const handleBulkSubmit = async () => {
    if (selectedTasks.size === 0) return;

    try {
      const promises = Array.from(selectedTasks).map(taskId =>
        fetch(`/api/v1/tasks/${taskId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'submitted' })
        })
      );

      await Promise.all(promises);
      alert(`${selectedTasks.size} tasks submitted for approval!`);
      setSelectedTasks(new Set());
      fetchTasks();
    } catch (error) {
      console.error('Error bulk submitting:', error);
      alert('Failed to submit tasks');
    }
  };

  const viewDocument = async (task: Task) => {
    try {
      const response = await fetch(`/api/v1/atp/document/${task.taskCode}`);
      if (response.ok) {
        const data = await response.json();
        setViewDocumentPath(data.document_path);
        setShowViewModal(true);
      } else {
        alert('No document found for this task');
      }
    } catch (error) {
      console.error('Error fetching document:', error);
      alert('Failed to load document');
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

        {/* Bulk Actions */}
        {selectedTasks.size > 0 && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
            <span className="text-sm text-blue-800">
              {selectedTasks.size} task(s) selected
            </span>
            <button
              onClick={handleBulkSubmit}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Submit Selected
            </button>
          </div>
        )}

        {/* Tasks Table */}
        <div className="w-full">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase w-12">
                  <input
                    type="checkbox"
                    checked={selectedTasks.size > 0 && selectedTasks.size === paginatedTasks.filter(t => t.status === 'in_progress').length}
                    onChange={handleSelectAll}
                    className="rounded"
                    disabled={paginatedTasks.filter(t => t.status === 'in_progress').length === 0}
                  />
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">Task Code</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase w-40">Task & Site Info</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase w-20">Type</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase w-20">Priority</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">Status</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">Created</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedTasks.map((task) => (
                <tr key={task.id} className="hover:bg-gray-50">
                  <td className="px-3 py-3">
                    {(task.status === 'in_progress' || task.status === 'submitted') && (
                      <input
                        type="checkbox"
                        checked={selectedTasks.has(task.id)}
                        onChange={() => handleSelectTask(task.id)}
                        className="rounded"
                        disabled={task.status === 'submitted'}
                      />
                    )}
                  </td>
                  <td className="px-3 py-3 text-sm font-mono text-gray-900">
                    {task.taskCode}
                  </td>
                  <td className="px-3 py-3 text-sm">
                    <div className="font-medium text-gray-900">ATP Document Upload</div>
                    <div className="text-xs text-gray-500 mt-1">
                      <span className="font-medium">{task.sites?.siteId || task.taskCode?.split('-')[1]}</span>
                      {' - '}
                      <span>{task.sites?.siteName || task.title?.replace('ATP Document Upload - ', '') || '-'}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      task.taskType === 'ATP_SOFTWARE' ? 'bg-blue-100 text-blue-800' :
                      task.taskType === 'ATP_HARDWARE' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {task.taskType === 'ATP_SOFTWARE' ? 'SW' : 
                       task.taskType === 'ATP_HARDWARE' ? 'HW' : 'ATP'}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      task.priority === 'high' ? 'bg-red-100 text-red-800' :
                      task.priority === 'normal' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {task.priority === 'high' ? 'H' : task.priority === 'normal' ? 'N' : 'L'}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      task.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      task.status === 'submitted' ? 'bg-purple-100 text-purple-800' :
                      task.status === 'completed' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {task.status === 'pending' ? 'Pending' :
                       task.status === 'in_progress' ? 'Progress' :
                       task.status === 'submitted' ? 'Submitted' :
                       task.status === 'completed' ? 'Done' : task.status}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-500">
                    {new Date(task.createdAt).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: '2-digit',
                      year: '2-digit'
                    })}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex gap-1">
                      {task.status === 'pending' && (
                        <button
                          className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs font-medium"
                          onClick={() => handlePerformTask(task)}
                        >
                          Perform
                        </button>
                      )}
                      {task.status === 'in_progress' && (
                        <>
                          <button
                            className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs font-medium flex items-center gap-1"
                            onClick={() => viewDocument(task)}
                          >
                            <Eye className="w-3 h-3" />
                            View
                          </button>
                          <button
                            className="px-2 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 text-xs font-medium flex items-center gap-1"
                            onClick={() => handlePerformTask(task)}
                          >
                            <Send className="w-3 h-3" />
                            Submit
                          </button>
                        </>
                      )}
                    </div>
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
                <strong>Task:</strong> {selectedTask.taskCode}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <strong>Site:</strong> {selectedTask.sites?.siteId} - {selectedTask.sites?.siteName}
              </p>
              <p className="text-sm text-gray-600 mb-4">
                <strong>Type:</strong> {selectedTask.taskType === 'ATP_SOFTWARE' ? 'Software' : 'Hardware'}
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
                <>
                  <button
                    onClick={() => window.open(`/api/v1/${uploadedDocument}`, '_blank')}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Preview Document
                  </button>
                  <button
                    onClick={submitTask}
                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Submit for Approval
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* View Document Modal */}
      {showViewModal && viewDocumentPath && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Document Preview</h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="h-96 border border-gray-300 rounded overflow-hidden">
              <iframe
                src={`/api/v1/${viewDocumentPath}`}
                className="w-full h-full"
                title="Document Preview"
              />
            </div>
            
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => window.open(`/api/v1/${viewDocumentPath}`, '_blank')}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Open in New Tab
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskList;
