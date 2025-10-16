import React, { useState, useEffect } from 'react';
import { Project, ProjectFormData, Organization, APIResponse } from './types';

interface ProjectFormProps {
  projectId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ projectId, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState<ProjectFormData>({
    projectNumber: '',
    name: '',
    description: '',
    executionType: 'internal',
    organizationId: '',
    workgroupId: '',
    customerRef: '',
    poNumber: '',
    budget: undefined,
    startDate: '',
    endDate: '',
    status: 'draft'
  });

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [isEdit, setIsEdit] = useState(false);

  // Fetch organizations for dropdown
  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/v1/organizations/list');
      const data: APIResponse<Organization[]> = await response.json();
      
      if (data.success && data.data) {
        setOrganizations(data.data);
      }
    } catch (err) {
      console.error('Error fetching organizations:', err);
    }
  };

  // Fetch project data if editing
  const fetchProject = async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/v1/projects/${projectId}`);
      const data: APIResponse<Project> = await response.json();
      
      if (data.success && data.data) {
        const project = data.data;
        setFormData({
          projectNumber: project.projectNumber,
          name: project.name,
          description: project.description || '',
          executionType: project.executionType,
          organizationId: project.organizationId,
          workgroupId: project.workgroupId || '',
          customerRef: project.customerRef || '',
          poNumber: project.poNumber || '',
          budget: project.budget || undefined,
          startDate: project.startDate ? project.startDate.split('T')[0] : '',
          endDate: project.endDate ? project.endDate.split('T')[0] : '',
          status: project.status || 'draft'
        });
        setIsEdit(true);
      } else {
        setError(data.error || 'Failed to fetch project');
      }
    } catch (err) {
      setError('Network error while fetching project');
      console.error('Error fetching project:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.projectNumber || !formData.name || !formData.organizationId) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const url = isEdit ? `/api/v1/projects/${projectId}` : '/api/v1/projects/create';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data: APIResponse<Project> = await response.json();
      
      if (data.success) {
        if (onSuccess) onSuccess();
      } else {
        setError(data.error || `Failed to ${isEdit ? 'update' : 'create'} project`);
      }
    } catch (err) {
      setError(`Network error while ${isEdit ? 'updating' : 'creating'} project`);
      console.error('Error submitting project:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'budget' ? (value ? parseFloat(value) : undefined) : value
    }));
  };

  useEffect(() => {
    fetchOrganizations();
    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-full mx-4 sm:max-w-4xl sm:mx-auto">
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            {isEdit ? 'Edit Project' : 'Create New Project'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Project Number */}
            <div>
              <label htmlFor="projectNumber" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Project Number *
              </label>
              <input
                type="text"
                id="projectNumber"
                name="projectNumber"
                required
                value={formData.projectNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="PRJ-2025-001"
              />
            </div>

            {/* Project Name */}
            <div>
              <label htmlFor="name" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Project Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Tower Installation Project"
              />
            </div>

            {/* Execution Type */}
            <div>
              <label htmlFor="executionType" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Execution Type *
              </label>
              <select
                id="executionType"
                name="executionType"
                required
                value={formData.executionType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="internal">Internal</option>
                <option value="subcontractor">Subcontractor</option>
              </select>
            </div>

            {/* Organization */}
            <div>
              <label htmlFor="organizationId" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Organization *
              </label>
              <select
                id="organizationId"
                name="organizationId"
                required
                value={formData.organizationId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Organization</option>
                {organizations.map(org => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Customer Reference */}
            <div>
              <label htmlFor="customerRef" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Customer Reference
              </label>
              <input
                type="text"
                id="customerRef"
                name="customerRef"
                value={formData.customerRef}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Customer project ID"
              />
            </div>

            {/* PO Number */}
            <div>
              <label htmlFor="poNumber" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                PO Number
              </label>
              <input
                type="text"
                id="poNumber"
                name="poNumber"
                value={formData.poNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Purchase Order Number"
              />
            </div>

            {/* Budget */}
            <div>
              <label htmlFor="budget" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Budget (Rp)
              </label>
              <input
                type="number"
                id="budget"
                name="budget"
                value={formData.budget || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
                step="0.01"
              />
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="draft">Draft</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="on_hold">On Hold</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label htmlFor="startDate" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* End Date */}
            <div>
              <label htmlFor="endDate" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Project description..."
            />
          </div>

          {/* Form Actions */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end sm:space-x-3 sm:gap-0 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-2 sm:px-4 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-3 py-2 sm:px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : (isEdit ? 'Update Project' : 'Create Project')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectForm;
