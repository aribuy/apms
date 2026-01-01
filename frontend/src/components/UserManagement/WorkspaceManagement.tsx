import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { apiClient } from '../../utils/apiClient';

interface Workspace {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
}

interface Member {
  userId: string;
  email: string;
  username: string | null;
  name: string | null;
  role: string;
  isDefault: boolean;
}

const ROLE_OPTIONS = [
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

const WorkspaceManagement: React.FC = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('');
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
  const [memberErrors, setMemberErrors] = useState<Record<string, string>>({});

  const [createForm, setCreateForm] = useState({
    code: '',
    name: '',
    customerGroupId: '',
    vendorOwnerId: ''
  });

  const [memberForm, setMemberForm] = useState({
    email: '',
    role: 'MEMBER',
    isDefault: false
  });

  const selectedWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === selectedWorkspaceId) || null,
    [workspaces, selectedWorkspaceId]
  );

  const loadWorkspaces = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.get('/api/v1/workspaces');
      const data = response.data?.data || [];
      setWorkspaces(data);
      if (data.length > 0 && !selectedWorkspaceId) {
        setSelectedWorkspaceId(data[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load workspaces:', err);
      setError(err.response?.data?.error || 'Failed to load workspaces');
    } finally {
      setIsLoading(false);
    }
  }, [selectedWorkspaceId]);

  const loadMembers = useCallback(async (workspaceId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.get(`/api/v1/workspaces/${workspaceId}/members`);
      setMembers(response.data?.data || []);
    } catch (err: any) {
      console.error('Failed to load workspace members:', err);
      setError(err.response?.data?.error || 'Failed to load workspace members');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  useEffect(() => {
    if (selectedWorkspaceId) {
      loadMembers(selectedWorkspaceId);
    }
  }, [loadMembers, selectedWorkspaceId]);

  const validateCreateForm = () => {
    const errors: Record<string, string> = {};
    if (!createForm.code.trim()) errors.code = 'Workspace code is required';
    if (!createForm.name.trim()) errors.name = 'Workspace name is required';
    if (!createForm.customerGroupId.trim()) errors.customerGroupId = 'Customer group ID is required';
    if (!createForm.vendorOwnerId.trim()) errors.vendorOwnerId = 'Vendor owner ID is required';
    setCreateErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateMemberForm = () => {
    const errors: Record<string, string> = {};
    if (!memberForm.email.trim()) {
      errors.email = 'User email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(memberForm.email.trim())) {
      errors.email = 'Enter a valid email address';
    }
    if (!memberForm.role.trim()) errors.role = 'Role is required';
    setMemberErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateWorkspace = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateCreateForm()) return;
    try {
      setIsLoading(true);
      setError(null);
      await apiClient.post('/api/v1/workspaces', createForm);
      setCreateForm({ code: '', name: '', customerGroupId: '', vendorOwnerId: '' });
      setShowCreateModal(false);
      await loadWorkspaces();
    } catch (err: any) {
      console.error('Failed to create workspace:', err);
      setError(err.response?.data?.error || 'Failed to create workspace');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMember = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateMemberForm()) return;
    if (!selectedWorkspaceId) return;

    try {
      setIsLoading(true);
      setError(null);
      await apiClient.post(`/api/v1/workspaces/${selectedWorkspaceId}/members`, memberForm);
      setMemberForm({ email: '', role: 'MEMBER', isDefault: false });
      setShowMemberModal(false);
      await loadMembers(selectedWorkspaceId);
    } catch (err: any) {
      console.error('Failed to add member:', err);
      setError(err.response?.data?.error || 'Failed to add member');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (member: Member, nextRole: string) => {
    if (!selectedWorkspaceId) return;
    try {
      setIsLoading(true);
      setError(null);
      await apiClient.put(`/api/v1/workspaces/${selectedWorkspaceId}/members/${member.userId}`, {
        role: nextRole
      });
      await loadMembers(selectedWorkspaceId);
    } catch (err: any) {
      console.error('Failed to update member role:', err);
      setError(err.response?.data?.error || 'Failed to update member role');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (member: Member) => {
    if (!selectedWorkspaceId) return;
    try {
      setIsLoading(true);
      setError(null);
      await apiClient.delete(`/api/v1/workspaces/${selectedWorkspaceId}/members/${member.userId}`);
      await loadMembers(selectedWorkspaceId);
    } catch (err: any) {
      console.error('Failed to remove member:', err);
      setError(err.response?.data?.error || 'Failed to remove member');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Workspace Management</h2>
            <p className="text-sm text-gray-500">Create workspaces and manage members.</p>
          </div>
          {isLoading && <span className="text-xs text-gray-500">Loading…</span>}
        </div>
        {error && <div className="mt-4 text-sm text-red-600">{error}</div>}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Create Workspace</h3>
          <p className="text-sm text-gray-500 mb-4">
            Use this to register a new workspace and assign ownership fields.
          </p>
          <button
            type="button"
            className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700"
            onClick={() => {
              setCreateErrors({});
              setShowCreateModal(true);
            }}
          >
            Open Create Form
          </button>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Workspace List</h3>
          <select
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            value={selectedWorkspaceId}
            onChange={(event) => setSelectedWorkspaceId(event.target.value)}
          >
            <option value="" disabled>
              Select workspace
            </option>
            {workspaces.map((workspace) => (
              <option key={workspace.id} value={workspace.id}>
                {workspace.name} ({workspace.code})
              </option>
            ))}
          </select>

          {selectedWorkspace && (
            <div className="mt-4 text-sm text-gray-600 space-y-1">
              <div><strong>Name:</strong> {selectedWorkspace.name}</div>
              <div><strong>Code:</strong> {selectedWorkspace.code}</div>
              <div><strong>Status:</strong> {selectedWorkspace.is_active ? 'Active' : 'Inactive'}</div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Add Member</h3>
          <p className="text-sm text-gray-500 mb-4">
            Add a user to the selected workspace with a role.
          </p>
          <button
            type="button"
            className="w-full bg-gray-900 text-white rounded-lg py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-60"
            disabled={!selectedWorkspaceId}
            onClick={() => {
              setMemberErrors({});
              setShowMemberModal(true);
            }}
          >
            Open Member Form
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Workspace Members</h3>
        {members.length === 0 ? (
          <div className="text-sm text-gray-500">No members found.</div>
        ) : (
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.userId}
                className="flex flex-col md:flex-row md:items-center md:justify-between border border-gray-100 rounded-lg px-4 py-3"
              >
                <div>
                  <div className="text-sm font-medium text-gray-900">{member.email}</div>
                  <div className="text-xs text-gray-500">{member.name || member.username}</div>
                </div>
                <div className="mt-3 md:mt-0 flex flex-col sm:flex-row sm:items-center sm:space-x-3">
                  <select
                    className="border border-gray-200 rounded-lg px-2 py-1 text-xs"
                    value={member.role}
                    onChange={(event) => handleRoleChange(member, event.target.value)}
                  >
                    {ROLE_OPTIONS.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="mt-2 sm:mt-0 text-xs text-red-600 hover:text-red-700"
                    onClick={() => handleRemoveMember(member)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">Create Workspace</h3>
              <button
                type="button"
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>
            <form className="space-y-3" onSubmit={handleCreateWorkspace}>
              <div>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  placeholder="Workspace Code"
                  value={createForm.code}
                  onChange={(event) => setCreateForm({ ...createForm, code: event.target.value })}
                />
                {createErrors.code && <div className="text-xs text-red-600 mt-1">{createErrors.code}</div>}
              </div>
              <div>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  placeholder="Workspace Name"
                  value={createForm.name}
                  onChange={(event) => setCreateForm({ ...createForm, name: event.target.value })}
                />
                {createErrors.name && <div className="text-xs text-red-600 mt-1">{createErrors.name}</div>}
              </div>
              <div>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  placeholder="Customer Group ID"
                  value={createForm.customerGroupId}
                  onChange={(event) => setCreateForm({ ...createForm, customerGroupId: event.target.value })}
                />
                {createErrors.customerGroupId && (
                  <div className="text-xs text-red-600 mt-1">{createErrors.customerGroupId}</div>
                )}
              </div>
              <div>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  placeholder="Vendor Owner ID"
                  value={createForm.vendorOwnerId}
                  onChange={(event) => setCreateForm({ ...createForm, vendorOwnerId: event.target.value })}
                />
                {createErrors.vendorOwnerId && (
                  <div className="text-xs text-red-600 mt-1">{createErrors.vendorOwnerId}</div>
                )}
              </div>
              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">Add Workspace Member</h3>
              <button
                type="button"
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowMemberModal(false)}
              >
                ✕
              </button>
            </div>
            <form className="space-y-3" onSubmit={handleAddMember}>
              <div>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  placeholder="User Email"
                  value={memberForm.email}
                  onChange={(event) => setMemberForm({ ...memberForm, email: event.target.value })}
                />
                {memberErrors.email && <div className="text-xs text-red-600 mt-1">{memberErrors.email}</div>}
              </div>
              <div>
                <select
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  value={memberForm.role}
                  onChange={(event) => setMemberForm({ ...memberForm, role: event.target.value })}
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                {memberErrors.role && <div className="text-xs text-red-600 mt-1">{memberErrors.role}</div>}
              </div>
              <label className="flex items-center space-x-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={memberForm.isDefault}
                  onChange={(event) => setMemberForm({ ...memberForm, isDefault: event.target.checked })}
                />
                <span>Set as default workspace</span>
              </label>
              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                  onClick={() => setShowMemberModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceManagement;
