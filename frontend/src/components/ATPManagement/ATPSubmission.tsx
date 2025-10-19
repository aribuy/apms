import React, { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Eye, Download } from 'lucide-react';

interface Site {
  id: string;
  site_id: string;
  site_name: string;
  region: string;
  city: string;
}

interface Template {
  id: string;
  template_code: string;
  template_name: string;
  category: string;
}

interface ATPSubmissionProps {
  userRole?: string;
}

const ATPSubmission: React.FC<ATPSubmissionProps> = ({ userRole = 'VENDOR' }) => {
  const [sites, setSites] = useState<Site[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSites();
    fetchTemplates();
  }, []);

  const fetchSites = async () => {
    try {
      const response = await fetch('/api/v1/sites');
      const data = await response.json();
      setSites(data || []);
    } catch (error) {
      console.error('Error fetching sites:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/v1/atp-templates');
      const data = await response.json();
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setUploadedFile(file);
    } else {
      alert('Please upload a PDF file only');
    }
  };

  const handleSubmit = async () => {
    if (!selectedSite || !selectedTemplate || !uploadedFile) {
      alert('Please select site, template, and upload document');
      return;
    }

    setSubmissionStatus('uploading');

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('siteId', selectedSite.site_id);
      formData.append('templateId', selectedTemplate.id);
      formData.append('category', selectedTemplate.category);

      const response = await fetch('/api/v1/atp/submit', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setSubmissionStatus('success');
        // Reset form
        setSelectedSite(null);
        setSelectedTemplate(null);
        setUploadedFile(null);
      } else {
        setSubmissionStatus('error');
      }
    } catch (error) {
      console.error('Submission error:', error);
      setSubmissionStatus('error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Upload className="mr-3 h-6 w-6 text-blue-600" />
            ATP Document Submission
          </h1>
          <p className="text-gray-600 mt-1">Submit ATP documents for site approval workflow</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Site Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Site *
            </label>
            <select
              value={selectedSite?.id || ''}
              onChange={(e) => {
                const site = sites.find(s => s.id === e.target.value);
                setSelectedSite(site || null);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a site...</option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.site_id} - {site.site_name} ({site.region})
                </option>
              ))}
            </select>
          </div>

          {/* Template Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select ATP Template *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedTemplate?.id === template.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedTemplate(template)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{template.template_name}</h3>
                      <p className="text-sm text-gray-500">{template.template_code}</p>
                      <span className={`inline-block px-2 py-1 text-xs rounded-full mt-2 ${
                        template.category === 'hardware' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {template.category.toUpperCase()}
                      </span>
                    </div>
                    <Eye className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload ATP Document *
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      Drop ATP document here or click to browse
                    </span>
                    <span className="mt-1 block text-xs text-gray-500">
                      PDF files only, max 50MB
                    </span>
                  </label>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    accept=".pdf"
                    className="sr-only"
                    onChange={handleFileUpload}
                  />
                </div>
              </div>
            </div>
            
            {uploadedFile && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-sm text-green-800">
                    {uploadedFile.name} ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Requirements Checklist */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Submission Requirements</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                PDF format only
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                All checklist items must be completed
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                Evidence photos embedded in document
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                Site team signatures required
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                Maximum file size: 50MB
              </div>
            </div>
          </div>

          {/* Submission Status */}
          {submissionStatus === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-green-800">
                  ATP document submitted successfully! It will now enter the approval workflow.
                </span>
              </div>
            </div>
          )}

          {submissionStatus === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-red-800">
                  Failed to submit ATP document. Please try again.
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              onClick={() => {
                setSelectedSite(null);
                setSelectedTemplate(null);
                setUploadedFile(null);
                setSubmissionStatus('idle');
              }}
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!selectedSite || !selectedTemplate || !uploadedFile || submissionStatus === 'uploading'}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submissionStatus === 'uploading' ? 'Submitting...' : 'Submit ATP Document'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ATPSubmission;