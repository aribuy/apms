import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Edit2, Trash2, UserPlus, UserMinus, 
  X, Save, Search, Building2, Mail, User as UserIcon
} from 'lucide-react';

interface Workgroup {
  id: string;
  name: string;
  organizationId: string;
  workgroupType: 'internal' | 'external';
  classification: string;
  category: string;
  maxMembers: number;
  status: 'active' | 'inactive';
  email?: string | null;
  organization?: Organization;
  members?: WorkgroupMember[];
  _count?: {
    members: number;
  };
}

interface Organization {
  id: string;
  name: string;
  code: string;
  type: string;
}

interface WorkgroupMember {
  id: string;
  workgroupId: string;
  userId: string;
  memberRole: string;
  user?: User;
  joinedAt: string;
}

interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
}

const WorkgroupManagement: React.FC = () => {
  const [workgroups, setWorkgroups] = useState<Workgroup[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOrg, setFilterOrg] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedWorkgroup, setSelectedWorkgroup] = useState<Workgroup | null>(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Workgroup>>({
    name: '',
    organizationId: '',
    workgroupType: 'internal',
    classification: 'team',
    category: '',
    maxMembers: 100,
    status: 'active',
    email: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('apms_token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      // Fetch workgroups
      const wgResponse = await fetch('/api/v1/workgroups/list', { headers });
      const wgData = await wgResponse.json();
      if (wgData.success) {
        setWorkgroups(wgData.data);
      }
      
      // Fetch organizations
      const orgResponse = await fetch('/api/v1/organizations/list', { headers });
      const orgData = await orgResponse.json();
      if (orgData.success) {
        setOrganizations(orgData.data);
      }
      
      // Fetch users for member assignment
      const userResponse = await fetch('/api/v1/users', { headers });
      const userData = await userResponse.json();
      if (userData.success) {
        setAvailableUsers(userData.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWorkgroup = async () => {
    try {
      const token = localStorage.getItem('apms_token');
      const endpoint = modalMode === 'add' 
        ? '/api/v1/workgroups/create'
        : `/api/v1/workgroups/update/${formData.id}`;
      
      const response = await fetch(endpoint, {
        method: modalMode === 'add' ? 'POST' : 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      if (data.success) {
        fetchData();
        setShowModal(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error saving workgroup:', error);
    }
  };

  const handleDeleteWorkgroup = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this workgroup?')) return;
    
    try {
      const token = localStorage.getItem('apms_token');
      const response = await fetch(`/api/v1/workgroups/delete/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        fetchData();
      } else {
        alert(data.error || 'Failed to delete workgroup');
      }
    } catch (error) {
      console.error('Error deleting workgroup:', error);
    }
  };

  const handleAddMember = async (userId: string, role: string) => {
    if (!selectedWorkgroup) return;
    
    try {
      const token = localStorage.getItem('apms_token');
      const response = await fetch(`/api/v1/workgroups/${selectedWorkgroup.id}/members`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, memberRole: role })
      });
      
      const data = await response.json();
      if (data.success) {
        fetchData();
        setShowAddMemberModal(false);
      } else {
        alert(data.error || 'Failed to add member');
      }
    } catch (error) {
      console.error('Error adding member:', error);
    }
  };

  const handleRemoveMember = async (workgroupId: string, userId: string) => {
    if (!window.confirm('Remove this member from the workgroup?')) return;
    
    try {
      const token = localStorage.getItem('apms_token');
      const response = await fetch(`/api/v1/workgroups/${workgroupId}/members/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        fetchData();
      }
    } catch (error) {
      console.error('Error removing member:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      organizationId: '',
      workgroupType: 'internal',
      classification: 'team',
      category: '',
      maxMembers: 100,
      status: 'active',
      email: ''
    });
  };

  const openEditModal = (wg: Workgroup) => {
    setFormData(wg);
    setModalMode('edit');
    setShowModal(true);
  };

  const openMembersModal = (wg: Workgroup) => {
    setSelectedWorkgroup(wg);
    setShowMembersModal(true);
  };

  const getTypeColor = (type: string) => {
    return type === 'internal' 
      ? 'bg-blue-100 text-blue-800' 
      : 'bg-purple-100 text-purple-800';
  };

  const filteredWorkgroups = workgroups.filter(wg => {
    const matchesSearch = wg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         wg.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         wg.organization?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOrg = filterOrg === 'all' || wg.organizationId === filterOrg;
    return matchesSearch && matchesOrg;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading workgroups...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2 flex items-center">
          <Users className="mr-2" /> Workgroup Management
        </h1>
        <p className="text-gray-600">Manage workgroups and team members</p>
      </div>

      {/* Controls */}
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search workgroups..."
                className="pl-10 pr-4 py-2 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filterOrg}
              onChange={(e) => setFilterOrg(e.target.value)}
            >
              <option value="all">All Organizations</option>
              {organizations.map(org => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          </div>
          
          <button 
            onClick={() => {
              resetForm();
              setModalMode('add');
              setShowModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Workgroup
          </button>
        </div>
        
        <div className="mt-4 flex gap-6 text-sm text-gray-600">
          <span>Total Workgroups: <strong>{workgroups.length}</strong></span>
          <span>Total Members: <strong>{workgroups.reduce((sum, wg) => sum + (wg._count?.members || 0), 0)}</strong></span>
        </div>
      </div>

      {/* Workgroups Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredWorkgroups.map(wg => (
          <div key={wg.id} className="bg-white border rounded-lg shadow hover:shadow-lg transition-shadow p-4">
            <div className="mb-3">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-lg">{wg.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(wg.workgroupType)}`}>
                  {wg.workgroupType}
                </span>
              </div>
              
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex items-center">
                  <Building2 className="w-3 h-3 mr-1" />
                  {wg.organization?.name}
                </div>
                <div>Classification: <span className="font-medium">{wg.classification}</span></div>
                {wg.category && <div>Category: <span className="font-medium">{wg.category}</span></div>}
                {wg.email && (
                  <div className="flex items-center">
                    <Mail className="w-3 h-3 mr-1" />
                    {wg.email}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between mb-3 py-2 border-t">
              <div className="flex items-center text-sm">
                <Users className="w-4 h-4 mr-1 text-gray-500" />
                <span className="font-medium">{wg._count?.members || 0}</span>
                <span className="text-gray-500 ml-1">/ {wg.maxMembers}</span>
              </div>
              <button
                onClick={() => openMembersModal(wg)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View Members
              </button>
            </div>

            <div className="flex justify-end space-x-2">
              <button 
                onClick={() => {
                  setSelectedWorkgroup(wg);
                  setShowAddMemberModal(true);
                }}
                className="p-2 text-green-600 hover:bg-green-50 rounded"
                title="Add Member"
              >
                <UserPlus className="w-4 h-4" />
              </button>
              <button 
                onClick={() => openEditModal(wg)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                title="Edit"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleDeleteWorkgroup(wg.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Workgroup Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {modalMode === 'add' ? 'Add New Workgroup' : 'Edit Workgroup'}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organization *
                </label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.organizationId || ''}
                  onChange={(e) => setFormData({...formData, organizationId: e.target.value})}
                >
                  <option value="">Select Organization</option>
                  {organizations.map(org => (
                    <option key={org.id} value={org.id}>{org.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Workgroup Name *
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter workgroup name"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.workgroupType || 'internal'}
                    onChange={(e) => setFormData({...formData, workgroupType: e.target.value as 'internal' | 'external'})}
                  >
                    <option value="internal">Internal</option>
                    <option value="external">External</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Classification
                  </label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.classification || 'team'}
                    onChange={(e) => setFormData({...formData, classification: e.target.value})}
                  >
                    <option value="team">Team</option>
                    <option value="functional_group">Functional Group</option>
                    <option value="project_team">Project Team</option>
                    <option value="department">Department</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.category || ''}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    placeholder="e.g., Operations"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Members
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.maxMembers || 100}
                    onChange={(e) => setFormData({...formData, maxMembers: parseInt(e.target.value)})}
                    min="1"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="workgroup@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.status || 'active'}
                  onChange={(e) => setFormData({...formData, status: e.target.value as 'active' | 'inactive'})}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveWorkgroup}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                {modalMode === 'add' ? 'Create' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Members Modal */}
      {showMembersModal && selectedWorkgroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                Members of {selectedWorkgroup.name}
              </h2>
              <button 
                onClick={() => setShowMembersModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {selectedWorkgroup.members && selectedWorkgroup.members.length > 0 ? (
              <div className="space-y-2">
                {selectedWorkgroup.members.map(member => (
                  <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex items-center">
                      <UserIcon className="w-5 h-5 mr-3 text-gray-500" />
                      <div>
                        <div className="font-medium">
                          {member.user?.firstName} {member.user?.lastName}
                        </div>
                        <div className="text-sm text-gray-600">{member.user?.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">{member.memberRole}</span>
                      <button
                        onClick={() => handleRemoveMember(selectedWorkgroup.id, member.userId)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No members in this workgroup yet
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && selectedWorkgroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                Add Member to {selectedWorkgroup.name}
              </h2>
              <button 
                onClick={() => setShowAddMemberModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select User
                </label>
                <div className="max-h-60 overflow-y-auto border rounded-lg">
                  {availableUsers.map(user => {
                    const isMember = selectedWorkgroup.members?.some(m => m.userId === user.id);
                    return (
                      <div 
                        key={user.id}
                        className={`p-3 hover:bg-gray-50 cursor-pointer ${isMember ? 'opacity-50' : ''}`}
                        onClick={() => !isMember && handleAddMember(user.id, 'member')}
                      >
                        <div className="font-medium">
                          {user.firstName} {user.lastName || user.username}
                        </div>
                        <div className="text-sm text-gray-600">{user.email}</div>
                        {isMember && <span className="text-xs text-green-600">Already a member</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkgroupManagement;
