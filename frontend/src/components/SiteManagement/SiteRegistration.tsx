import React, { useState, useRef } from 'react';
import { Plus, Upload, Eye, BarChart3, MapPin, CheckCircle, Download, FileText, Edit, Trash2 } from 'lucide-react';

interface SiteRegistrationProps {
  onSitesRegistered?: (sites?: any[]) => void;
}

const SiteRegistration: React.FC<SiteRegistrationProps> = ({ onSitesRegistered }) => {
  const [activeView, setActiveView] = useState<'dashboard' | 'single' | 'bulk' | 'view'>('dashboard');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [validationComplete, setValidationComplete] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'view' | 'edit'>('view');
  const [selectedSite, setSelectedSite] = useState<any>(null);
  const [sites, setSites] = useState<any[]>([
    { id: 'JAW-JI-SMP-4240', name: 'GILIGENTING_KALIANGET', region: 'East Java', neCoords: '-7.1234567, 112.9876543', feCoords: '-7.2345678, 112.8765432' },
    { id: 'JAW-JI-SMP-4241', name: 'SITE_A_SITE_B', region: 'East Java', neCoords: '-7.1234568, 112.9876544', feCoords: '-7.2345679, 112.8765433' },
    { id: 'JAW-JI-SMP-4242', name: 'SITE_C_SITE_D', region: 'East Java', neCoords: '-7.1234569, 112.9876545', feCoords: '-7.2345680, 112.8765434' },
    { id: 'JAW-JI-SMP-4243', name: 'SITE_E_SITE_F', region: 'East Java', neCoords: '-7.1234570, 112.9876546', feCoords: '-7.2345681, 112.8765435' },
    { id: 'JAW-JI-SMP-4244', name: 'SITE_G_SITE_H', region: 'East Java', neCoords: '-7.1234571, 112.9876547', feCoords: '-7.2345682, 112.8765436' },
    { id: 'JAW-JI-SMP-4245', name: 'SITE_I_SITE_J', region: 'East Java', neCoords: '-7.1234572, 112.9876548', feCoords: '-7.2345683, 112.8765437' },
    { id: 'JAW-JI-SMP-4246', name: 'SITE_K_SITE_L', region: 'East Java', neCoords: '-7.1234573, 112.9876549', feCoords: '-7.2345684, 112.8765438' },
    { id: 'JAW-JI-SMP-4247', name: 'SITE_M_SITE_N', region: 'East Java', neCoords: '-7.1234574, 112.9876550', feCoords: '-7.2345685, 112.8765439' }
  ]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const viewSite = (siteId: string) => {
    const site = sites.find(s => s.id === siteId);
    setSelectedSite(site);
    setModalType('view');
    setShowModal(true);
  };

  const editSite = (siteId: string) => {
    const site = sites.find(s => s.id === siteId);
    setSelectedSite({...site});
    setModalType('edit');
    setShowModal(true);
  };

  const deleteSite = (siteId: string) => {
    if (window.confirm(`Are you sure you want to delete site ${siteId}?`)) {
      setSites(sites.filter(s => s.id !== siteId));
      alert(`Site ${siteId} deleted successfully`);
    }
  };

  const saveSite = () => {
    setSites(sites.map(s => s.id === selectedSite.id ? selectedSite : s));
    setShowModal(false);
    alert('Site updated successfully');
  };

  // File upload handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = (file: File) => {
    const allowedTypes = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a CSV or Excel file');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      alert('File size must be less than 25MB');
      return;
    }

    setUploadedFile(file);
    
    setTimeout(() => {
      setValidationComplete(true);
    }, 2000);
  };

  const downloadTemplate = () => {
    const csvContent = `Customer Site ID,Customer Site Name,NE Tower ID,NE Name,FE Tower ID,FE Name,NE Latitude,NE Longitude,FE Latitude,FE Longitude,Region,Coverage Area,Activity Flow,SOW Category,Project Code,Frequency,Capacity,Antenna Size,Equipment Type,Task Type,Priority,Due Date,Task Description
JAW-JI-SMP-4240_JAW-JI-SMP-3128_Y25_MWU0-04,GILIGENTING BRINGSANG_KALIANGET,JAW-JI-SMP-4240,GILIGENTING BRINGSANG,JAW-JI-SMP-3128,KALIANGET,-7.1234567,112.9876543,-7.2345678,112.8765432,East Java,Sumenep District,13. MW Upg Upgrade N+0 Change Antenna,Upgrade N+0,Y25_MWU0-04,18GHz,1Gbps,0.6m,Aviat CTR8000,ATP,High Priority,2024-01-15,MW Upgrade with antenna change`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'site_registration_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const downloadGuide = () => {
    const guideContent = `# Site Registration Guide

## Required Fields:
1. Customer Site ID - Unique identifier for the site
2. Customer Site Name - Descriptive name of the site
3. NE/FE Tower Information - Near End and Far End tower details
4. GPS Coordinates - All four coordinates (NE/FE Lat/Lng)
5. Regional Information - Region and coverage area
6. Technical Specifications - Activity, SOW, equipment details
7. Task Assignment - Task type, priority, and due date

## GPS Coordinate Format:
- Use decimal degrees format (e.g., -7.1234567)
- Indonesia bounds: Latitude -11 to 6, Longitude 95 to 141

## File Requirements:
- Format: CSV or Excel (.xlsx)
- Maximum size: 25MB
- Encoding: UTF-8 recommended

## Common Issues:
- Duplicate Site IDs
- Invalid GPS coordinates
- Missing required fields
- Incorrect date formats`;
    
    const blob = new Blob([guideContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'site_registration_guide.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const processSites = () => {
    alert('Processing 8 valid sites... Sites registered successfully!');
    
    setUploadedFile(null);
    setValidationComplete(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    
    // Call parent callback with sites data
    if (onSitesRegistered) {
      onSitesRegistered(sites);
    }
  };

  const downloadValidationReport = () => {
    const csvContent = `Customer Site ID,Customer Site Name,NE Tower ID,NE Name,FE Tower ID,FE Name,NE Latitude,NE Longitude,FE Latitude,FE Longitude,Region,Coverage Area,Activity Flow,SOW Category,Project Code,Frequency,Capacity,Antenna Size,Equipment Type,Task Type,Priority,Due Date,Task Description,Validation Result
JAW-JI-SMP-4240_JAW-JI-SMP-3128_Y25_MWU0-04,GILIGENTING BRINGSANG_KALIANGET,JAW-JI-SMP-4240,GILIGENTING BRINGSANG,JAW-JI-SMP-3128,KALIANGET,-7.1234567,112.9876543,-7.2345678,112.8765432,East Java,Sumenep District,13. MW Upg Upgrade N+0 Change Antenna,Upgrade N+0,Y25_MWU0-04,18GHz,1Gbps,0.6m,Aviat CTR8000,ATP,High Priority,2024-01-15,MW Upgrade with antenna change,✅ VALID
JAW-JI-SMP-4241_JAW-JI-SMP-3129_Y25_MWU0-05,SITE_A_SITE_B,JAW-JI-SMP-4241,SITE_A,JAW-JI-SMP-3129,SITE_B,-7.1234568,112.9876544,-7.2345679,112.8765433,East Java,Sumenep District,13. MW Upg Upgrade N+0 Change Antenna,Upgrade N+0,Y25_MWU0-05,18GHz,1Gbps,0.6m,Aviat CTR8000,ATP,High Priority,2024-01-16,MW Upgrade,✅ VALID
JAW-JI-SMP-4242_JAW-JI-SMP-3130_Y25_MWU0-06,SITE_C_SITE_D,JAW-JI-SMP-4242,SITE_C,JAW-JI-SMP-3130,SITE_D,-7.1234569,112.9876545,-7.2345680,112.8765434,East Java,Sumenep District,13. MW Upg Upgrade N+0 Change Antenna,Upgrade N+0,Y25_MWU0-06,18GHz,1Gbps,0.6m,Aviat CTR8000,ATP,High Priority,2024-01-17,MW Upgrade,✅ VALID
JAW-JI-SMP-4243_JAW-JI-SMP-3131_Y25_MWU0-07,SITE_E_SITE_F,JAW-JI-SMP-4243,SITE_E,JAW-JI-SMP-3131,SITE_F,-7.1234570,112.9876546,-7.2345681,112.8765435,East Java,Sumenep District,13. MW Upg Upgrade N+0 Change Antenna,Upgrade N+0,Y25_MWU0-07,18GHz,1Gbps,0.6m,Aviat CTR8000,ATP,High Priority,2024-01-18,MW Upgrade,✅ VALID
JAW-JI-SMP-4244_JAW-JI-SMP-3132_Y25_MWU0-08,SITE_G_SITE_H,JAW-JI-SMP-4244,SITE_G,JAW-JI-SMP-3132,SITE_H,-7.1234571,112.9876547,-7.2345682,112.8765436,East Java,Sumenep District,13. MW Upg Upgrade N+0 Change Antenna,Upgrade N+0,Y25_MWU0-08,18GHz,1Gbps,0.6m,Aviat CTR8000,ATP,High Priority,2024-01-19,MW Upgrade,✅ VALID
JAW-JI-SMP-4245_JAW-JI-SMP-3133_Y25_MWU0-09,SITE_I_SITE_J,JAW-JI-SMP-4245,SITE_I,JAW-JI-SMP-3133,SITE_J,-7.1234572,112.9876548,-7.2345683,112.8765437,East Java,Sumenep District,13. MW Upg Upgrade N+0 Change Antenna,Upgrade N+0,Y25_MWU0-09,18GHz,1Gbps,0.6m,Aviat CTR8000,ATP,High Priority,2024-01-20,MW Upgrade,✅ VALID
JAW-JI-SMP-4246_JAW-JI-SMP-3134_Y25_MWU0-10,SITE_K_SITE_L,JAW-JI-SMP-4246,SITE_K,JAW-JI-SMP-3134,SITE_L,-7.1234573,112.9876549,-7.2345684,112.8765438,East Java,Sumenep District,13. MW Upg Upgrade N+0 Change Antenna,Upgrade N+0,Y25_MWU0-10,18GHz,1Gbps,0.6m,Aviat CTR8000,ATP,High Priority,2024-01-21,MW Upgrade,✅ VALID
JAW-JI-SMP-4247_JAW-JI-SMP-3135_Y25_MWU0-11,SITE_M_SITE_N,JAW-JI-SMP-4247,SITE_M,JAW-JI-SMP-3135,SITE_N,-7.1234574,112.9876550,-7.2345685,112.8765439,East Java,Sumenep District,13. MW Upg Upgrade N+0 Change Antenna,Upgrade N+0,Y25_MWU0-11,18GHz,1Gbps,0.6m,Aviat CTR8000,ATP,High Priority,2024-01-22,MW Upgrade,✅ VALID
JAW-JI-SMP-4248_JAW-JI-SMP-3136_Y25_MWU0-12,SITE_O_SITE_P,JAW-JI-SMP-4248,SITE_O,JAW-JI-SMP-3136,SITE_P,-7.1234575,112.9876551,-7.2345686,112.8765440,East Java,Sumenep District,13. MW Upg Upgrade N+0 Change Antenna,Upgrade N+0,Y25_MWU0-12,18GHz,1Gbps,0.6m,Aviat CTR8000,ATP,High Priority,2024-01-23,,⚠️ WARNING: Missing task description
JAW-JI-SMP-4249_JAW-JI-SMP-3137_Y25_MWU0-13,SITE_Q_SITE_R,JAW-JI-SMP-4249,SITE_Q,JAW-JI-SMP-3137,SITE_R,-15.1234576,112.9876552,-15.2345687,112.8765441,East Java,Sumenep District,13. MW Upg Upgrade N+0 Change Antenna,Upgrade N+0,Y25_MWU0-13,18GHz,1Gbps,0.6m,Aviat CTR8000,ATP,High Priority,2024-01-24,MW Upgrade,❌ ERROR: GPS coordinates out of Indonesia bounds`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `validation_report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Site Registration Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">12</div>
            <div className="text-sm text-blue-800">Registered Today</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-yellow-600">3</div>
            <div className="text-sm text-yellow-800">Pending Review</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-red-600">1</div>
            <div className="text-sm text-red-800">Failed Validation</div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <div className="text-xl font-bold text-green-600">45</div>
            <div className="text-sm text-green-800">East Java</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <div className="text-xl font-bold text-purple-600">38</div>
            <div className="text-sm text-purple-800">Central Java</div>
          </div>
          <div className="bg-indigo-50 p-4 rounded-lg text-center">
            <div className="text-xl font-bold text-indigo-600">41</div>
            <div className="text-sm text-indigo-800">West Java</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Registration Methods</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => setActiveView('single')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <Plus className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <div className="font-medium">Register Single Site</div>
          </button>
          
          <button
            onClick={() => setActiveView('bulk')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
          >
            <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <div className="font-medium">Bulk Registration</div>
          </button>
          
          <button
            onClick={() => setActiveView('view')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
          >
            <Eye className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <div className="font-medium">View Registered Sites</div>
          </button>
          
          <button
            onClick={() => setActiveView('view')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors"
          >
            <BarChart3 className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <div className="font-medium">Registration Reports</div>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Registrations</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <span>JKTB025: Registered</span>
            <span className="text-sm text-gray-500">10 min ago</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded">
            <span>JKTB024: Pending review</span>
            <span className="text-sm text-gray-500">25 min ago</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-green-50 rounded">
            <span>JKTB023: Registration complete</span>
            <span className="text-sm text-gray-500">1 hour ago</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBulkRegistration = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setActiveView('dashboard')}
          className="text-blue-600 hover:text-blue-800"
        >
          ← Back to Registration
        </button>
        <h2 className="text-xl font-semibold">Bulk Site Registration</h2>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">File Upload</h3>
        
        <div className="flex space-x-4 mb-6">
          <button 
            onClick={downloadTemplate}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Registration Template
          </button>
          <button 
            onClick={downloadGuide}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <FileText className="w-4 h-4 mr-2" />
            Registration Guide
          </button>
        </div>

        <div 
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className={`w-12 h-12 mx-auto mb-4 ${
            isDragging ? 'text-blue-500' : 'text-gray-400'
          }`} />
          <h4 className="text-lg font-medium mb-2">Drag & Drop Registration File Here</h4>
          <p className="text-gray-600 mb-4">or Click to Browse</p>
          <p className="text-sm text-gray-500 mb-4">
            Supported: CSV, Excel (.xlsx) • Max size: 25MB
          </p>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            📁 Choose File
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
        
        {uploadedFile && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-green-800">File uploaded successfully!</p>
                <p className="text-sm text-green-600">{uploadedFile.name} ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)</p>
              </div>
              <button 
                onClick={() => setUploadedFile(null)}
                className="text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Validation & Preview</h3>
        {uploadedFile ? (
          <div className="space-y-4">
            {!validationComplete ? (
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium">Processing file: {uploadedFile.name}</p>
                  <p className="text-sm text-gray-600">Validating site data and checking for duplicates...</p>
                </div>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="font-medium text-green-800">✅ Validation Complete!</p>
                  <p className="text-sm text-green-600">File processed successfully</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">8</div>
                    <div className="text-sm text-green-800">Valid Records</div>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-yellow-600">1</div>
                    <div className="text-sm text-yellow-800">Warnings</div>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-red-600">1</div>
                    <div className="text-sm text-red-800">Errors</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <button 
                    onClick={processSites}
                    className="w-full px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    ✅ Process 8 Valid Sites
                  </button>
                  <button 
                    onClick={downloadValidationReport}
                    className="w-full px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    📋 Download Validation Report
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            ⏳ Upload a file to see validation results
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => setActiveView('dashboard')}
          className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button 
          onClick={() => {
            setUploadedFile(null);
            setValidationComplete(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
          }}
          className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
        >
          🔄 Reset
        </button>
      </div>
    </div>
  );

  const renderViewSites = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setActiveView('dashboard')}
          className="text-blue-600 hover:text-blue-800"
        >
          ← Back to Registration
        </button>
        <h2 className="text-xl font-semibold">Registered Sites ({sites.length} total)</h2>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Site ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Site Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Region</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ATP SW</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ATP HW</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sites.length > 0 ? sites.map((site) => (
              <tr key={site.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{site.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{site.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{site.region}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Registered</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800">Pending</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800">Pending</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex space-x-2">
                    <button onClick={() => viewSite(site.id)} className="text-blue-600 hover:text-blue-800" title="View">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => editSite(site.id)} className="text-green-600 hover:text-green-800" title="Edit">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteSite(site.id)} className="text-red-600 hover:text-red-800" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  No sites registered yet. Use bulk registration to add sites.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Site Registration</h1>
          <p className="text-gray-600">Manage site registration and Assign Task</p>
        </div>

        {activeView === 'dashboard' && renderDashboard()}
        {activeView === 'bulk' && renderBulkRegistration()}
        {activeView === 'view' && renderViewSites()}
        {activeView === 'single' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Single Site Registration</h3>
            <p className="text-gray-600">Single site registration form will be implemented here.</p>
          </div>
        )}
      </div>

      {/* Site Modal */}
      {showModal && selectedSite && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                {modalType === 'view' ? 'Site Details' : 'Edit Site'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Site ID</label>
                <input
                  type="text"
                  value={selectedSite.id}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Site Name</label>
                <input
                  type="text"
                  value={selectedSite.name}
                  disabled={modalType === 'view'}
                  onChange={(e) => setSelectedSite({...selectedSite, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
                <select
                  value={selectedSite.region}
                  disabled={modalType === 'view'}
                  onChange={(e) => setSelectedSite({...selectedSite, region: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option>East Java</option>
                  <option>Central Java</option>
                  <option>West Java</option>
                  <option>Jabodetabek</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <input
                  type="text"
                  value="Registered"
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">NE Coordinates</label>
                <input
                  type="text"
                  value={selectedSite.neCoords}
                  disabled={modalType === 'view'}
                  onChange={(e) => setSelectedSite({...selectedSite, neCoords: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Latitude, Longitude"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">FE Coordinates</label>
                <input
                  type="text"
                  value={selectedSite.feCoords}
                  disabled={modalType === 'view'}
                  onChange={(e) => setSelectedSite({...selectedSite, feCoords: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Latitude, Longitude"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                {modalType === 'view' ? 'Close' : 'Cancel'}
              </button>
              {modalType === 'edit' && (
                <button
                  onClick={saveSite}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save Changes
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SiteRegistration;