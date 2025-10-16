import React, { useState } from 'react';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, X } from 'lucide-react';

interface BulkUploadProps {
  entityType: 'organizations' | 'workgroups' | 'teams' | 'users';
  onUploadSuccess: () => void;
  templateHeaders: string[];
  sampleData: any[];
}

const BulkUpload: React.FC<BulkUploadProps> = ({ 
  entityType, 
  onUploadSuccess, 
  templateHeaders,
  sampleData 
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);

  const downloadTemplate = () => {
    // Create CSV content
    const headers = templateHeaders.join(',');
    const sampleRows = sampleData.map(row => 
      templateHeaders.map(header => row[header] || '').join(',')
    ).join('\n');
    
    const csvContent = `${headers}\n${sampleRows}`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entityType}_template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv') && !selectedFile.name.endsWith('.xlsx')) {
      setErrors(['Please upload a CSV or Excel file']);
      return;
    }

    setFile(selectedFile);
    setErrors([]);
    
    // Parse and preview file
    const text = await selectedFile.text();
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const data = lines.slice(1).filter(line => line.trim()).map(line => {
      const values = line.split(',').map(v => v.trim());
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      return obj;
    });
    
    setPreview(data.slice(0, 5)); // Show first 5 rows
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', entityType);

    try {
      const token = localStorage.getItem('apms_token');
      const response = await fetch(`/api/v1/bulk/${entityType}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();
      
      if (result.success) {
        onUploadSuccess();
        setShowModal(false);
        setFile(null);
        setPreview([]);
      } else {
        setErrors(result.errors || ['Upload failed']);
      }
    } catch (error) {
      setErrors(['Upload failed. Please try again.']);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
      >
        <Upload className="w-4 h-4 mr-2" />
        Bulk Upload
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                Bulk Upload {entityType.charAt(0).toUpperCase() + entityType.slice(1)}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step 1: Download Template */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center">
                <FileSpreadsheet className="w-5 h-5 mr-2" />
                Step 1: Download Template
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Download the template file and fill in your data following the format.
              </p>
              <button
                onClick={downloadTemplate}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Download CSV Template
              </button>
            </div>

            {/* Step 2: Upload File */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center">
                <Upload className="w-5 h-5 mr-2" />
                Step 2: Upload Your File
              </h3>
              <input
                type="file"
                accept=".csv,.xlsx"
                onChange={handleFileSelect}
                className="mb-3"
              />
              {file && (
                <p className="text-sm text-green-600 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Selected: {file.name}
                </p>
              )}
            </div>

            {/* Preview */}
            {preview.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Preview (First 5 rows)</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {Object.keys(preview[0]).map(key => (
                          <th key={key} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {preview.map((row, index) => (
                        <tr key={index}>
                          {Object.values(row).map((value: any, idx) => (
                            <td key={idx} className="px-3 py-2 text-sm text-gray-900">
                              {value}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Errors */}
            {errors.length > 0 && (
              <div className="mb-4 p-4 bg-red-50 rounded-lg">
                <div className="flex items-center text-red-800">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <div>
                    {errors.map((error, index) => (
                      <p key={index} className="text-sm">{error}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                {uploading ? 'Uploading...' : 'Upload & Import'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BulkUpload;
