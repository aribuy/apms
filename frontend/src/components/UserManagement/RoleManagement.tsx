import React, { useState, useEffect } from 'react';
import { Shield, Users, Edit2, Save, X } from 'lucide-react';

interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  role: string;
  status: string;
  userType: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
}

const RoleManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        fetch('/api/v1/users'),
        fetch('/api/v1/users/roles')
      ]);
      
      const usersData = await usersRes.json();
      const rolesData = await rolesRes.json();
      
      if (usersData.success) setUsers(usersData.data);
      if (rolesData.success) setRoles(rolesData.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditRole = (user: User) => {
    setEditingUser(user.id);
    setSelectedRole(user.role);
  };

  const handleSaveRole = async (userId: string) => {
    try {
      const response = await fetch(`/api/v1/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedRole })
      });
      
      const data = await response.json();
      if (data.success) {
        setUsers(users.map(u => u.id === userId ? { ...u, role: selectedRole } : u));
        setEditingUser(null);
      }
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  const getRoleColor = (role: string) => {
    const colors: any = {
      'admin': 'bg-red-100 text-red-800',
      'SITE_MANAGER': 'bg-purple-100 text-purple-800',
      'VENDOR_ADMIN': 'bg-orange-100 text-orange-800',
      'VENDOR_STAFF': 'bg-orange-50 text-orange-700',
      'FOP_RTS': 'bg-blue-100 text-blue-800',
      'REGION_TEAM': 'bg-blue-50 text-blue-700',
      'RTH': 'bg-blue-200 text-blue-900',
      'BO': 'bg-green-100 text-green-800',
      'SME': 'bg-green-50 text-green-700',
      'HEAD_NOC': 'bg-green-200 text-green-900'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2 flex items-center">
          <Shield className="mr-2" />
          Role Management
        </h1>
        <p className="text-gray-600">Assign roles and permissions to users</p>
      </div>

      {/* Available Roles */}
      <div className="mb-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Available Roles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => (
            <div key={role.id} className="border rounded-lg p-4">
              <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium mb-2 ${getRoleColor(role.id)}`}>
                {role.name}
              </div>
              <p className="text-sm text-gray-600">{role.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* User Role Assignments */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold flex items-center">
            <Users className="mr-2" />
            User Role Assignments
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingUser === user.id ? (
                      <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {roles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleColor(user.role)}`}>
                        {roles.find(r => r.id === user.role)?.name || user.role}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.userType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {editingUser === user.id ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleSaveRole(user.id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingUser(null)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEditRole(user)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RoleManagement;