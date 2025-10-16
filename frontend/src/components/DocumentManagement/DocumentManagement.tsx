import React, { useState } from 'react';
import { Project } from './types';
import ProjectList from './ProjectList';
import ProjectForm from './ProjectForm';
import ProjectDetails from './ProjectDetails';

type ViewType = 'list' | 'form' | 'details';

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
        <ProjectList 
          onCreateProject={handleCreateProject}
          onEditProject={handleEditProject}
          onViewProject={handleViewProject}
        />
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
    </div>
  );
};

export default DocumentManagement;
