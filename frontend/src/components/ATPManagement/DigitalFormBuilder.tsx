import React, { useState, useEffect } from 'react';
import { Upload, File, X, Save, Eye, Download } from 'lucide-react';

interface FormField {
  name: string;
  type: string;
  required: boolean;
  label: string;
  options?: string[];
}

interface FormSection {
  id: string;
  title: string;
  fields: FormField[];
}

interface Template {
  id: string;
  template_code: string;
  template_name: string;
  category: string;
  version?: string;
  form_schema: {
    sections: FormSection[];
  };
  checklist_items: Array<{
    section: string;
    items: string[];
  }>;
}

interface DigitalFormBuilderProps {
  atpId: string;
  category: 'hardware' | 'software';
  onFormSubmit: (formData: any) => void;
  initialData?: any;
}

const DigitalFormBuilder: React.FC<DigitalFormBuilderProps> = ({
  atpId,
  category,
  onFormSubmit,
  initialData
}) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [attachments, setAttachments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
    loadExistingData();
  }, [category, atpId]);

  const loadTemplates = async () => {
    try {
      const response = await fetch(`/api/v1/documents/templates?category=${category}`);
      const data = await response.json();
      setTemplates(data);
      
      if (data.length > 0 && !selectedTemplate) {
        setSelectedTemplate(data[0]);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const loadExistingData = async () => {
    try {
      const [formResponse, attachmentsResponse] = await Promise.all([
        fetch(`/api/v1/documents/${atpId}/form-data`),
        fetch(`/api/v1/documents/${atpId}/attachments`)
      ]);

      if (formResponse.ok) {
        const formResult = await formResponse.json();
        if (formResult.form_data) {
          setFormData(formResult.form_data);
        }
      }

      if (attachmentsResponse.ok) {
        const attachmentsResult = await attachmentsResponse.json();
        setAttachments(attachmentsResult);
      }
    } catch (error) {
      console.error('Failed to load existing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (sectionId: string, fieldName: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        [fieldName]: value
      }
    }));
  };

  const handleFileUpload = async (files: FileList, fileType: string = 'supporting') => {
    if (!files.length) return;

    setUploading(true);
    const formData = new FormData();
    
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });
    formData.append('fileType', fileType);

    try {
      const response = await fetch(`/api/v1/documents/upload/${atpId}`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setAttachments(prev => [...prev, ...result.files]);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('File upload error:', error);
      alert('Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = async (attachmentId: string) => {
    try {
      const response = await fetch(`/api/v1/documents/attachments/${attachmentId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setAttachments(prev => prev.filter(att => att.id !== attachmentId));
      }
    } catch (error) {
      console.error('Failed to remove attachment:', error);
    }
  };

  const saveFormData = async () => {
    try {
      const response = await fetch(`/api/v1/documents/${atpId}/form-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          formData,
          templateId: selectedTemplate?.id
        })
      });

      if (response.ok) {
        alert('Form data saved successfully');
        onFormSubmit(formData);
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save form data');
    }
  };

  const renderField = (section: FormSection, field: FormField) => {
    const sectionData = formData[section.id] || {};
    const value = sectionData[field.name] || '';

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(section.id, field.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required={field.required}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleFieldChange(section.id, field.name, e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required={field.required}
          />
        );

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleFieldChange(section.id, field.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required={field.required}
          >
            <option value="">Select {field.label}</option>
            {field.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );

      case 'coordinates':
        return (
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              step="any"
              placeholder="Latitude"
              value={value.lat || ''}
              onChange={(e) => handleFieldChange(section.id, field.name, { ...value, lat: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required={field.required}
            />
            <input
              type="number"
              step="any"
              placeholder="Longitude"
              value={value.lng || ''}
              onChange={(e) => handleFieldChange(section.id, field.name, { ...value, lng: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required={field.required}
            />
          </div>
        );

      case 'file':
        return (
          <div className="space-y-2">
            <input
              type="file"
              onChange={(e) => e.target.files && handleFileUpload(e.target.files, 'evidence')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              multiple
            />
            <p className="text-sm text-gray-500">Upload supporting files or evidence</p>
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(section.id, field.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required={field.required}
          />
        );
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading form...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Template Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Select Template</h3>
        <select
          value={selectedTemplate?.id || ''}
          onChange={(e) => {
            const template = templates.find(t => t.id === e.target.value);
            setSelectedTemplate(template || null);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {templates.map(template => (
            <option key={template.id} value={template.id}>
              {template.template_name} (v{template.version || '1.0'})
            </option>
          ))}
        </select>
      </div>

      {/* Digital Form */}
      {selectedTemplate && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">{selectedTemplate.template_name}</h3>
            <button
              onClick={saveFormData}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Form
            </button>
          </div>

          <div className="space-y-8">
            {selectedTemplate.form_schema.sections.map(section => (
              <div key={section.id} className="border-l-4 border-blue-500 pl-6">
                <h4 className="text-md font-medium mb-4">{section.title}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {section.fields.map(field => (
                    <div key={field.name} className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {renderField(section, field)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File Attachments */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Attachments</h3>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            type="file"
            multiple
            onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-gray-600">Click to upload files or drag and drop</p>
            <p className="text-sm text-gray-500">PDF, Images, Documents (Max 50MB each)</p>
          </label>
        </div>

        {uploading && (
          <div className="mt-4 text-center text-blue-600">Uploading files...</div>
        )}

        {attachments.length > 0 && (
          <div className="mt-6 space-y-2">
            <h4 className="font-medium">Uploaded Files</h4>
            {attachments.map(attachment => (
              <div key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div className="flex items-center">
                  <File className="w-4 h-4 mr-2 text-gray-500" />
                  <span className="text-sm">{attachment.original_name || attachment.originalName}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    ({Math.round((attachment.file_size || attachment.fileSize) / 1024)} KB)
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => window.open(`/api/v1/documents/download/${attachment.id}`, '_blank')}
                    className="p-1 text-blue-600 hover:text-blue-800"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeAttachment(attachment.id)}
                    className="p-1 text-red-600 hover:text-red-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DigitalFormBuilder;