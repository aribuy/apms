import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import UserManagement from './components/UserManagement/UserManagement';
import OrganizationManagement from "./components/OrganizationManagement/OrganizationManagement";
import WorkgroupManagement from "./components/WorkgroupManagement/WorkgroupManagement";
import DocumentManagement from "./components/DocumentManagement/DocumentManagement";
import ATPDocumentGenerator from "./components/DocumentManagement/ATPDocumentGenerator";
import TaskManagement from "./components/TaskManagement";
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

import SiteManagement from "./components/SiteManagement";
import ATPTest from "./components/ATPTest";
import { LoginPage } from './components/auth/LoginPage';
import { 
  Users, Database, FileText, MapPin, BarChart3, Settings,
  Bell, Search, Menu, X, Home, User, Globe, Workflow, 
  TrendingUp, Clock, Plus, Package, Activity, LogOut, ListTodo,
  CheckSquare
} from 'lucide-react';
import ATPTemplateManagement from './components/ATPTemplateManagement/ATPTemplateManagement';
import ATPManagement from './components/ATPManagement/ATPManagement';
import { usePermissions } from './hooks/usePermissions';
import './App.css';

// Keep all your existing TypeScript interfaces
interface DashboardStats {
  totalSites: number;
  activeSites: number;
  totalDocuments: number;
  pendingApprovals: number;
  activeWorkflows: number;
  totalUsers: number;
  siteChange: string;
  docChange: string;
  approvalChange: string;
  workflowChange: string;
}

interface ActivityItem {
  id: number;
  action: string;
  user: string;
  time: string;
  type: string;
}

interface Module {
  id: string;
  name: string;
  icon: any;
  description: string;
  color: string;
  subModules?: string[];
}

interface StatCardProps {
  title: string;
  value: number;
  change: string;
  icon: any;
  color: string;
}

interface ActivityItemProps {
  activity: ActivityItem;
}

interface ModuleCardProps {
  module: Module;
  onClick: (id: string) => void;
}

