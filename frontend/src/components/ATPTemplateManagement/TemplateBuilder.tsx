import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Save, Eye } from 'lucide-react';

interface ChecklistItem {
  id: number;
  description: string;
  severity: 'minor' | 'major' | 'critical';
  evidence_type: 'photo' | 'screenshot' | 'document';
  scope: string[];
  reference_photo?: string;
  status: 'active' | 'obsolete';
}

interface Section {
  id?: string;
  section_name: string;
  description?: string;
  items: ChecklistItem[];
}

interface TemplateData {
  template_name: string;
  category: string;
  version: string;
  scope: string[];
  sections: Section[];
}

interface TemplateBuilderProps {
  templateId?: string;
  onBack: () => void;
}

const TemplateBuilder: React.FC<TemplateBuilderProps> = ({ templateId, onBack }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [templateData, setTemplateData] = useState<TemplateData>({
    template_name: '',
    category: 'hardware',
    version: '1.0',
    scope: [],
    sections: []
  });
  const [loading, setLoading] = useState(false);
  const [zoomedPhoto, setZoomedPhoto] = useState<string | null>(null);

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
        const template = data.data;
        setTemplateData({
          template_name: template.template_name,
          category: template.category,
          version: template.version,
          scope: template.scope || [],
          sections: template.atp_template_sections?.map((section: any) => ({
            section_name: section.section_name,
            description: section.description,
            items: section.atp_template_items?.map((item: any) => ({
              id: item.id,
              description: item.description,
              severity: item.severity,
              evidence_type: item.evidence_type,
              scope: item.scope || [],
              reference_photo: item.reference_photo || null,
              status: 'active'
            })) || []
          })) || []
        });
      }
    } catch (error) {
      console.error('Error fetching template:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Clean template data - only send basic template info, not sections
      const cleanedData = {
        template_name: templateData.template_name,
        category: templateData.category,
        version: templateData.version,
        scope: templateData.scope
      };
      console.log('Saving template data:', cleanedData);
      
      const url = templateId 
        ? `/api/v1/atp-templates/${templateId}`
        : '/api/v1/atp-templates';
      
      const response = await fetch(url, {
        method: templateId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanedData)
      });
      
      const data = await response.json();
      console.log('Save response:', data);
      
      if (data.success) {
        alert('Template saved successfully!');
        onBack();
      } else {
        alert('Error saving template: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Error saving template: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const addSection = () => {
    const newSection: Section = {
      section_name: `New Section ${templateData.sections.length + 1}`,
      items: []
    };
    setTemplateData({
      ...templateData,
      sections: [...templateData.sections, newSection]
    });
  };

  const updateSection = (index: number, sectionName: string) => {
    const updatedSections = [...templateData.sections];
    updatedSections[index].section_name = sectionName;
    setTemplateData({ ...templateData, sections: updatedSections });
  };

  const deleteSection = (index: number) => {
    const updatedSections = templateData.sections.filter((_, i) => i !== index);
    setTemplateData({ ...templateData, sections: updatedSections });
  };

  const addItem = (sectionIndex: number) => {
    const newItem: ChecklistItem = {
      id: Date.now(),
      description: '',
      severity: 'minor',
      evidence_type: 'photo',
      scope: [...templateData.scope],
      reference_photo: '',
      status: 'active'
    };
    
    const updatedSections = [...templateData.sections];
    updatedSections[sectionIndex].items.push(newItem);
    setTemplateData({ ...templateData, sections: updatedSections });
  };

  const updateItem = (sectionIndex: number, itemIndex: number, field: keyof ChecklistItem, value: any) => {
    const updatedSections = [...templateData.sections];
    updatedSections[sectionIndex].items[itemIndex] = {
      ...updatedSections[sectionIndex].items[itemIndex],
      [field]: value
    };
    setTemplateData({ ...templateData, sections: updatedSections });
  };

  const deleteItem = (sectionIndex: number, itemIndex: number) => {
    const updatedSections = [...templateData.sections];
    updatedSections[sectionIndex].items = updatedSections[sectionIndex].items.filter((_, i) => i !== itemIndex);
    setTemplateData({ ...templateData, sections: updatedSections });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, sectionIndex: number, itemIndex: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('photo', file);

    try {
      const response = await fetch('http://localhost:3011/api/v1/upload/reference-photo', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      if (data.success) {
        // Update the item in state
        updateItem(sectionIndex, itemIndex, 'reference_photo', data.data.url);
        
        // If editing existing template, update the photo in database immediately
        if (templateId) {
          const item = templateData.sections[sectionIndex].items[itemIndex];
          await fetch(`http://localhost:3011/api/v1/atp-templates/${templateId}/items/${item.id}/photo`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reference_photo: data.data.url })
          });
        }
      } else {
        alert('Upload failed: ' + data.error);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed');
    }
  };

  const BasicInfoStep = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Template Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Template Name *
          </label>
          <input
            type="text"
            required
            value={templateData.template_name}
            onChange={(e) => setTemplateData({...templateData, template_name: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="ATP MW Hardware v1.1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category *
          </label>
          <select
            value={templateData.category}
            onChange={(e) => setTemplateData({...templateData, category: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="hardware">Hardware</option>
            <option value="software">Software</option>
            <option value="mixed">Mixed</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Version *
          </label>
          <input
            type="text"
            value={templateData.version}
            onChange={(e) => setTemplateData({...templateData, version: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="1.0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Scope of Work *
          </label>
          <div className="grid grid-cols-2 gap-2">
            {['MW-NEW', 'MW-UPG', 'MW-RPL', 'MW-RELOC', 'TX-NEW', 'TX-UPG'].map(scopeItem => (
              <label key={scopeItem} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={templateData.scope.includes(scopeItem)}
                  onChange={(e) => {
                    const newScope = e.target.checked 
                      ? [...templateData.scope, scopeItem]
                      : templateData.scope.filter(s => s !== scopeItem);
                    setTemplateData({...templateData, scope: newScope});
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">{scopeItem}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const [selectedSectionIndex, setSelectedSectionIndex] = useState<number>(0);

  const SectionsStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Template Sections</h3>
        <button
          onClick={addSection}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          <span>Add Section</span>
        </button>
      </div>

      {(templateData.sections || []).map((section, sectionIndex) => (
        <div key={sectionIndex} className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <input
              type="text"
              value={section.section_name}
              onChange={(e) => updateSection(sectionIndex, e.target.value)}
              className="text-lg font-medium bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-3 py-2 flex-1"
              placeholder="Section Name"
            />
            <button
              onClick={() => deleteSection(sectionIndex)}
              className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <div className="text-sm text-gray-600">
            {section.items?.length || 0} items
          </div>
        </div>
      ))}

      {(!templateData.sections || templateData.sections.length === 0) && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">No sections added yet</p>
          <button
            onClick={addSection}
            className="text-blue-600 hover:text-blue-700"
          >
            Add your first section
          </button>
        </div>
      )}
    </div>
  );

  const ItemsStep = () => {
    const currentSection = templateData.sections?.[selectedSectionIndex];
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Checklist Items</h3>
          {currentSection && (
            <button
              onClick={() => addItem(selectedSectionIndex)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              <span>Add Item</span>
            </button>
          )}
        </div>

        {templateData.sections && templateData.sections.length > 0 ? (
          <>
            <div className="flex space-x-2 mb-4">
              {templateData.sections.map((section, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedSectionIndex(index)}
                  className={`px-3 py-2 rounded-lg text-sm ${
                    selectedSectionIndex === index
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {section.section_name} ({section.items?.length || 0})
                </button>
              ))}
            </div>

            {currentSection && (
              <div className="space-y-3">
                {currentSection.items?.map((item, itemIndex) => (
                  <div key={item.id} className="bg-white rounded-lg p-4 border">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description *
                          </label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateItem(selectedSectionIndex, itemIndex, 'description', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Checklist item description"
                          />
                        </div>

                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Severity
                          </label>
                          <select
                            value={item.severity}
                            onChange={(e) => updateItem(selectedSectionIndex, itemIndex, 'severity', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="minor">Minor</option>
                            <option value="major">Major</option>
                            <option value="critical">Critical</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Evidence Type
                          </label>
                          <select
                            value={item.evidence_type}
                            onChange={(e) => updateItem(selectedSectionIndex, itemIndex, 'evidence_type', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="photo">Photo</option>
                            <option value="document">Document</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Status
                          </label>
                          <select
                            value={item.status}
                            onChange={(e) => updateItem(selectedSectionIndex, itemIndex, 'status', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="active">Active</option>
                            <option value="obsolete">Obsolete</option>
                          </select>
                        </div>
                        <div className="flex items-end">
                          <button
                            onClick={() => deleteItem(selectedSectionIndex, itemIndex)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Reference Photo
                        </label>
                        <div className="w-48 h-36 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center relative overflow-hidden hover:border-blue-400 transition-colors cursor-pointer" onClick={() => document.getElementById(`photo-upload-${selectedSectionIndex}-${itemIndex}`)?.click()}>
                          {item.reference_photo ? (
                            <>
                              <img 
                                src={item.reference_photo} 
                                alt="Reference" 
                                className="w-full h-full object-cover"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setZoomedPhoto(item.reference_photo!);
                                }}
                              />
                              <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                                🔍 Click to zoom
                              </div>
                            </>
                          ) : (
                            <div className="text-center">
                              <div className="text-gray-400 mb-2">📷</div>
                              <div className="text-xs text-gray-500">Upload reference photo</div>
                            </div>
                          )}
                          <input
                            id={`photo-upload-${selectedSectionIndex}-${itemIndex}`}
                            type="file"
                            accept="image/*"
                            onChange={(e) => handlePhotoUpload(e, selectedSectionIndex, itemIndex)}
                            className="hidden"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )) || []}
                
                <button
                  onClick={() => addItem(selectedSectionIndex)}
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
                >
                  + Add Checklist Item to {currentSection.section_name}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-4">Create sections first before adding items</p>
          </div>
        )}
      </div>
    );
  };

  const steps = [
    { number: 1, name: 'Basic Info', component: BasicInfoStep },
    { number: 2, name: 'Sections', component: SectionsStep },
    { number: 3, name: 'Items', component: ItemsStep }
  ];

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
            <h1 className="text-2xl font-bold text-gray-900">
              {templateId ? 'Edit Template' : 'Create Template'}
            </h1>
            <p className="text-gray-600">
              {templateData.template_name || 'New ATP Template'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Saving...' : 'Save Template'}</span>
          </button>
        </div>
      </div>

      {/* Step Navigation */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center space-x-8">
          {steps.map((step) => (
            <button
              key={step.number}
              onClick={() => setCurrentStep(step.number)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                currentStep === step.number
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === step.number
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-300 text-gray-600'
              }`}>
                {step.number}
              </div>
              <span>{step.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        {steps.find(step => step.number === currentStep)?.component()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          Previous
        </button>
        {currentStep < steps.length ? (
          <button
            onClick={() => setCurrentStep(currentStep + 1)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Template'}
          </button>
        )}
      </div>

      {/* Photo Zoom Modal */}
      {zoomedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setZoomedPhoto(null)}>
          <div className="max-w-4xl max-h-4xl p-4">
            <img 
              src={zoomedPhoto} 
              alt="Zoomed Reference" 
              className="max-w-full max-h-full object-contain"
            />
            <div className="text-center mt-4">
              <button 
                onClick={() => setZoomedPhoto(null)}
                className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateBuilder;