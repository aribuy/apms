import React, { useState } from 'react';
import { 
  Building2, Users2, Briefcase, Shield, Settings,
  UserCircle, Layers
} from 'lucide-react';

// Import sub-components
import UserList from './UserList';
import RoleManagement from './RoleManagement';
import PermissionMapping from './PermissionMapping';
import OrganizationManagement from '../OrganizationManagement/OrganizationManagement';
import WorkgroupManagement from '../WorkgroupManagement/WorkgroupManagement';
import WorkspaceManagement from './WorkspaceManagement';

type TabType = 'users' | 'roles' | 'permissions' | 'teams' | 'workgroups' | 'organizations' | 'workspaces';

interface TabItem {
  id: TabType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const UserManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('users');

  const tabs: TabItem[] = [
    {
      id: 'users',
      label: 'User Management',
      icon: <UserCircle className="w-5 h-5" />,
      description: 'Manage user accounts and permissions'
    },
    {
      id: 'roles',
      label: 'Role Management',
      icon: <Shield className="w-5 h-5" />,
      description: 'Assign roles and permissions'
    },
    {
      id: 'permissions',
      label: 'Permission Mapping',
      icon: <Settings className="w-5 h-5" />,
      description: 'Map roles to system modules'
    },
    {
      id: 'workspaces',
      label: 'Workspace Management',
      icon: <Layers className="w-5 h-5" />,
      description: 'Create workspaces and manage members'
    },
    {
      id: 'teams',
      label: 'Team Management',
      icon: <Users2 className="w-5 h-5" />,
      description: 'Manage teams and team members'
    },
    {
      id: 'workgroups',
      label: 'Work Group Management',
      icon: <Briefcase className="w-5 h-5" />,
      description: 'Manage work groups and assignments'
    },
    {
      id: 'organizations',
      label: 'Organization Management',
      icon: <Building2 className="w-5 h-5" />,
      description: 'Manage organizations and hierarchies'
    }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'users':
        return <UserList />;
      case 'roles':
        return <RoleManagement />;
      case 'permissions':
        return <PermissionMapping />;
      case 'workspaces':
        return <WorkspaceManagement />;
      case 'teams':
        return <TeamManagement />;
      case 'workgroups':
        return <WorkgroupManagement />;
      case 'organizations':
        return <OrganizationManagement />;
      default:
        return <UserList />;
    }
  };



  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">User Management</h1>
      
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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

      <div>
        {renderContent()}
      </div>
    </div>
  );
};

// Team Management Component
const TeamManagement: React.FC = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2 flex items-center">
          <Users2 className="mr-2" /> Team Management
        </h1>
        <p className="text-gray-600">Manage teams and team assignments</p>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <Users2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Team Management</h3>
          <p className="text-gray-600 mb-4">
            Team management features will be available soon.
          </p>
          <p className="text-sm text-gray-500">
            This module will allow you to create and manage teams,<br />
            assign team leaders, and track team performance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
