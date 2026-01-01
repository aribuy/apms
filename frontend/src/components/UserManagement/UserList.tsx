import React, { useState, useEffect } from 'react';
import { 
  Search, UserPlus, Edit2, Trash2, X, Save, 
  Mail, Phone, Shield, CheckCircle, XCircle 
} from 'lucide-react';
import { apiClient } from '../../utils/apiClient';

interface User {
  id: string;
  email: string;
  username: string;
  name?: string;
  contactNumber?: string;
  userType?: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

interface FormData {
  id?: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: string;
  isActive: boolean;
}

interface Workspace {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
}

interface UserWorkspace {
  workspaceId: string;
  code: string;
  name: string;
  role: string;
  isDefault: boolean;
}

const WORKSPACE_ROLE_OPTIONS = [
  'SUPERADMIN',
  'ADMIN',
  'DOC_CONTROL',
  'BO',
  'SME',
  'HEAD_NOC',
  'FOP_RTS',
  'REGION_TEAM',
  'RTH',
  'VENDOR',
  'MEMBER'
];

const UserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [userWorkspaces, setUserWorkspaces] = useState<UserWorkspace[]>([]);
  const [workspaceAssignment, setWorkspaceAssignment] = useState({
    workspaceId: '',
    role: 'MEMBER',
    isDefault: false
  });
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    username: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    role: 'user',
    isActive: true
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await apiClient.get('/api/v1/users');
      if (response.data?.success) {
        setUsers(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkspaces = async () => {
    try {
      const response = await apiClient.get('/api/v1/workspaces');
      if (response.data?.success) {
        setWorkspaces(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching workspaces:', error);
    }
  };

  const fetchUserWorkspaces = async (userId: string) => {
    try {
      const response = await apiClient.get(`/api/v1/users/${userId}/workspaces`);
      if (response.data?.success) {
        setUserWorkspaces(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching user workspaces:', error);
    }
  };

  const handleEdit = (user: User) => {
    setFormData({
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.name || '',
      lastName: '',
      phoneNumber: user.contactNumber || '',
      role: user.userType || 'user',
      isActive: user.status === 'ACTIVE'
    });
    fetchWorkspaces();
    if (user.id) {
      fetchUserWorkspaces(user.id);
    }
    setWorkspaceAssignment({ workspaceId: '', role: 'MEMBER', isDefault: false });
    setWorkspaceError(null);
    setEditMode(true);
    setShowAddModal(true);
  };

  const handleDelete = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      const response = await apiClient.delete(`/api/v1/users/delete/${userId}`);
      if (response.data?.success) {
        fetchUsers();
      } else {
        alert(response.data?.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user');
    }
  };

  const handleSave = async () => {
    try {
      const endpoint = editMode 
        ? `/api/v1/users/update/${formData.id}`
        : '/api/v1/users/create';
      
      // Map form fields to API fields
      const apiData = {
        email: formData.email,
        username: formData.username,
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        contactNumber: formData.phoneNumber,
        userType: formData.role,
        status: formData.isActive ? 'ACTIVE' : 'INACTIVE'
      };
      
      const response = editMode
        ? await apiClient.put(endpoint, apiData)
        : await apiClient.post(endpoint, apiData);

      if (response.data?.success) {
        const createdUserId = response.data?.data?.id;
        if (!editMode && workspaceAssignment.workspaceId && createdUserId) {
          await apiClient.post(`/api/v1/users/${createdUserId}/workspaces`, {
            workspaceId: workspaceAssignment.workspaceId,
            role: workspaceAssignment.role,
            isDefault: workspaceAssignment.isDefault
          });
        }
        fetchUsers();
        setShowAddModal(false);
        resetForm();
      } else {
        alert(response.data?.error || 'Failed to save user');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Error saving user');
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      username: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
      role: 'user',
      isActive: true
    });
    setUserWorkspaces([]);
    setWorkspaceAssignment({ workspaceId: '', role: 'MEMBER', isDefault: false });
    setWorkspaceError(null);
    setEditMode(false);
  };

  const getTypeColor = (user: User) => {
    if (user.email?.includes('@telecore.com')) return 'bg-blue-100 text-blue-800';
    if (user.userType === 'TOWER_PROVIDER') return 'bg-orange-100 text-orange-800';
    if (user.userType === 'VENDOR') return 'bg-purple-100 text-purple-800';
    return 'bg-green-100 text-green-800';
  };

  const getTypeLabel = (user: User) => {
    if (user.email?.includes('@telecore.com')) return 'INTERNAL';
    if (user.userType === 'TOWER_PROVIDER') return 'TOWER PROVIDER';
    if (user.userType === 'VENDOR') return 'VENDOR';
    return user.userType || 'EXTERNAL';
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = filterRole === 'all' || 
      (user.userType && user.userType.toLowerCase() === filterRole.toLowerCase());
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Users</h2>
        <p className="text-gray-600">Manage system users and their access</p>
      </div>

      {/* Controls */}
      <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search users..."
              className="pl-10 pr-4 py-2 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="internal">Internal</option>
            <option value="vendor">Vendor</option>
            <option value="tower_provider">Tower Provider</option>
          </select>
        </div>
        
        <button
          onClick={() => {
            resetForm();
            fetchWorkspaces();
            setShowAddModal(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add User
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-[600px] w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-3 sm:px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-2 py-3 sm:px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-2 py-3 sm:px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-2 py-3 sm:px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-2 py-3 sm:px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td className="px-2 py-3 sm:px-6 sm:py-4 whitespace-nowrap sm:whitespace-nowrap">
                  <div>
                    <div className="text-xs sm:text-sm font-medium text-gray-900">
                      {user.name || user.username}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500 flex items-center">
                      <Mail className="w-3 h-3 mr-1" />
                      {user.email}
                    </div>
                  </div>
                </td>
                <td className="px-2 py-3 sm:px-6 sm:py-4 whitespace-nowrap sm:whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeColor(user)}`}>
                    {getTypeLabel(user)}
                  </span>
                </td>
                <td className="px-2 py-3 sm:px-6 sm:py-4 whitespace-nowrap sm:whitespace-nowrap text-xs sm:text-sm text-gray-500">
                  {user.contactNumber && (
                    <div className="flex items-center">
                      <Phone className="w-3 h-3 mr-1" />
                      {user.contactNumber}
                    </div>
                  )}
                </td>
                <td className="px-2 py-3 sm:px-6 sm:py-4 whitespace-nowrap sm:whitespace-nowrap">
                  {user.status === 'ACTIVE' ? (
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Active
                    </span>
                  ) : (
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                      <XCircle className="w-3 h-3 mr-1" />
                      Inactive
                    </span>
                  )}
                </td>
                <td className="px-2 py-3 sm:px-6 sm:py-4 whitespace-nowrap sm:whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleEdit(user)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal - keeping original form fields */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editMode ? 'Edit User' : 'Add New User'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  placeholder="username"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                  placeholder="+62 xxx-xxxx-xxxx"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                  >
                    <option value="INTERNAL">Internal</option>
                    <option value="VENDOR">Vendor</option>
                    <option value="TOWER_PROVIDER">Tower Provider</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.isActive ? 'active' : 'inactive'}
                    onChange={(e) => setFormData({...formData, isActive: e.target.value === 'active'})}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                  <Shield className="w-4 h-4 mr-2" />
                  Workspace Access
                </h3>
                {workspaceError && (
                  <span className="text-xs text-red-600">{workspaceError}</span>
                )}
              </div>

              {editMode && (
                <div className="space-y-3 mb-4">
                  {userWorkspaces.length === 0 ? (
                    <div className="text-xs text-gray-500">No workspace access assigned.</div>
                  ) : (
                    userWorkspaces.map((workspace) => (
                      <div
                        key={workspace.workspaceId}
                        className="flex flex-col md:flex-row md:items-center md:justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2"
                      >
                        <div className="text-sm text-gray-700">
                          {workspace.name} ({workspace.code})
                          {workspace.isDefault && (
                            <span className="ml-2 text-xs text-blue-600">(Default)</span>
                          )}
                        </div>
                        <div className="mt-2 md:mt-0 flex items-center space-x-2">
                          <select
                            className="text-xs border rounded px-2 py-1"
                            value={workspace.role}
                            onChange={async (event) => {
                              try {
                                await apiClient.put(
                                  `/api/v1/users/${formData.id}/workspaces/${workspace.workspaceId}`,
                                  { role: event.target.value }
                                );
                                fetchUserWorkspaces(formData.id as string);
                              } catch (error) {
                                console.error('Failed to update workspace role', error);
                                setWorkspaceError('Failed to update workspace role');
                              }
                            }}
                          >
                            {WORKSPACE_ROLE_OPTIONS.map((role) => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            className="text-xs text-red-600 hover:text-red-700"
                            onClick={async () => {
                              try {
                                await apiClient.delete(
                                  `/api/v1/users/${formData.id}/workspaces/${workspace.workspaceId}`
                                );
                                fetchUserWorkspaces(formData.id as string);
                              } catch (error) {
                                console.error('Failed to remove workspace', error);
                                setWorkspaceError('Failed to remove workspace');
                              }
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Workspace
                  </label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    value={workspaceAssignment.workspaceId}
                    onChange={(e) => setWorkspaceAssignment({
                      ...workspaceAssignment,
                      workspaceId: e.target.value
                    })}
                  >
                    <option value="">Select workspace</option>
                    {workspaces.map((workspace) => (
                      <option key={workspace.id} value={workspace.id}>
                        {workspace.name} ({workspace.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Workspace Role
                  </label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    value={workspaceAssignment.role}
                    onChange={(e) => setWorkspaceAssignment({
                      ...workspaceAssignment,
                      role: e.target.value
                    })}
                  >
                    {WORKSPACE_ROLE_OPTIONS.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center space-x-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={workspaceAssignment.isDefault}
                      onChange={(e) => setWorkspaceAssignment({
                        ...workspaceAssignment,
                        isDefault: e.target.checked
                      })}
                    />
                    <span>Set as default</span>
                  </label>
                </div>
              </div>

              {editMode && (
                <div className="mt-3">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                    onClick={async () => {
                      if (!workspaceAssignment.workspaceId) {
                        setWorkspaceError('Select a workspace to add');
                        return;
                      }
                      try {
                        await apiClient.post(`/api/v1/users/${formData.id}/workspaces`, {
                          workspaceId: workspaceAssignment.workspaceId,
                          role: workspaceAssignment.role,
                          isDefault: workspaceAssignment.isDefault
                        });
                        setWorkspaceAssignment({ workspaceId: '', role: 'MEMBER', isDefault: false });
                        setWorkspaceError(null);
                        fetchUserWorkspaces(formData.id as string);
                      } catch (error) {
                        console.error('Failed to add workspace', error);
                        setWorkspaceError('Failed to add workspace');
                      }
                    }}
                  >
                    Add Workspace
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                {editMode ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList;
