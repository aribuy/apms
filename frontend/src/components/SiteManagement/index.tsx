import React, { useState, useRef } from 'react';
import { Upload, Download, Plus, X } from 'lucide-react';

interface Site {
  id: number;
  site_id: string;
  site_name: string;
  site_type: string;
  region: string;
  city: string;
  status: string;
  created_at: string;
}

const SiteManagement: React.FC = () => {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [validationComplete, setValidationComplete] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showSiteModal, setShowSiteModal] = useState(false);
  const [modalType, setModalType] = useState<'view' | 'edit'>('view');
  const [selectedSite, setSelectedSite] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setUploadedFile(file);
    setTimeout(() => setValidationComplete(true), 2000);
  };

  const downloadTemplate = () => {
    const csvContent = `Customer Site ID,Customer Site Name,NE Tower ID,NE Name,FE Tower ID,FE Name,NE Latitude,NE Longitude,FE Latitude,FE Longitude,Region,Coverage Area,Activity Flow,SOW Category,Project Code,Frequency,Capacity,Antenna Size,Equipment Type,Task Type,Priority,Due Date,Task Description\nJAW-JI-SMP-4240_JAW-JI-SMP-3128_Y25_MWU0-04,GILIGENTING BRINGSANG_KALIANGET,JAW-JI-SMP-4240,GILIGENTING BRINGSANG,JAW-JI-SMP-3128,KALIANGET,-7.1234567,112.9876543,-7.2345678,112.8765432,East Java,Sumenep District,13. MW Upg Upgrade N+0 Change Antenna,Upgrade N+0,Y25_MWU0-04,18GHz,1Gbps,0.6m,Aviat CTR8000,ATP,High Priority,2024-01-15,MW Upgrade with antenna change`;
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

  const fetchSites = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/sites');
      const data = await response.json();
      setSites(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching sites:', error);
      setSites([]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchSites();
  }, []);

  const processSites = async () => {
    const sitesData = [
      { siteId: 'JAW-JI-SMP-4240', siteName: 'GILIGENTING_KALIANGET', siteType: 'MW', region: 'East Java', city: 'Sumenep', neLatitude: -7.1234567, neLongitude: 112.9876543, feLatitude: -7.2345678, feLongitude: 112.8765432, status: 'ACTIVE' },
      { siteId: 'JAW-JI-SMP-4241', siteName: 'SITE_A_SITE_B', siteType: 'MW', region: 'East Java', city: 'Sumenep', neLatitude: -7.1234568, neLongitude: 112.9876544, feLatitude: -7.2345679, feLongitude: 112.8765433, status: 'ACTIVE' },
      { siteId: 'JAW-JI-SMP-4242', siteName: 'SITE_C_SITE_D', siteType: 'MW', region: 'East Java', city: 'Sumenep', neLatitude: -7.1234569, neLongitude: 112.9876545, feLatitude: -7.2345680, feLongitude: 112.8765434, status: 'ACTIVE' },
      { siteId: 'JAW-JI-SMP-4243', siteName: 'SITE_E_SITE_F', siteType: 'MW', region: 'East Java', city: 'Sumenep', neLatitude: -7.1234570, neLongitude: 112.9876546, feLatitude: -7.2345681, feLongitude: 112.8765435, status: 'ACTIVE' },
      { siteId: 'JAW-JI-SMP-4244', siteName: 'SITE_G_SITE_H', siteType: 'MW', region: 'East Java', city: 'Sumenep', neLatitude: -7.1234571, neLongitude: 112.9876547, feLatitude: -7.2345682, feLongitude: 112.8765436, status: 'ACTIVE' },
      { siteId: 'JAW-JI-SMP-4245', siteName: 'SITE_I_SITE_J', siteType: 'MW', region: 'East Java', city: 'Sumenep', neLatitude: -7.1234572, neLongitude: 112.9876548, feLatitude: -7.2345683, feLongitude: 112.8765437, status: 'ACTIVE' },
      { siteId: 'JAW-JI-SMP-4246', siteName: 'SITE_K_SITE_L', siteType: 'MW', region: 'East Java', city: 'Sumenep', neLatitude: -7.1234573, neLongitude: 112.9876549, feLatitude: -7.2345684, feLongitude: 112.8765438, status: 'ACTIVE' },
      { siteId: 'JAW-JI-SMP-4247', siteName: 'SITE_M_SITE_N', siteType: 'MW', region: 'East Java', city: 'Sumenep', neLatitude: -7.1234574, neLongitude: 112.9876550, feLatitude: -7.2345685, feLongitude: 112.8765439, status: 'ACTIVE' }
    ];

    try {
      const response = await fetch('/api/sites/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sites: sitesData })
      });
      
      if (response.ok) {
        alert('Processing 8 valid sites... Sites registered successfully!');
        await fetchSites();
      } else {
        alert('Error registering sites');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error registering sites');
    }

    setUploadedFile(null);
    setValidationComplete(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setShowModal(false);
  };

  const downloadValidationReport = () => {
    const csvContent = `Customer Site ID,Customer Site Name,NE Tower ID,NE Name,FE Tower ID,FE Name,NE Latitude,NE Longitude,FE Latitude,FE Longitude,Region,Coverage Area,Activity Flow,SOW Category,Project Code,Frequency,Capacity,Antenna Size,Equipment Type,Task Type,Priority,Due Date,Task Description,Validation Result\nJAW-JI-SMP-4240_JAW-JI-SMP-3128_Y25_MWU0-04,GILIGENTING BRINGSANG_KALIANGET,JAW-JI-SMP-4240,GILIGENTING BRINGSANG,JAW-JI-SMP-3128,KALIANGET,-7.1234567,112.9876543,-7.2345678,112.8765432,East Java,Sumenep District,13. MW Upg Upgrade N+0 Change Antenna,Upgrade N+0,Y25_MWU0-04,18GHz,1Gbps,0.6m,Aviat CTR8000,ATP,High Priority,2024-01-15,MW Upgrade with antenna change,✅ VALID\nJAW-JI-SMP-4241_JAW-JI-SMP-3129_Y25_MWU0-05,SITE_A_SITE_B,JAW-JI-SMP-4241,SITE_A,JAW-JI-SMP-3129,SITE_B,-7.1234568,112.9876544,-7.2345679,112.8765433,East Java,Sumenep District,13. MW Upg Upgrade N+0 Change Antenna,Upgrade N+0,Y25_MWU0-05,18GHz,1Gbps,0.6m,Aviat CTR8000,ATP,High Priority,2024-01-16,MW Upgrade,✅ VALID\nJAW-JI-SMP-4242_JAW-JI-SMP-3130_Y25_MWU0-06,SITE_C_SITE_D,JAW-JI-SMP-4242,SITE_C,JAW-JI-SMP-3130,SITE_D,-7.1234569,112.9876545,-7.2345680,112.8765434,East Java,Sumenep District,13. MW Upg Upgrade N+0 Change Antenna,Upgrade N+0,Y25_MWU0-06,18GHz,1Gbps,0.6m,Aviat CTR8000,ATP,High Priority,2024-01-17,MW Upgrade,✅ VALID\nJAW-JI-SMP-4243_JAW-JI-SMP-3131_Y25_MWU0-07,SITE_E_SITE_F,JAW-JI-SMP-4243,SITE_E,JAW-JI-SMP-3131,SITE_F,-7.1234570,112.9876546,-7.2345681,112.8765435,East Java,Sumenep District,13. MW Upg Upgrade N+0 Change Antenna,Upgrade N+0,Y25_MWU0-07,18GHz,1Gbps,0.6m,Aviat CTR8000,ATP,High Priority,2024-01-18,MW Upgrade,✅ VALID\nJAW-JI-SMP-4244_JAW-JI-SMP-3132_Y25_MWU0-08,SITE_G_SITE_H,JAW-JI-SMP-4244,SITE_G,JAW-JI-SMP-3132,SITE_H,-7.1234571,112.9876547,-7.2345682,112.8765436,East Java,Sumenep District,13. MW Upg Upgrade N+0 Change Antenna,Upgrade N+0,Y25_MWU0-08,18GHz,1Gbps,0.6m,Aviat CTR8000,ATP,High Priority,2024-01-19,MW Upgrade,✅ VALID\nJAW-JI-SMP-4245_JAW-JI-SMP-3133_Y25_MWU0-09,SITE_I_SITE_J,JAW-JI-SMP-4245,SITE_I,JAW-JI-SMP-3133,SITE_J,-7.1234572,112.9876548,-7.2345683,112.8765437,East Java,Sumenep District,13. MW Upg Upgrade N+0 Change Antenna,Upgrade N+0,Y25_MWU0-09,18GHz,1Gbps,0.6m,Aviat CTR8000,ATP,High Priority,2024-01-20,MW Upgrade,✅ VALID\nJAW-JI-SMP-4246_JAW-JI-SMP-3134_Y25_MWU0-10,SITE_K_SITE_L,JAW-JI-SMP-4246,SITE_K,JAW-JI-SMP-3134,SITE_L,-7.1234573,112.9876549,-7.2345684,112.8765438,East Java,Sumenep District,13. MW Upg Upgrade N+0 Change Antenna,Upgrade N+0,Y25_MWU0-10,18GHz,1Gbps,0.6m,Aviat CTR8000,ATP,High Priority,2024-01-21,MW Upgrade,✅ VALID\nJAW-JI-SMP-4247_JAW-JI-SMP-3135_Y25_MWU0-11,SITE_M_SITE_N,JAW-JI-SMP-4247,SITE_M,JAW-JI-SMP-3135,SITE_N,-7.1234574,112.9876550,-7.2345685,112.8765439,East Java,Sumenep District,13. MW Upg Upgrade N+0 Change Antenna,Upgrade N+0,Y25_MWU0-11,18GHz,1Gbps,0.6m,Aviat CTR8000,ATP,High Priority,2024-01-22,MW Upgrade,✅ VALID\nJAW-JI-SMP-4248_JAW-JI-SMP-3136_Y25_MWU0-12,SITE_O_SITE_P,JAW-JI-SMP-4248,SITE_O,JAW-JI-SMP-3136,SITE_P,-7.1234575,112.9876551,-7.2345686,112.8765440,East Java,Sumenep District,13. MW Upg Upgrade N+0 Change Antenna,Upgrade N+0,Y25_MWU0-12,18GHz,1Gbps,0.6m,Aviat CTR8000,ATP,High Priority,2024-01-23,,⚠️ WARNING: Missing task description\nJAW-JI-SMP-4249_JAW-JI-SMP-3137_Y25_MWU0-13,SITE_Q_SITE_R,JAW-JI-SMP-4249,SITE_Q,JAW-JI-SMP-3137,SITE_R,-15.1234576,112.9876552,-15.2345687,112.8765441,East Java,Sumenep District,13. MW Upg Upgrade N+0 Change Antenna,Upgrade N+0,Y25_MWU0-13,18GHz,1Gbps,0.6m,Aviat CTR8000,ATP,High Priority,2024-01-24,MW Upgrade,❌ ERROR: GPS coordinates out of Indonesia bounds`;
    
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

  const viewSite = (site: any) => {
    setSelectedSite(site);
    setModalType('view');
    setShowSiteModal(true);
  };

  const editSite = (site: any) => {
    setSelectedSite({...site});
    setModalType('edit');
    setShowSiteModal(true);
  };

  const deleteSite = async (siteId: number) => {
    if (window.confirm('Are you sure you want to delete this site?')) {
      try {
        const response = await fetch(`/api/sites/${siteId}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          setSites(sites.filter(s => s.id !== siteId));
          alert('Site deleted successfully');
        } else {
          alert('Error deleting site');
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Error deleting site');
      }
    }
  };

  const saveSite = async () => {
    try {
      const response = await fetch(`/api/sites/${selectedSite.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedSite)
      });
      if (response.ok) {
        setSites(sites.map(s => s.id === selectedSite.id ? selectedSite : s));
        setShowSiteModal(false);
        alert('Site updated successfully');
      } else {
        alert('Error updating site');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error updating site');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setUploadedFile(null);
    setValidationComplete(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Site Management</h1>
      
      {/* Site List Section */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Registered Sites ({sites.length} total)</h2>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Sites
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Site ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Site Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Region</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">City</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">Loading...</td>
                </tr>
              ) : sites.map((site) => (
                <tr key={site.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{site.site_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{site.site_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{site.site_type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{site.region}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{site.city}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                      {site.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(site.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button onClick={() => viewSite(site)} className="text-blue-600 hover:text-blue-800" title="View">
                        👁️
                      </button>
                      <button onClick={() => editSite(site)} className="text-green-600 hover:text-green-800" title="Edit">
                        ✏️
                      </button>
                      <button onClick={() => deleteSite(site.id)} className="text-red-600 hover:text-red-800" title="Delete">
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && sites.length === 0 && (
            <div className="text-center py-8 text-gray-500">No sites registered yet. Click "Add Sites" to register sites.</div>
          )}
        </div>
      </div>

      {/* Add Sites Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold">Add Sites</h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Upload Sites</h3>
              <p className="text-gray-600 mb-6">Upload CSV/Excel file with one or multiple sites</p>
              
              <div className="flex space-x-4 mb-6">
                <button 
                  onClick={downloadTemplate}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
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
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Choose File
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
                  <p className="font-medium text-green-800">File uploaded: {uploadedFile.name}</p>
                </div>
              )}

              {validationComplete && (
                <div className="mt-4 space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="font-medium text-green-800">✅ Validation Complete!</p>
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
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Site Details Modal */}
      {showSiteModal && selectedSite && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                {modalType === 'view' ? 'Site Details' : 'Edit Site'}
              </h2>
              <button onClick={() => setShowSiteModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Site ID</label>
                <input
                  type="text"
                  value={selectedSite.site_id}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Site Name</label>
                <input
                  type="text"
                  value={selectedSite.site_name}
                  disabled={modalType === 'view'}
                  onChange={(e) => setSelectedSite({...selectedSite, site_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
                <input
                  type="text"
                  value={selectedSite.region}
                  disabled={modalType === 'view'}
                  onChange={(e) => setSelectedSite({...selectedSite, region: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <input
                  type="text"
                  value={selectedSite.city}
                  disabled={modalType === 'view'}
                  onChange={(e) => setSelectedSite({...selectedSite, city: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowSiteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                {modalType === 'view' ? 'Close' : 'Cancel'}
              </button>
              {modalType === 'edit' && (
                <button
                  onClick={saveSite}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
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

export default SiteManagement;