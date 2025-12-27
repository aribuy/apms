import React, { useState } from 'react';
import { Project } from './types';
import ProjectList from './ProjectList';
import ProjectForm from './ProjectForm';
import ProjectDetails from './ProjectDetails';
import ATPDocumentGenerator from './ATPDocumentGenerator';
import { FileText, Plus } from 'lucide-react';

type ViewType = 'list' | 'form' | 'details' | 'atp-generator';

const DocumentManagement: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('list');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [editingProject, setEditingProject] = useState<Project | undefined>();

  const handleCreateProject = () => {
    setEditingProject(undefined);
    setCurrentView('form');
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setCurrentView('form');
  };

  const handleViewProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setCurrentView('details');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedProjectId('');
    setEditingProject(undefined);
  };

  const handleFormSuccess = () => {
    setCurrentView('list');
    setEditingProject(undefined);
  };

  // Mobile responsive container
  return (
    <div className="p-4 sm:p-6">
      {currentView === 'list' && (
        <div>
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleCreateProject}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Plus className="mr-2" size={16} />
              Create Project
            </button>
            <button
              onClick={() => setCurrentView('atp-generator')}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
            >
              <FileText className="mr-2" size={16} />
              ATP Document Generator
            </button>
          </div>
          <ProjectList 
            onCreateProject={handleCreateProject}
            onEditProject={handleEditProject}
            onViewProject={handleViewProject}
          />
        </div>
      )}
      
      {currentView === 'form' && (
        <ProjectForm
          projectId={editingProject?.id}
          onSuccess={handleFormSuccess}
          onCancel={handleBackToList}
        />
      )}
      
      {currentView === 'details' && selectedProjectId && (
        <ProjectDetails
          projectId={selectedProjectId}
          onBack={handleBackToList}
          onEdit={handleEditProject}
        />
      )}
      
      {currentView === 'atp-generator' && (
        <div>
          <button
            onClick={handleBackToList}
            className="mb-4 text-blue-600 hover:text-blue-700 flex items-center"
          >
            ← Back to Document Management
          </button>
          <ATPDocumentGenerator />
        </div>
      )}
    </div>
  );
};

export default DocumentManagement;