const TeleCoreHomepage: React.FC = () => {
  const { user, logout } = useAuth();
  const { getAccessibleModules } = usePermissions();
  const [activeModule, setActiveModule] = useState<string>(() => {
    return localStorage.getItem('activeModule') || 'dashboard';
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  // Fetch data from API
  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(res => res.json())
      .then(data => {
        if (data.data) {
          setDashboardStats(data.data);
        } else {
          setDashboardStats(data);
        }
      })
      .catch(err => console.error('Error fetching stats:', err));

    fetch('/api/dashboard/activities')
      .then(res => res.json())
      .then(data => setActivities(data))
      .catch(err => console.error('Error fetching activities:', err));
  }, []);

  // Handle window resize for responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    // Set initial state
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Module configuration
  const allModules: Module[] = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: Home,
      description: 'Overview and key metrics',
      color: 'bg-blue-500'
    },
    {
      id: 'user-management',
      name: 'User Management',
      icon: Users,
      description: 'Manage users, roles, and permissions',
      color: 'bg-green-500',
      subModules: [
        'Create New Vendor & TP',
        'Update Vendor & TP',
        'Create Role',
        'Create User',
        'Role Deletion Handling',
        'Access Rights Management'
      ]
    },
    {
      id: 'task-management',
      name: 'Task Management',
      icon: ListTodo,
      description: 'Manage tasks and assignments',
      color: 'bg-indigo-500',
      subModules: [
        'All Tasks',
        'Pending Tasks',
        'ATP Workflow',
        'Punchlist Tasks'
      ]
    },
    {
      id: 'site-management',
      name: 'Site Management',
      icon: MapPin,
      description: 'Site registration and lifecycle',
      color: 'bg-purple-500',
      subModules: [
        'Site Registration',
        'Site Archive Process',
        'Site Status Lifecycle',
        'Site Cloning',
        'Batch Operations'
      ]
    },
    {
      id: 'bom-management',
      name: 'BOM Management',
      icon: Package,
      description: 'Equipment & Service configuration',
      color: 'bg-orange-500',
      subModules: [
        'Config Registration',
        'Mapping Configuration',
        'BOM Type Management',
        'Version Control',
        'Price Management'
      ]
    },
    {
      id: 'document-management',
      name: 'Document Management',
      icon: FileText,
      description: 'Workflows and document processing',
      color: 'bg-red-500',
      subModules: [
        'Create New Workflow',
        'Mapping Workflow',
        'Document Master',
        'Dynamic Form Builder',
        'ATP-Specific Settings'
      ]
    },
    {
      id: 'atp-template-management',
      name: 'ATP Checklist Templates',
      icon: CheckSquare,
      description: 'Manage ATP checklist templates with photo upload',
      color: 'bg-cyan-500',
      subModules: [
        'Template Library',
        'Template Builder',
        'Photo Upload System',
        'Template Preview',
        'Template Cloning'
      ]
    },
    {
      id: 'atp-process-management',
      name: 'ATP Process Management',
      icon: Workflow,
      description: 'Upload ATP documents and manage approval workflow',
      color: 'bg-emerald-500',
      subModules: [
        'Document Upload',
        'Document Review',
        'Approval Workflow',
        'Status Tracking',
        'Submit for Approval'
      ]
    },
    {
      id: 'master-data',
      name: 'Master Data',
      icon: Database,
      description: 'System configuration and lookups',
      color: 'bg-indigo-500',
      subModules: [
        'Scope of Work',
        'Project Phase',
        'Geographical Data',
        'Notification Management',
        'Calendar Configuration'
      ]
    },
    {
      id: 'system-admin',
      name: 'System Administration',
      icon: Settings,
      description: 'System settings and maintenance',
      color: 'bg-gray-500',
      subModules: [
        'Audit Trail Viewer',
        'Backup & Restore',
        'System Parameters',
        'Data Archival',
        'Test Environment'
      ]
    },
    {
      id: 'monitoring',
      name: 'Monitoring & Reporting',
      icon: BarChart3,
      description: 'Analytics and system monitoring',
      color: 'bg-teal-500',
      subModules: [
        'Admin Activity Dashboard',
        'Configuration Change Report',
        'User Access Analytics',
        'Workflow Performance',
        'System Health Monitor'
      ]
    }
  ];

  // Filter modules based on user permissions
  const accessibleModules = getAccessibleModules();
  const isAdmin = user?.role === 'admin' || user?.role === 'Administrator';
  const modules = isAdmin ? allModules : 
    allModules.filter(module => 
      module.id === 'dashboard' || 
      (module.id === 'site-management' && accessibleModules.includes('sites')) ||
      (module.id === 'task-management' && accessibleModules.includes('tasks'))
    );

  // Component definitions
  const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon: Icon, color }) => (
    <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <div className={`w-8 h-8 md:w-10 md:h-10 ${color} rounded-lg flex items-center justify-center`}>
          <Icon className="w-4 h-4 md:w-5 md:h-5 text-white" />
        </div>
        <div className={`text-xs md:text-sm flex items-center ${
          change?.includes('+') ? 'text-green-600' : 
          change?.includes('-') ? 'text-red-600' : 'text-gray-600'
        }`}>
          {change?.includes('+') ? <TrendingUp className="w-3 h-3 mr-1" /> : 
           change?.includes('-') ? <TrendingUp className="w-3 h-3 mr-1 rotate-180" /> : null}
          {change}
        </div>
      </div>
      <div className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
        {value.toLocaleString()}
      </div>
      <div className="text-xs md:text-sm text-gray-600">{title}</div>
    </div>
  );

  const ActivityItem: React.FC<ActivityItemProps> = ({ activity }) => {
    const getIcon = () => {
      switch (activity.type) {
        case 'site': return <MapPin className="w-4 h-4" />;
        case 'workflow': return <Workflow className="w-4 h-4" />;
        case 'document': return <FileText className="w-4 h-4" />;
        case 'user': return <Users className="w-4 h-4" />;
        default: return <Activity className="w-4 h-4" />;
      }
    };

    const getColor = () => {
      switch (activity.type) {
        case 'site': return 'bg-purple-100 text-purple-600';
        case 'workflow': return 'bg-blue-100 text-blue-600';
        case 'document': return 'bg-green-100 text-green-600';
        case 'user': return 'bg-orange-100 text-orange-600';
        default: return 'bg-gray-100 text-gray-600';
      }
    };

    return (
      <div className="flex items-center space-x-3 py-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getColor()}`}>
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">{activity.action}</p>
          <p className="text-xs text-gray-600">by {activity.user}</p>
        </div>
        <div className="text-xs text-gray-500">{activity.time}</div>
      </div>
    );
  };

  const ModuleCard: React.FC<ModuleCardProps> = ({ module, onClick }) => (
    <div 
      className="bg-white rounded-xl p-4 md:p-6 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer group border border-gray-100"
      onClick={() => onClick(module.id)}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 md:w-12 md:h-12 ${module.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
          <module.icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
        </div>
        <div className="text-xs md:text-sm text-gray-400">
          {module.subModules?.length || 0} functions
        </div>
      </div>
      <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">{module.name}</h3>
      <p className="text-gray-600 text-sm mb-4">{module.description}</p>
      {module.subModules && (
        <div className="space-y-1">
          {module.subModules.slice(0, 3).map((subModule, index) => (
            <div key={index} className="text-xs text-gray-500 flex items-center">
              <div className="w-1 h-1 bg-gray-400 rounded-full mr-2"></div>
              {subModule}
            </div>
          ))}
          {module.subModules.length > 3 && (
            <div className="text-xs text-blue-600 font-medium">
              +{module.subModules.length - 3} more functions
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Sidebar Component
  const Sidebar = () => (
    <>
      {/* Mobile backdrop overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        ${isSidebarOpen ? 'w-64' : 'w-16'} 
        bg-white shadow-lg transition-all duration-300 flex flex-col
        fixed inset-y-0 left-0 z-50 lg:static lg:inset-0
        transform
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo with user info */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Globe className="w-6 h-6 text-white" />
              </div>
              {isSidebarOpen && (
                <div>
                  <div className="text-lg font-bold text-gray-900">TeleCore</div>
                  <div className="text-xs text-gray-600">APMS Portal</div>
                </div>
              )}
            </div>
            
            {/* Desktop Collapse Button - Always Visible */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors hidden lg:flex"
              title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Mobile Close Button */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 rounded-lg hover:bg-gray-100 lg:hidden"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          
          {/* User info in sidebar */}
          {isSidebarOpen ? (
            user && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <div className="text-sm font-medium text-blue-900">{user.username}</div>
                <div className="text-xs text-blue-700">{user.role}</div>
              </div>
            )
          ) : (
            <div className="mt-3 flex justify-center">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 p-4 space-y-2">
          {modules.map((module) => (
            <button
              key={module.id}
              onClick={() => {
                setActiveModule(module.id);
                localStorage.setItem('activeModule', module.id);
                if (window.innerWidth < 1024) {
                  setIsSidebarOpen(false);
                }
              }}
              className={`
                w-full flex items-center py-2.5 rounded-lg transition-colors
                ${activeModule === module.id
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
                }
                ${isSidebarOpen ? 'space-x-3 px-3' : 'justify-center px-2'}
              `}
              title={!isSidebarOpen ? module.name : ''}
            >
              <module.icon className="w-5 h-5 flex-shrink-0" />
              {isSidebarOpen && <span className="text-sm font-medium">{module.name}</span>}
            </button>
          ))}
        </div>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={logout}
            className={`
              w-full flex items-center py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors
              ${isSidebarOpen ? 'space-x-3 px-3' : 'justify-center px-2'}
            `}
            title={!isSidebarOpen ? 'Logout' : ''}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {isSidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </div>
    </>
  );

  // Header Component
  const Header = () => (
    <header className="bg-white shadow-sm border-b border-gray-200 px-4 md:px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Mobile menu button */}
        <div className="flex items-center">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 lg:hidden mr-4"
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
          
          <h1 className="text-lg md:text-xl font-semibold text-gray-900">
            {activeModule === 'dashboard' ? 'Dashboard' : modules.find(m => m.id === activeModule)?.name || 'Module'}
          </h1>
        </div>
        
        <div className="flex items-center space-x-3 md:space-x-4">
          {/* Search - hidden on small screens */}
          <div className="relative hidden sm:block">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          
          {/* Notifications */}
          <div className="relative">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </div>
          
          {/* User info - responsive */}
          <div className="flex items-center space-x-2">
            <div className="hidden sm:block text-right">
              <div className="text-sm font-medium text-gray-900">{user?.username}</div>
              <div className="text-xs text-gray-600">{user?.role}</div>
            </div>
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );

  // Use same responsive layout for ALL modules
  return (
    <div className="min-h-screen bg-gray-50 lg:flex">
      <Sidebar />
      
      {/* Main Content - Consistent Layout for All Modules */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {activeModule === 'dashboard' ? (
            // Dashboard Content
            <div className="space-y-6">
              {/* Welcome Section */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-4 md:p-6 text-white">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="mb-4 md:mb-0">
                    <h1 className="text-xl md:text-2xl font-bold mb-2">
                      Welcome to TeleCore APMS, {user?.username}!
                    </h1>
                    <p className="text-sm md:text-base text-blue-100 mb-1">
                      Advanced Project Management System for Network Infrastructure
                    </p>
                    <p className="text-xs md:text-sm text-blue-200">
                      Authentication Status: ✓ Logged in as {user?.role}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs md:text-sm text-blue-100">Today</div>
                    <div className="text-sm md:text-lg font-semibold">
                      {new Date().toLocaleDateString('id-ID', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {dashboardStats ? (
                  <>
                    <StatCard 
                      title="Total Sites" 
                      value={dashboardStats.totalSites} 
                      change={dashboardStats.siteChange}
                      icon={MapPin}
                      color="bg-blue-500"
                    />
                    <StatCard 
                      title="Total Documents" 
                      value={dashboardStats.totalDocuments} 
                      change={dashboardStats.docChange}
                      icon={FileText}
                      color="bg-green-500"
                    />
                    <StatCard 
                      title="Pending Approvals" 
                      value={dashboardStats.pendingApprovals} 
                      change={dashboardStats.approvalChange}
                      icon={Clock}
                      color="bg-orange-500"
                    />
                    <StatCard 
                      title="Active Workflows" 
                      value={dashboardStats.activeWorkflows} 
                      change={dashboardStats.workflowChange}
                      icon={Workflow}
                      color="bg-purple-500"
                    />
                  </>
                ) : (
                  Array.from({length: 4}).map((_, i) => (
                    <div key={i} className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100 animate-pulse">
                      <div className="h-16 md:h-20 bg-gray-200 rounded"></div>
                    </div>
                  ))
                )}
              </div>

              {/* System Modules */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg md:text-xl font-semibold text-gray-900">System Modules</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                  {modules.filter(m => m.id !== 'dashboard').map((module) => (
                    <ModuleCard 
                      key={module.id} 
                      module={module} 
                      onClick={(moduleId) => {
                        setActiveModule(moduleId);
                        localStorage.setItem('activeModule', moduleId);
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Activities and Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100">
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
                  <div className="space-y-1">
                    {activities.length > 0 ? (
                      activities.map((activity) => (
                        <ActivityItem key={activity.id} activity={activity} />
                      ))
                    ) : (
                      <div className="text-gray-500 text-center py-4">Loading activities...</div>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100">
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <button className="w-full flex items-center space-x-3 p-3 text-left rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Plus className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">Create New Site</div>
                        <div className="text-xs text-gray-600">Register new site location</div>
                      </div>
                    </button>
                    
                    <button className="w-full flex items-center space-x-3 p-3 text-left rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <Users className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">Add New User</div>
                        <div className="text-xs text-gray-600">Create user account</div>
                      </div>
                    </button>
                    
                    <button className="w-full flex items-center space-x-3 p-3 text-left rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Workflow className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">New Workflow</div>
                        <div className="text-xs text-gray-600">Design approval process</div>
                      </div>
                    </button>

                    <button 
                      onClick={() => {
                        setActiveModule('atp-test');
                        localStorage.setItem('activeModule', 'atp-test');
                      }}
                      className="w-full flex items-center space-x-3 p-3 text-left rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">ATP Test Dashboard</div>
                        <div className="text-xs text-gray-600">Test ATP system</div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Test Credentials Section */}
              <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100">
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4">Available Test Accounts</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-700">PT Aviat (Internal)</h4>
                    <div className="space-y-1 text-gray-600">
                      <div><strong>Admin:</strong> admin@aviat.com / Admin123!</div>
                      <div><strong>Doc Control:</strong> doc.control@aviat.com / test123</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-700">PT XLSMART (Customer)</h4>
                    <div className="space-y-1 text-gray-600">
                      <div><strong>Business Ops:</strong> business.ops@xlsmart.co.id / test123</div>
                      <div><strong>SME Team:</strong> sme.team@xlsmart.co.id / test123</div>
                      <div><strong>NOC Head:</strong> noc.head@xlsmart.co.id / test123</div>
                      <div><strong>FOP RTS:</strong> fop.rts@xlsmart.co.id / test123</div>
                      <div><strong>Region Team:</strong> region.team@xlsmart.co.id / test123</div>
                      <div><strong>RTH Head:</strong> rth.head@xlsmart.co.id / test123</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-700">External Vendors</h4>
                    <div className="space-y-1 text-gray-600">
                      <div><strong>ZTE Vendor:</strong> vendor.zte@gmail.com / test123</div>
                      <div><strong>HTI Vendor:</strong> vendor.hti@gmail.com / test123</div>
                      <div><strong>MW Vendor:</strong> mw.vendor@gmail.com / test123</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Sub-Module Content
            <div className="space-y-4">
              <button
                onClick={() => {
                  setActiveModule('dashboard');
                  localStorage.setItem('activeModule', 'dashboard');
                }}
                className="mb-4 text-blue-600 hover:text-blue-700 flex items-center space-x-2"
              >
                <Home className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </button>

              <div className="w-full">
                {activeModule === "user-management" ? (
                  <UserManagement />
                ) : activeModule === "organization-management" ? (
                  <OrganizationManagement />
                ) : activeModule === "task-management" ? (
                  <TaskManagement />
                ) : activeModule === "workgroup-management" ? (
                  <WorkgroupManagement />
                ) : activeModule === "document-management" ? (
                  <DocumentManagement />
                ) : activeModule === "site-management" ? (
                  <SiteManagement />
                ) : activeModule === "atp-test" ? (
                  <ATPTest />
                ) : activeModule === "atp-template-management" ? (
                  <ATPTemplateManagement />
                ) : activeModule === "atp-process-management" ? (
                  <ATPManagement />
                ) : (
                  <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                    <div className="text-gray-500 mb-4">Module under development</div>
                    <div className="text-sm text-gray-400">
                      This module will be available in the next update
                    </div>
                  </div>
                )}    
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

// Main App component with routing
const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <TeleCoreHomepage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
