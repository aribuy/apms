import React, { useState } from 'react';
import { Upload, Download, FileText, AlertCircle } from 'lucide-react';

const ATPDocumentGenerator: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validTypes = ['.xlsx', '.xls', '.csv'];
      const fileExt = selectedFile.name.toLowerCase().substring(selectedFile.name.lastIndexOf('.'));
      
      if (validTypes.includes(fileExt)) {
        setFile(selectedFile);
        setMessage('');
      } else {
        setMessage('Please select Excel or CSV file (.xlsx, .xls, or .csv)');
        setFile(null);
      }
    }
  };

  const handleGenerate = async () => {
    if (!file) {
      setMessage('Please select file first');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('excelFile', file);

    try {
      const response = await fetch('/api/v1/atp-generator/generate', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ATP_Document_${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        setMessage('ATP document generated successfully!');
        setFile(null);
      } else {
        setMessage('Failed to generate ATP document');
      }
    } catch (error) {
      setMessage('Error generating document');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await fetch('/api/v1/atp-generator/template');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ATP_Template.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      setMessage('Failed to download template');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">ATP Document Generator</h1>
        <p className="text-gray-600">Generate ATP documents from Excel data</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {/* Template Download */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2 flex items-center">
            <FileText className="mr-2" size={20} />
            Step 1: Download Template
          </h3>
          <p className="text-gray-600 mb-3">
            Download Excel template and fill with ATP information
          </p>
          <button
            onClick={downloadTemplate}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Download className="mr-2" size={16} />
            Download Template
          </button>
        </div>

        {/* File Upload */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2 flex items-center">
            <Upload className="mr-2" size={20} />
            Step 2: Upload Excel File
          </h3>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
              id="excel-upload"
            />
            <label
              htmlFor="excel-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <span className="text-lg font-medium text-gray-900">
                Click to upload Excel file
              </span>
              <span className="text-sm text-gray-500">
                Supports .xlsx, .xls, and .csv files
              </span>
            </label>
            
            {file && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <p className="text-green-800 font-medium">{file.name}</p>
                <p className="text-green-600 text-sm">Ready to generate</p>
              </div>
            )}
          </div>
        </div>

        {/* Generate Button */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Step 3: Generate ATP Document</h3>
          <button
            onClick={handleGenerate}
            disabled={!file || loading}
            className={`px-6 py-3 rounded-lg font-medium flex items-center ${
              !file || loading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            <FileText className="mr-2" size={16} />
            {loading ? 'Generating...' : 'Generate ATP Document'}
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-lg flex items-center ${
            message.includes('success') 
              ? 'bg-green-50 text-green-800' 
              : 'bg-red-50 text-red-800'
          }`}>
            <AlertCircle className="mr-2" size={16} />
            {message}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold mb-2">Template Structure:</h4>
          <div className="text-sm text-gray-600 space-y-2">
            <div>
              <strong>CSV Template Fields:</strong>
              <ul className="ml-4 mt-1 space-y-1">
                <li>• Project_Code, Link_ID, Link_Name</li>
                <li>• Site information: Site_ID_NE, Site_Name_NE, Site_ID_FE, Site_Name_FE</li>
                <li>• Region, SOW, Vendor, Test_Date, Engineer</li>
                <li>• Technical specs: Frequency, Bandwidth, Modulation</li>
              </ul>
            </div>
          </div>
          <div className="mt-3 text-sm text-blue-600">
            <strong>Instructions:</strong> Download CSV template → Fill data → Upload CSV/Excel → Generate PDF
          </div>
        </div>
      </div>
    </div>
  );
};

export default ATPDocumentGenerator;