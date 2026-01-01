import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, Search, Edit, Copy, Trash2, 
  BarChart3, Eye
} from 'lucide-react';
import TemplateBuilder from './TemplateBuilder';
import TemplatePreview from './TemplatePreview';

interface Template {
  id: string;
  template_code: string;
  template_name: string;
  category: string;
  version: string;
  is_active: boolean;
  scope?: string[];
  atp_template_sections?: any[];
  created_at: string;
  updated_at: string;
}

const ATPTemplateManagement: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    status: 'all'
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentView, setCurrentView] = useState<'list' | 'builder' | 'preview'>('list');
  const [editingTemplateId, setEditingTemplateId] = useState<string | undefined>();
  const fetchTemplates = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.category !== 'all') params.append('category', filters.category);
      if (filters.status !== 'all') params.append('status', filters.status);

      const response = await fetch(`http://localhost:3011/api/v1/atp-templates?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setTemplates(data.data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleCloneTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`http://localhost:3011/api/v1/atp-templates/${templateId}/clone`, {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        fetchTemplates();
      }
    } catch (error) {
      console.error('Error cloning template:', error);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    
    try {
      const response = await fetch(`http://localhost:3011/api/v1/atp-templates/${templateId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      
      if (data.success) {
        fetchTemplates();
      }
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const TemplateCard: React.FC<{ template: Template }> = ({ template }) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
            template.category === 'hardware' ? 'bg-blue-100 text-blue-600' :
            template.category === 'software' ? 'bg-green-100 text-green-600' :
            'bg-purple-100 text-purple-600'
          }`}>
            {template.category === 'hardware' ? '🔧' : 
             template.category === 'software' ? '💻' : '📋'}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{template.template_name}</h3>
            <p className="text-sm text-gray-600">{template.template_code} • v{template.version}</p>
          </div>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
          template.is_active 
            ? 'bg-green-100 text-green-700' 
            : 'bg-gray-100 text-gray-600'
        }`}>
          {template.is_active ? 'Active' : 'Inactive'}
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Category:</span>
          <span className="font-medium capitalize">{template.category}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Items:</span>
          <span className="font-medium">{template.atp_template_sections?.reduce((acc, section) => acc + (section.atp_template_items?.length || 0), 0) || 0}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Scope:</span>
          <span className="font-medium text-xs">{template.scope?.join(', ') || 'All'}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Updated:</span>
          <span className="font-medium">
            {new Date(template.updated_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <button 
          onClick={() => {
            setEditingTemplateId(template.id);
            setCurrentView('preview');
          }}
          className="flex items-center justify-center space-x-2 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
        >
          <Eye className="w-4 h-4" />
          <span>View</span>
        </button>
        <button 
          onClick={() => {
            setEditingTemplateId(template.id);
            setCurrentView('builder');
          }}
          className="flex items-center justify-center space-x-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <Edit className="w-4 h-4" />
          <span>Edit</span>
        </button>
        <button 
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          onClick={() => handleCloneTemplate(template.id)}
          title="Clone Template"
        >
          <Copy className="w-4 h-4" />
        </button>
        <button 
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="View Analytics"
        >
          <BarChart3 className="w-4 h-4" />
        </button>
        <button 
          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
          onClick={() => handleDeleteTemplate(template.id)}
          title="Delete Template"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const CreateTemplateModal: React.FC = () => {
    const [formData, setFormData] = useState({
      template_name: '',
      category: 'hardware',
      version: '1.0'
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        const response = await fetch('http://localhost:3011/api/v1/atp-templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({...formData, scope: ['MW-NEW', 'MW-UPG']})
        });
        const data = await response.json();
        
        if (data.success) {
          setShowCreateModal(false);
          fetchTemplates();
          setFormData({ template_name: '', category: 'hardware', version: '1.0' });
        }
      } catch (error) {
        console.error('Error creating template:', error);
      }
    };

    if (!showCreateModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold mb-4">Create New Template</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template Name *
              </label>
              <input
                type="text"
                required
                value={formData.template_name}
                onChange={(e) => setFormData({...formData, template_name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ATP MW Hardware v1.1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="hardware">Hardware</option>
                <option value="software">Software</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Version
              </label>
              <input
                type="text"
                value={formData.version}
                onChange={(e) => setFormData({...formData, version: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1.0"
              />
            </div>
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Template
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (currentView === 'builder') {
    return (
      <TemplateBuilder 
        templateId={editingTemplateId}
        onBack={() => {
          setCurrentView('list');
          setEditingTemplateId(undefined);
          fetchTemplates();
        }}
      />
    );
  }

  if (currentView === 'preview') {
    return (
      <TemplatePreview 
        templateId={editingTemplateId}
        onBack={() => {
          setCurrentView('list');
          setEditingTemplateId(undefined);
        }}
        onEdit={() => {
          setCurrentView('builder');
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ATP Checklist Templates</h1>
          <p className="text-gray-600">Manage acceptance test procedure templates</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button
            onClick={() => {
              setEditingTemplateId(undefined);
              setCurrentView('builder');
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>Create Template</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search templates..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
              />
            </div>
            <select
              value={filters.category}
              onChange={(e) => setFilters({...filters, category: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="hardware">Hardware</option>
              <option value="software">Software</option>
              <option value="mixed">Mixed</option>
            </select>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({length: 6}).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.length > 0 ? (
            templates.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <div className="text-gray-500 mb-4">No templates found</div>
              <button
                onClick={() => {
                  setEditingTemplateId(undefined);
                  setCurrentView('builder');
                }}
                className="text-blue-600 hover:text-blue-700"
              >
                Create your first template
              </button>
            </div>
          )}
        </div>
      )}

      <CreateTemplateModal />
    </div>
  );
};

export default ATPTemplateManagement;
