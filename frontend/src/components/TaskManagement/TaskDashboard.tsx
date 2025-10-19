import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertTriangle, Users, FileText, Upload } from 'lucide-react';
import TaskList from './TaskList';

interface TaskStats {
  total: number;
  pending: number;
  completed: number;
  overdue: number;
}

const TaskDashboard: React.FC = () => {
  const [activeView, setActiveView] = useState<'all' | 'pending'>('pending');
  const [stats, setStats] = useState<TaskStats>({
    total: 0,
    pending: 0,
    completed: 0,
    overdue: 0
  });
  const [userRole, setUserRole] = useState(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.role || 'DOC_CONTROL';
  });

  useEffect(() => {
    fetchTaskStats();
  }, [userRole]);

  const fetchTaskStats = async () => {
    try {
      const response = await fetch(`http://localhost:3011/api/v1/tasks?assigned_role=${userRole}`);
      if (response.ok) {
        const data = await response.json();
        const tasks = data.success ? data.data : data;
        
        const pending = tasks.filter((t: any) => t.status === 'pending').length;
        const completed = tasks.filter((t: any) => t.status === 'completed').length;
        const overdue = tasks.filter((t: any) => {
          const dueDate = new Date(t.due_date || t.dueDate);
          return t.status === 'pending' && dueDate < new Date();
        }).length;

        setStats({
          total: tasks.length,
          pending,
          completed,
          overdue
        });
      }
    } catch (error) {
      console.error('Error fetching task stats:', error);
    }
  };

  const getRoleDisplayName = (role: string) => {
    const roleNames: { [key: string]: string } = {
      'DOC_CONTROL': 'Document Control',
      'BO': 'Business Operations',
      'SME': 'Subject Matter Expert',
      'HEAD_NOC': 'Head of NOC',
      'FOP_RTS': 'FOP/RTS Team',
      'REGION_TEAM': 'Regional Team',
      'RTH': 'RTH Team',
      'FIELD_ENGINEER': 'Field Engineer'
    };
    return roleNames[role] || role;
  };

  const getStatCards = () => [
    {
      title: 'Total Tasks',
      value: stats.total,
      icon: FileText,
      color: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    {
      title: 'Pending Tasks',
      value: stats.pending,
      icon: Clock,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600'
    },
    {
      title: 'Completed Tasks',
      value: stats.completed,
      icon: CheckCircle,
      color: 'bg-green-500',
      textColor: 'text-green-600'
    },
    {
      title: 'Overdue Tasks',
      value: stats.overdue,
      icon: AlertTriangle,
      color: 'bg-red-500',
      textColor: 'text-red-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Task Management</h1>
            <p className="text-gray-600">Role: {getRoleDisplayName(userRole)}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-500">ATP Workflow System</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {getStatCards().map((stat, index) => (
          <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <stat.icon className={`h-6 w-6 ${stat.textColor}`} />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.title}
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stat.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Role-specific Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Upload className="h-5 w-5 text-blue-500" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              {userRole === 'DOC_CONTROL' ? 'ATP Document Upload' :
               ['BO', 'SME', 'HEAD_NOC', 'FOP_RTS', 'REGION_TEAM', 'RTH'].includes(userRole) ? 'ATP Document Review' :
               userRole === 'FIELD_ENGINEER' ? 'Punchlist Management' : 'Task Management'}
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              {userRole === 'DOC_CONTROL' && (
                <p>Upload ATP documents for sites and initiate the review workflow process.</p>
              )}
              {['BO', 'SME', 'HEAD_NOC', 'FOP_RTS', 'REGION_TEAM', 'RTH'].includes(userRole) && (
                <p>Review ATP documents assigned to your role and provide approval decisions.</p>
              )}
              {userRole === 'FIELD_ENGINEER' && (
                <p>Manage and rectify punchlist items identified during ATP reviews.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveView('pending')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeView === 'pending'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pending Tasks ({stats.pending})
            </button>
            <button
              onClick={() => setActiveView('all')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeView === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All Tasks ({stats.total})
            </button>
          </nav>
        </div>

        {/* Task List */}
        <div className="p-6">
          <TaskList viewType={activeView} />
        </div>
      </div>
    </div>
  );
};

export default TaskDashboard;