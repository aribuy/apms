import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';

interface Task {
  id: string;
  taskCode: string;
  taskType: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  createdAt: string;
  assignedUser?: {
    name: string;
    email: string;
  };
}

interface TaskListProps {
  viewType: 'all' | 'pending';
}

const TaskList: React.FC<TaskListProps> = ({ viewType }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, [viewType]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const endpoint = viewType === 'pending' 
        ? 'http://localhost:3011/api/v1/tasks?status=pending'
        : 'http://localhost:3011/api/v1/tasks';
      
      const response = await fetch(endpoint);
      
      if (response.ok) {
        const data = await response.json();
        setTasks(data.success ? data.data : data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'normal':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const performTask = async (taskId: string) => {
    try {
      const response = await fetch(`http://localhost:3011/api/v1/tasks/${taskId}/complete`, {
        method: 'POST'
      });
      
      if (response.ok) {
        alert('Task completed successfully!');
        fetchTasks(); // Refresh task list
      }
    } catch (error) {
      console.error('Error completing task:', error);
      alert('Failed to complete task');
    }
  };

  const handleATPTask = (task: Task) => {
    // Store task context
    localStorage.setItem('currentATPTask', JSON.stringify(task));
    
    // Trigger parent component to switch to ATP tab
    const event = new CustomEvent('switchToATPTab');
    window.dispatchEvent(event);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {getStatusIcon(task.status)}
                <span className="text-sm text-gray-500">{task.taskCode}</span>
                <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
              </div>
              <h3 className="font-semibold text-lg mb-1">{task.title}</h3>
              {task.description && (
                <p className="text-gray-600 text-sm mb-2">{task.description}</p>
              )}
              <div className="flex gap-4 text-sm text-gray-500">
                <span>Type: {task.taskType}</span>
                {task.dueDate && (
                  <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                )}
                {task.assignedUser && (
                  <span>Assigned to: {task.assignedUser.name}</span>
                )}
              </div>
            </div>
            {task.status !== 'completed' && viewType === 'pending' && (
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"
                onClick={() => task.taskType === 'ATP_UPLOAD' ? handleATPTask(task) : performTask(task.id)}
              >
                {task.taskType === 'ATP_UPLOAD' ? 'Upload ATP Document' : 'Perform Task'}
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ))}
      
      {tasks.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No {viewType === 'pending' ? 'pending' : ''} tasks found
        </div>
      )}
    </div>
  );
};

export default TaskList;
