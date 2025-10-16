import React, { useState, useEffect } from 'react';
import { 
  Building2, Plus, Edit2, Trash2, Users, X, Save, 
  ChevronDown, ChevronRight, MapPin, Phone, Mail,
  Search, Filter, UserPlus, Upload, Download, FileSpreadsheet
} from 'lucide-react';
import BulkUpload from '../UserManagement/BulkUpload';

interface Organization {
  id: string;
  name: string;
  code: string;
  type: 'internal' | 'customer' | 'vendor' | 'tower_provider' | 'subcon';
  status: 'active' | 'inactive';
  parentOrgId?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  address?: string | null;
  workgroups?: Workgroup[];
  createdAt?: string;
  updatedAt?: string;
}

interface Workgroup {
  id: string;
  name: string;
  organizationId: string;
  workgroupType: 'internal' | 'external';
  classification: string;
  category: string;
  maxMembers: number;
  status: 'active' | 'inactive';
  _count?: {
    members: number;
  };
}

const OrganizationManagement: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [expandedOrgs, setExpandedOrgs] = useState<Set<string>>(new Set());
  const [selectedOrgs, setSelectedOrgs] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Organization>>({
    name: '',
    code: '',
    type: 'vendor',
    status: 'active',
    contactEmail: '',
    contactPhone: '',
    address: ''
  });

  useEffect(() => {
    fetchOrganizations();
  }, []);
  
  const fetchOrganizations = async () => {
    try {
      const token = localStorage.getItem('apms_token');
      const response = await fetch('/api/v1/organizations/list', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setOrganizations(data.data);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOrganization = async () => {
    try {
      const token = localStorage.getItem('apms_token');
      const endpoint = modalMode === 'add' 
        ? '/api/v1/organizations/create'
        : `/api/v1/organizations/update/${formData.id}`;
      
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
        fetchOrganizations();
        setShowModal(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error saving organization:', error);
    }
  };

  const handleDeleteOrganization = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this organization?')) return;
    
    try {
      const token = localStorage.getItem('apms_token');
      const response = await fetch(`/api/v1/organizations/delete/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        fetchOrganizations();
      } else {
        alert(data.error || 'Failed to delete organization');
      }
    } catch (error) {
      console.error('Error deleting organization:', error);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedOrgs.size} selected organizations?`)) return;
    
    for (const orgId of Array.from(selectedOrgs)) {
      await handleDeleteOrganization(orgId);
    }
    setSelectedOrgs(new Set());
    setShowBulkActions(false);
  };

  const downloadData = () => {
    const csvContent = [
      ['name', 'code', 'type', 'status', 'contactEmail', 'contactPhone', 'address'].join(','),
      ...organizations.map(org => [
        org.name,
        org.code,
        org.type,
        org.status,
        org.contactEmail || '',
        org.contactPhone || '',
        org.address || ''
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'organizations_export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const toggleSelectOrg = (orgId: string) => {
    const newSelected = new Set(selectedOrgs);
    if (newSelected.has(orgId)) {
      newSelected.delete(orgId);
    } else {
      newSelected.add(orgId);
    }
    setSelectedOrgs(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const selectAll = () => {
    if (selectedOrgs.size === filteredOrganizations.length) {
      setSelectedOrgs(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedOrgs(new Set(filteredOrganizations.map(org => org.id)));
      setShowBulkActions(true);
    }
  };

  const getTypeColor = (type: string) => {
    const colors: any = {
      'internal': 'bg-blue-100 text-blue-800',
      'customer': 'bg-green-100 text-green-800',
      'vendor': 'bg-purple-100 text-purple-800',
      'tower_provider': 'bg-orange-100 text-orange-800',
      'subcon': 'bg-yellow-100 text-yellow-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };
  
  const getTypeLabel = (type: string) => {
    return type.replace('_', ' ').toUpperCase();
  };
  
  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      type: 'vendor',
      status: 'active',
      contactEmail: '',
      contactPhone: '',
      address: ''
    });
  };
  
  const toggleExpanded = (orgId: string) => {
    const newExpanded = new Set(expandedOrgs);
    if (newExpanded.has(orgId)) {
      newExpanded.delete(orgId);
    } else {
      newExpanded.add(orgId);
    }
    setExpandedOrgs(newExpanded);
  };
  
  const openEditModal = (org: Organization) => {
    setFormData(org);
    setModalMode('edit');
    setShowModal(true);
  };
  
  const openAddModal = () => {
    resetForm();
    setModalMode('add');
    setShowModal(true);
  };
  
  const filteredOrganizations = organizations.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         org.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || org.type === filterType;
    return matchesSearch && matchesType;
  });

  const bulkUploadTemplateHeaders = ['name', 'code', 'type', 'status', 'contactEmail', 'contactPhone', 'address'];
  const bulkUploadSampleData = [
    {
      name: 'PT Example Company',
      code: 'EXAMPLE',
      type: 'vendor',
      status: 'active',
      contactEmail: 'contact@example.com',
      contactPhone: '+62812345678',
      address: 'Jakarta, Indonesia'
    }
  ];
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading organizations...</div>
      </div>
    );
  }
  
  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2 flex items-center">
          <Building2 className="mr-2" /> Organization Management
        </h1>
        <p className="text-gray-600">Manage organizations, workgroups, and their hierarchies</p>
      </div>
      
      <div className="mb-6 bg-white rounded-lg shadow p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 items-center justify-between mb-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search organizations..."
                className="pl-10 pr-4 py-2 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select
              className="px-3 py-2 sm:px-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="internal">Internal</option>
              <option value="customer">Customer</option>
              <option value="vendor">Vendor</option>
              <option value="tower_provider">Tower Provider</option>
              <option value="subcon">Subcontractor</option>
            </select>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={downloadData}
              className="px-3 py-2 sm:px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center"
            >
              <Download className="w-4 h-4 mr-2" /> Export
            </button>
            <BulkUpload 
              entityType="organizations"
              onUploadSuccess={fetchOrganizations}
              templateHeaders={bulkUploadTemplateHeaders}
              sampleData={bulkUploadSampleData}
            />
            <button 
              onClick={openAddModal}
              className="px-3 py-2 sm:px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Organization
            </button>
          </div>
        </div>
        
        {showBulkActions && (
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <span className="text-xs sm:text-sm text-blue-800">
              {selectedOrgs.size} organization(s) selected
            </span>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={handleBulkDelete}
                className="px-3 py-1 text-xs sm:text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete Selected
              </button>
              <button 
                onClick={() => {
                  setSelectedOrgs(new Set());
                  setShowBulkActions(false);
                }}
                className="px-3 py-1 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        
        <div className="mt-4 flex gap-6 text-xs sm:text-sm text-gray-600">
          <button onClick={selectAll} className="text-blue-600 hover:underline">
            {selectedOrgs.size === filteredOrganizations.length ? 'Deselect All' : 'Select All'}
          </button>
          <span>Total Organizations: <strong>{organizations.length}</strong></span>
          <span>Active: <strong>{organizations.filter(o => o.status === 'active').length}</strong></span>
        </div>
      </div>
      
      <div className="grid gap-4">
        {filteredOrganizations.map(org => (
          <div key={org.id} className="bg-white border rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="p-3 sm:p-4">
              <div className="flex items-start">
                <input
                  type="checkbox"
                  checked={selectedOrgs.has(org.id)}
                  onChange={() => toggleSelectOrg(org.id)}
                  className="mt-1 mr-3"
                />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                    <button
                      onClick={() => toggleExpanded(org.id)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      {expandedOrgs.has(org.id) ? 
                        <ChevronDown className="w-4 h-4" /> : 
                        <ChevronRight className="w-4 h-4" />
                      }
                    </button>
                    <h3 className="font-semibold text-base sm:text-lg">{org.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(org.type)}`}>
                      {getTypeLabel(org.type)}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      org.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {org.status}
                    </span>
                  </div>
                  
                  <div className="ml-8 grid grid-cols-1 gap-1 text-xs sm:text-xs sm:text-sm text-xs sm:text-sm text-gray-600">
                    <div>Code: <span className="font-mono font-medium">{org.code}</span></div>
                    {org.contactEmail && (
                      <div className="flex items-center">
                        <Mail className="w-3 h-3 mr-1" />
                        {org.contactEmail}
                      </div>
                    )}
                    {org.contactPhone && (
                      <div className="flex items-center">
                        <Phone className="w-3 h-3 mr-1" />
                        {org.contactPhone}
                      </div>
                    )}
                    {org.workgroups && org.workgroups.length > 0 && (
                      <div className="flex items-center">
                        <Users className="w-3 h-3 mr-1" />
                        {org.workgroups.length} Workgroup(s)
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-1 sm:gap-2 ml-2 sm:ml-4">
                  <button 
                    onClick={() => openEditModal(org)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteOrganization(org.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {expandedOrgs.has(org.id) && org.workgroups && org.workgroups.length > 0 && (
                <div className="mt-4 ml-8 space-y-2">
                  <div className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Workgroups:</div>
                  {org.workgroups.map((wg: Workgroup) => (
                    <div key={wg.id} className="bg-gray-50 rounded p-3 text-xs sm:text-sm">
                      <div className="flex flex-col sm:flex-row gap-2 sm:justify-between sm:items-center">
                        <div>
                          <span className="font-medium">{wg.name}</span>
                          <span className="ml-2 text-gray-500">({wg.classification})</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <span className="text-gray-600">
                            <Users className="w-3 h-3 inline mr-1" />
                            {wg._count?.members || 0}/{wg.maxMembers}
                          </span>
                          <button className="text-blue-600 hover:text-blue-700">
                            <UserPlus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-full mx-4 sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex flex-col sm:flex-row gap-2 sm:justify-between sm:items-center mb-4">
              <h2 className="text-xl font-bold">
                {modalMode === 'add' ? 'Add New Organization' : 'Edit Organization'}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Organization Name *
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter organization name"
                  />
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Code *
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.code || ''}
                    onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    placeholder="e.g., ABC"
                  />
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Type *
                  </label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.type || 'vendor'}
                    onChange={(e) => setFormData({...formData, type: e.target.value as Organization['type']})}
                  >
                    <option value="internal">Internal</option>
                    <option value="customer">Customer</option>
                    <option value="vendor">Vendor</option>
                    <option value="tower_provider">Tower Provider</option>
                    <option value="subcon">Subcontractor</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.status || 'active'}
                    onChange={(e) => setFormData({...formData, status: e.target.value as Organization['status']})}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.contactEmail || ''}
                    onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                    placeholder="email@example.com"
                  />
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.contactPhone || ''}
                    onChange={(e) => setFormData({...formData, contactPhone: e.target.value})}
                    placeholder="+62 xxx-xxxx-xxxx"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  value={formData.address || ''}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  placeholder="Enter full address"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-3 py-2 sm:px-4 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveOrganization}
                className="px-3 py-2 sm:px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                {modalMode === 'add' ? 'Create' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationManagement;
