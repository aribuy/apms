import React, { useState, useEffect } from 'react';
import { Settings, Save, RotateCcw } from 'lucide-react';

interface Role {
  id: string;
  name: string;
  description: string;
}

interface Module {
  id: string;
  name: string;
  description: string;
}

interface Permission {
  roleId: string;
  moduleId: string;
  canAccess: boolean;
}

const PermissionMapping: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [rolesRes, modulesRes, permissionsRes] = await Promise.all([
        fetch('/api/v1/users/roles'),
        fetch('/api/v1/modules'),
        fetch('/api/v1/permissions')
      ]);
      
      const rolesData = await rolesRes.json();
      const modulesData = await modulesRes.json();
      const permissionsData = await permissionsRes.json();
      
      if (rolesData.success) setRoles(rolesData.data);
      if (modulesData.success) setModules(modulesData.data);
      if (permissionsData.success) setPermissions(permissionsData.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (roleId: string, moduleId: string) => {
    return permissions.find(p => p.roleId === roleId && p.moduleId === moduleId)?.canAccess || false;
  };

  const togglePermission = (roleId: string, moduleId: string) => {
    const existingIndex = permissions.findIndex(p => p.roleId === roleId && p.moduleId === moduleId);
    
    if (existingIndex >= 0) {
      const updated = [...permissions];
      updated[existingIndex].canAccess = !updated[existingIndex].canAccess;
      setPermissions(updated);
    } else {
      setPermissions([...permissions, { roleId, moduleId, canAccess: true }]);
    }
  };

  const savePermissions = async () => {
    try {
      const response = await fetch('/api/v1/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions })
      });
      
      if (response.ok) {
        alert('Permissions saved successfully!');
      }
    } catch (error) {
      console.error('Error saving permissions:', error);
      alert('Error saving permissions');
    }
  };

  const resetPermissions = () => {
    fetchData();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2 flex items-center">
          <Settings className="mr-2" />
          Permission Mapping
        </h1>
        <p className="text-gray-600">Configure role-based access to system modules</p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Role-Module Permissions</h2>
          <div className="flex space-x-3">
            <button
              onClick={resetPermissions}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </button>
            <button
              onClick={savePermissions}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                {modules.map((module) => (
                  <th key={module.id} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="transform -rotate-45 origin-center whitespace-nowrap">
                      {module.name}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {roles.map((role) => (
                <tr key={role.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{role.name}</div>
                      <div className="text-sm text-gray-500">{role.description}</div>
                    </div>
                  </td>
                  {modules.map((module) => (
                    <td key={module.id} className="px-3 py-4 whitespace-nowrap text-center">
                      <input
                        type="checkbox"
                        checked={hasPermission(role.id, module.id)}
                        onChange={() => togglePermission(role.id, module.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Module Descriptions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {modules.map((module) => (
            <div key={module.id} className="text-sm">
              <span className="font-medium text-gray-900">{module.name}:</span>
              <span className="text-gray-600 ml-1">{module.description}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PermissionMapping;
