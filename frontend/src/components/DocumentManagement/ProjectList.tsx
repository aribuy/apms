import React, { useState, useEffect } from 'react';
import { Project, APIResponse } from './types';

interface ProjectListProps {
  onCreateProject: () => void;
  onEditProject: (project: Project) => void;
  onViewProject: (projectId: string) => void;
}

const ProjectList: React.FC<ProjectListProps> = ({ onCreateProject, onEditProject, onViewProject }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/projects/list');
      const data: APIResponse<Project[]> = await response.json();
      
      if (data.success && data.data) {
        setProjects(data.data);
        setError('');
      } else {
        setError(data.error || 'Failed to fetch projects');
      }
    } catch (err) {
      setError('Network error while fetching projects');
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (projectId: string) => {
    if (!window.confirm('Are you sure you want to delete this project?')) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/projects/${projectId}`, {
        method: 'DELETE',
      });
      const data: APIResponse<any> = await response.json();
      
      if (data.success) {
        setProjects(projects.filter(p => p.id !== projectId));
      } else {
        setError(data.error || 'Failed to delete project');
      }
    } catch (err) {
      setError('Network error while deleting project');
      console.error('Error deleting project:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status?: string) => {
    const statusColors = {
      draft: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      on_hold: 'bg-yellow-100 text-yellow-800',
    };
    
    const color = statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800';
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
        {status || 'draft'}
      </span>
    );
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600">Manage your project portfolio</p>
        </div>
        <button onClick={onCreateProject} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 sm:px-4 rounded-lg flex items-center space-x-1 sm:space-x-2">
          <span>+</span>
          <span>New Project</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={fetchProjects}
          className="text-blue-600 hover:text-blue-800 px-3 py-1 text-sm"
        >
          Refresh
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">No projects found</div>
          <p className="text-gray-400 mt-2">Create your first project to get started</p>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg overflow-x-auto">
          <table className="min-w-[700px] w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {projects.map((project) => (
                <tr key={project.id} className="hover:bg-gray-50">
                  <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                    <div>
                      <div className="text-xs sm:text-sm font-medium text-gray-900">
                        {project.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {project.projectNumber}
                      </div>
                      {project.description && (
                        <div className="text-sm text-gray-400 truncate max-w-[120px] sm:max-w-xs">
                          {project.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900 capitalize">
                      {project.executionType}
                    </span>
                  </td>
                  <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                    {getStatusBadge(project.status)}
                  </td>
                  <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(project.createdAt)}
                  </td>
                  <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium space-x-1 sm:space-x-2">
                    <button onClick={() => onViewProject(project.id)} className="text-blue-600 hover:text-blue-900">
                      View
                    </button>
                    <button onClick={() => onEditProject(project)} className="text-indigo-600 hover:text-indigo-900">
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(project.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="text-sm text-gray-500">
        Showing {projects.length} project{projects.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
};

export default ProjectList;
