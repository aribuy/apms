import React, { useState, useEffect, useCallback } from 'react';
import { 
  ArrowLeft, Edit2, Trash2, Calendar, 
  DollarSign, FileText, Upload, Download, Eye
} from 'lucide-react';
import DocumentUploadModal from './DocumentUploadModal';
import { Project, APIResponse } from './types';

interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  uploadedBy: string;
}

interface ProjectDetailsProps {
  projectId: string;
  onBack: () => void;
  onEdit: (project: Project) => void;
}

const ProjectDetails: React.FC<ProjectDetailsProps> = ({ 
  projectId, 
  onBack, 
  onEdit 
}) => {
  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'documents'>('overview');
  const [uploadModalOpen, setUploadModalOpen] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);

  const fetchProject = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/projects/${projectId}`);
      const data: APIResponse<Project> = await response.json();
      
      if (data.success && data.data) {
        setProject(data.data);
        setError('');
      } else {
        setError(data.error || 'Failed to fetch project');
      }
    } catch (err) {
      setError('Network error while fetching project');
      console.error('Error fetching project:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const handleDocumentUpload = async (files: File[]) => {
    setUploading(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("projectId", projectId);
        
        const response = await fetch(`/api/v1/projects/${projectId}/documents`, {
          method: "POST",
          body: formData
        });
        
        if (!response.ok) {
          throw new Error("Upload failed");
        }
      }
      
      await fetchDocuments(); // Refresh document list
      setUploadModalOpen(false);
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };
  const fetchDocuments = useCallback(async () => {
    try {
      const response = await fetch(`/api/v1/projects/${projectId}/documents`);
      const data: APIResponse<Document[]> = await response.json();
      
      if (data.success && data.data) {
        setDocuments(data.data);
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProject();
    fetchDocuments();
  }, [fetchProject, fetchDocuments]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount?: number) => {
    return amount ? `$${amount.toLocaleString()}` : 'Not set';
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-lg">{error || 'Project not found'}</div>
        <button 
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Back to Projects
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-sm text-gray-600">{project.projectNumber}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(project)}
            className="px-3 py-2 sm:px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center"
          >
            <Edit2 className="w-4 h-4 mr-2" />
            Edit
          </button>
          <button className="px-3 py-2 sm:px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      {/* Status Badge */}
      <div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
          {project.status || 'Draft'}
        </span>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'documents'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Documents ({documents.length})
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'overview' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <h3 className="text-lg font-semibold mb-4">Project Information</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Execution Type</label>
                  <div className="mt-1 capitalize text-gray-900">{project.executionType}</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500">Customer Reference</label>
                  <div className="mt-1 text-gray-900">{project.customerRef || 'Not specified'}</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500">PO Number</label>
                  <div className="mt-1 text-gray-900">{project.poNumber || 'Not specified'}</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500">Budget</label>
                  <div className="mt-1 text-gray-900 flex items-center">
                    <DollarSign className="w-4 h-4 mr-1 text-gray-400" />
                    {formatCurrency(project.budget)}
                  </div>
                </div>
              </div>
              
              {project.description && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-500">Description</label>
                  <div className="mt-1 text-gray-900">{project.description}</div>
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Timeline
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Start Date</label>
                  <div className="mt-1 text-gray-900">
                    {project.startDate ? formatDate(project.startDate) : 'Not set'}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500">End Date</label>
                  <div className="mt-1 text-gray-900">
                    {project.endDate ? formatDate(project.endDate) : 'Not set'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Created</span>
                  <span className="font-medium">{formatDate(project.createdAt)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Updated</span>
                  <span className="font-medium">{formatDate(project.updatedAt)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Documents</span>
                  <span className="font-medium">{documents.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Documents Tab */
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-lg font-semibold">Project Documents</h3>
              <button onClick={() => setUploadModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
                <Upload className="w-4 h-4 mr-2" />
                Upload Document
              </button>
            </div>
          </div>
          
          <div className="p-4 sm:p-6">
            {documents.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <div className="text-gray-500">No documents uploaded yet</div>
                <p className="text-gray-400 mt-2">Upload your first document to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <div>
                        <div className="font-medium text-gray-900">{doc.name}</div>
                        <div className="text-sm text-gray-500">
                          {doc.type} • {(doc.size / 1024).toFixed(1)} KB • {formatDate(doc.uploadedAt)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-green-600 hover:bg-green-50 rounded">
                        <Download className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-red-600 hover:bg-red-50 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Document Upload Modal */}
      {uploadModalOpen && (
        <DocumentUploadModal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          onUpload={handleDocumentUpload}
          uploading={uploading}
        />
      )}
    </div>
  );
};

      
export default ProjectDetails;
