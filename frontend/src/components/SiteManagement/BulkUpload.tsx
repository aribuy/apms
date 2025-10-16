import React, { useState } from 'react';

interface UploadResult {
  success: Array<{ row: number; siteId: string }>;
  errors: Array<{ row: number; error: string }>;
}

interface Props {
  onSuccess: () => void;
}

const BulkUpload: React.FC<Props> = ({ onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await fetch('/api/sites/template');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'site_template.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      alert('Error downloading template');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/sites/bulk-upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        setResult(data.results);
        if (data.results.success.length > 0) {
          onSuccess();
        }
      } else {
        alert(`Upload failed: ${data.error}`);
      }
    } catch (error) {
      alert('Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Bulk Site Upload</h3>
        
        <div className="mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-blue-900 mb-2">Instructions:</h4>
            <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
              <li>Download the Excel template below</li>
              <li>Fill in your site data following the format</li>
              <li>Upload the completed file</li>
              <li>Review the results and fix any errors</li>
            </ol>
          </div>

          <button
            onClick={downloadTemplate}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 mb-4"
          >
            Download CSV Template
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select CSV/Excel File
          </label>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : 'Upload Sites'}
        </button>

        {result && (
          <div className="mt-6">
            <h4 className="text-lg font-semibold mb-4">Upload Results</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {result.success.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h5 className="font-medium text-green-900 mb-2">
                    Successfully Registered ({result.success.length})
                  </h5>
                  <div className="max-h-40 overflow-y-auto">
                    {result.success.map((item, index) => (
                      <div key={index} className="text-sm text-green-800">
                        Row {item.row}: {item.siteId}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h5 className="font-medium text-red-900 mb-2">
                    Errors ({result.errors.length})
                  </h5>
                  <div className="max-h-40 overflow-y-auto">
                    {result.errors.map((item, index) => (
                      <div key={index} className="text-sm text-red-800 mb-1">
                        <strong>Row {item.row}:</strong> {item.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">
                <strong>Summary:</strong> {result.success.length} successful, {result.errors.length} errors
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-900 mb-2">API Integration</h4>
        <p className="text-sm text-yellow-800 mb-2">
          For external systems, use the API endpoint:
        </p>
        <code className="block bg-yellow-100 p-2 rounded text-sm">
          POST /api/sites/api/register
        </code>
        <p className="text-xs text-yellow-700 mt-2">
          Requires API key in headers. Contact admin for integration details.
        </p>
      </div>
    </div>
  );
};

export default BulkUpload;