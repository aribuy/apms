import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit, CheckCircle, Circle, Camera, FileText, Monitor } from 'lucide-react';

interface TemplatePreviewProps {
  templateId?: string;
  onBack: () => void;
  onEdit: () => void;
}

interface TemplateSection {
  id: string;
  section_name: string;
  atp_template_items: TemplateItem[];
}

interface TemplateItem {
  id: string;
  description: string;
  severity: string;
  evidence_type: string;
  scope: string[];
  reference_photo?: string;
}

interface Template {
  id: string;
  template_name: string;
  template_code: string;
  category: string;
  version: string;
  scope: string[];
  atp_template_sections: TemplateSection[];
}

const TemplatePreview: React.FC<TemplatePreviewProps> = ({ templateId, onBack, onEdit }) => {
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (templateId) {
      fetchTemplate();
    }
  }, [templateId]);

  const fetchTemplate = async () => {
    try {
      const response = await fetch(`http://localhost:3011/api/v1/atp-templates/${templateId}`);
      const data = await response.json();
      if (data.success) {
        setTemplate(data.data);
        // Expand first section by default
        if (data.data.atp_template_sections?.length > 0) {
          setExpandedSections(new Set([data.data.atp_template_sections[0].id]));
        }
      }
    } catch (error) {
      console.error('Error fetching template:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const toggleItem = (itemId: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(itemId)) {
      newChecked.delete(itemId);
    } else {
      newChecked.add(itemId);
    }
    setCheckedItems(newChecked);
  };

  const getEvidenceIcon = (type: string) => {
    switch (type) {
      case 'photo': return <Camera className="w-4 h-4" />;
      case 'screenshot': return <Monitor className="w-4 h-4" />;
      case 'document': return <FileText className="w-4 h-4" />;
      default: return <Camera className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'major': return 'text-orange-600 bg-orange-50';
      case 'minor': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading template...</div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 mb-4">Template not found</div>
        <button onClick={onBack} className="text-blue-600 hover:text-blue-700">
          Back to Templates
        </button>
      </div>
    );
  }

  const totalItems = template.atp_template_sections?.reduce((acc, section) => 
    acc + (section.atp_template_items?.length || 0), 0) || 0;
  const completedItems = checkedItems.size;
  const progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Templates</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{template.template_name}</h1>
            <p className="text-gray-600">{template.template_code} • v{template.version}</p>
          </div>
        </div>
        <button
          onClick={onEdit}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Edit className="w-4 h-4" />
          <span>Edit Template</span>
        </button>
      </div>

      {/* Template Info */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-gray-600">Category</div>
            <div className="font-medium capitalize">{template.category}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Scope</div>
            <div className="font-medium">{template.scope?.join(', ') || 'All'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Sections</div>
            <div className="font-medium">{template.atp_template_sections?.length || 0}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Total Items</div>
            <div className="font-medium">{totalItems}</div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Preview Progress</span>
          <span className="text-sm text-gray-600">{completedItems}/{totalItems} items ({progressPercentage}%)</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {template.atp_template_sections?.map((section, sectionIndex) => (
          <div key={section.id} className="bg-white rounded-xl shadow-sm border border-gray-100">
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50"
            >
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {sectionIndex + 1}. {section.section_name}
                </h3>
                <p className="text-sm text-gray-600">
                  {section.atp_template_items?.length || 0} items
                </p>
              </div>
              <div className="text-gray-400">
                {expandedSections.has(section.id) ? '▼' : '▶'}
              </div>
            </button>

            {expandedSections.has(section.id) && (
              <div className="px-6 pb-4 space-y-3">
                {section.atp_template_items?.map((item, itemIndex) => (
                  <div key={item.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <button
                      onClick={() => toggleItem(item.id)}
                      className="mt-1 text-blue-600 hover:text-blue-700"
                    >
                      {checkedItems.has(item.id) ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <p className={`text-sm ${checkedItems.has(item.id) ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          {item.description}
                        </p>
                        <div className="flex items-center space-x-2 ml-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(item.severity)}`}>
                            {item.severity}
                          </span>
                          <div className="text-gray-500" title={`Evidence: ${item.evidence_type}`}>
                            {getEvidenceIcon(item.evidence_type)}
                          </div>
                        </div>
                      </div>
                      {item.scope && item.scope.length > 0 && (
                        <div className="mt-1 text-xs text-gray-500">
                          Scope: {item.scope.join(', ')}
                        </div>
                      )}
                      {item.evidence_type === 'photo' && (
                        <div className="mt-2">
                          {item.reference_photo ? (
                            <img 
                              src={`http://localhost:3011${item.reference_photo}`} 
                              alt="Reference" 
                              className="w-16 h-12 object-cover rounded border cursor-pointer hover:opacity-80"
                              onClick={() => window.open(`http://localhost:3011${item.reference_photo}`, '_blank')}
                            />
                          ) : (
                            <div className="w-16 h-12 bg-gray-200 rounded border-2 border-dashed border-gray-300 flex items-center justify-center">
                              <Camera className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {(!template.atp_template_sections || template.atp_template_sections.length === 0) && (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="text-gray-500 mb-4">No sections in this template</div>
          <button
            onClick={onEdit}
            className="text-blue-600 hover:text-blue-700"
          >
            Add sections to get started
          </button>
        </div>
      )}
    </div>
  );
};

export default TemplatePreview;