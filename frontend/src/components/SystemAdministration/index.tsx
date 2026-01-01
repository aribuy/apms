import React, { useState } from 'react';
import { ShieldCheck, LayoutGrid, Activity } from 'lucide-react';
import WorkspaceManagement from '../UserManagement/WorkspaceManagement';
import { useWorkspace } from '../../contexts/WorkspaceContext';

type AdminTab = 'workspaces' | 'audit' | 'integrity';

const SystemAdministration: React.FC = () => {
  const { currentWorkspace } = useWorkspace();
  const [activeTab, setActiveTab] = useState<AdminTab>('workspaces');

  const tabs = [
    { id: 'workspaces', label: 'Workspaces', icon: <LayoutGrid className="w-5 h-5" /> },
    { id: 'audit', label: 'Audit Logs', icon: <ShieldCheck className="w-5 h-5" /> },
    { id: 'integrity', label: 'Integrity Dashboard', icon: <Activity className="w-5 h-5" /> }
  ];

  const renderContent = () => {
    if (activeTab === 'workspaces') {
      return (
        <div className="space-y-3">
          <div className="text-xs text-gray-500">
            Workspace Management is available here for administrators and also under User Management.
          </div>
          <WorkspaceManagement />
        </div>
      );
    }

    if (activeTab === 'audit') {
      return (
        <div className="bg-white rounded-lg border border-gray-100 p-6 text-sm text-gray-600">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Audit Logs</h2>
          <p className="mb-2">
            Audit log viewer will surface critical actions across users, workspaces, and configuration changes.
          </p>
          <p className="text-xs text-gray-500">
            Current Workspace: {currentWorkspace?.name || 'All Workspaces'}
          </p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg border border-gray-100 p-6 text-sm text-gray-600">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Integrity Dashboard</h2>
        <p className="mb-2">
          Integrity checks will validate workspace data, orphaned records, and workflow consistency.
        </p>
        <p className="text-xs text-gray-500">
          Current Workspace: {currentWorkspace?.name || 'All Workspaces'}
        </p>
      </div>
    );
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">System Administration</h1>
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                {tab.icon}
                <span className="ml-2">{tab.label}</span>
              </div>
            </button>
          ))}
        </nav>
      </div>

      {renderContent()}
    </div>
  );
};

export default SystemAdministration;
