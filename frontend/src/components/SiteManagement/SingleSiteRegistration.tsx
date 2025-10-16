import React, { useState, useEffect } from 'react';

interface FormData {
  siteId: string;
  siteName: string;
  siteType: string;
  region: string;
  province: string;
  city: string;
  district: string;
  address: string;
  latitude: string;
  longitude: string;
  altitude: string;
  towerHeight: string;
  powerType: string;
  backupPower: string;
  fiberConnection: string;
  microwaveConnection: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  status: string;
}

interface Props {
  onSuccess: () => void;
}

const SingleSiteRegistration: React.FC<Props> = ({ onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    siteId: '',
    siteName: '',
    siteType: 'BTS',
    region: '',
    province: '',
    city: '',
    district: '',
    address: '',
    latitude: '',
    longitude: '',
    altitude: '',
    towerHeight: '',
    powerType: 'PLN',
    backupPower: 'Genset',
    fiberConnection: 'Yes',
    microwaveConnection: 'No',
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    status: 'PLANNING'
  });
  
  const [siteIdAvailable, setSiteIdAvailable] = useState<boolean | null>(null);
  const [siteIdSuggestions, setSiteIdSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const checkSiteIdAvailability = async (siteId: string) => {
    if (!siteId) {
      setSiteIdAvailable(null);
      return;
    }
    
    try {
      const response = await fetch(`/api/sites/check-siteid/${siteId}`);
      const data = await response.json();
      setSiteIdAvailable(data.available);
    } catch (error) {
      console.error('Error checking Site ID:', error);
    }
  };

  const getSiteIdSuggestions = async () => {
    if (!formData.region || !formData.city) return;
    
    try {
      const response = await fetch(`/api/sites/suggest-siteid?region=${formData.region}&city=${formData.city}`);
      const data = await response.json();
      setSiteIdSuggestions(data.suggestions);
    } catch (error) {
      console.error('Error getting suggestions:', error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      checkSiteIdAvailability(formData.siteId);
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.siteId]);

  useEffect(() => {
    getSiteIdSuggestions();
  }, [formData.region, formData.city]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.siteId) newErrors.siteId = 'Site ID is required';
      else if (siteIdAvailable === false) newErrors.siteId = 'Site ID already exists';
      if (!formData.siteName) newErrors.siteName = 'Site Name is required';
      if (!formData.siteType) newErrors.siteType = 'Site Type is required';
    }

    if (step === 2) {
      if (!formData.region) newErrors.region = 'Region is required';
      if (!formData.province) newErrors.province = 'Province is required';
      if (!formData.city) newErrors.city = 'City is required';
      if (!formData.address) newErrors.address = 'Address is required';
    }

    if (step === 3) {
      if (!formData.latitude) newErrors.latitude = 'Latitude is required';
      else if (isNaN(parseFloat(formData.latitude))) newErrors.latitude = 'Invalid latitude format';
      if (!formData.longitude) newErrors.longitude = 'Longitude is required';
      else if (isNaN(parseFloat(formData.longitude))) newErrors.longitude = 'Invalid longitude format';
    }

    if (step === 4) {
      if (!formData.contactPerson) newErrors.contactPerson = 'Contact Person is required';
      if (!formData.contactPhone) newErrors.contactPhone = 'Contact Phone is required';
      if (!formData.contactEmail) newErrors.contactEmail = 'Contact Email is required';
      else if (!/\S+@\S+\.\S+/.test(formData.contactEmail)) newErrors.contactEmail = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    setLoading(true);
    try {
      const response = await fetch('/api/sites/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        alert('Site registered successfully!');
        onSuccess();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert('Error registering site');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Site ID *</label>
              <input
                type="text"
                value={formData.siteId}
                onChange={(e) => handleInputChange('siteId', e.target.value.toUpperCase())}
                className={`w-full px-3 py-2 border rounded-md ${errors.siteId ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="e.g., JKT001"
              />
              {siteIdAvailable === false && (
                <p className="text-red-500 text-sm mt-1">Site ID already exists</p>
              )}
              {siteIdAvailable === true && (
                <p className="text-green-500 text-sm mt-1">Site ID available</p>
              )}
              {errors.siteId && <p className="text-red-500 text-sm mt-1">{errors.siteId}</p>}
              
              {siteIdSuggestions.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600">Suggestions:</p>
                  <div className="flex gap-2 mt-1">
                    {siteIdSuggestions.map(suggestion => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => handleInputChange('siteId', suggestion)}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Site Name *</label>
              <input
                type="text"
                value={formData.siteName}
                onChange={(e) => handleInputChange('siteName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md ${errors.siteName ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.siteName && <p className="text-red-500 text-sm mt-1">{errors.siteName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Site Type *</label>
              <select
                value={formData.siteType}
                onChange={(e) => handleInputChange('siteType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="BTS">BTS</option>
                <option value="NodeB">NodeB</option>
                <option value="eNodeB">eNodeB</option>
                <option value="gNodeB">gNodeB</option>
                <option value="Repeater">Repeater</option>
              </select>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Location Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Region *</label>
                <input
                  type="text"
                  value={formData.region}
                  onChange={(e) => handleInputChange('region', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md ${errors.region ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.region && <p className="text-red-500 text-sm mt-1">{errors.region}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Province *</label>
                <input
                  type="text"
                  value={formData.province}
                  onChange={(e) => handleInputChange('province', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md ${errors.province ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.province && <p className="text-red-500 text-sm mt-1">{errors.province}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md ${errors.city ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) => handleInputChange('district', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
              <textarea
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
                rows={3}
              />
              {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Technical Specifications</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Latitude *</label>
                <input
                  type="text"
                  value={formData.latitude}
                  onChange={(e) => handleInputChange('latitude', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md ${errors.latitude ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="-6.200000"
                />
                {errors.latitude && <p className="text-red-500 text-sm mt-1">{errors.latitude}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Longitude *</label>
                <input
                  type="text"
                  value={formData.longitude}
                  onChange={(e) => handleInputChange('longitude', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md ${errors.longitude ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="106.816666"
                />
                {errors.longitude && <p className="text-red-500 text-sm mt-1">{errors.longitude}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Altitude (m)</label>
                <input
                  type="number"
                  value={formData.altitude}
                  onChange={(e) => handleInputChange('altitude', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tower Height (m)</label>
                <input
                  type="number"
                  value={formData.towerHeight}
                  onChange={(e) => handleInputChange('towerHeight', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Power Type *</label>
                <select
                  value={formData.powerType}
                  onChange={(e) => handleInputChange('powerType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="PLN">PLN</option>
                  <option value="Solar">Solar</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Backup Power *</label>
                <select
                  value={formData.backupPower}
                  onChange={(e) => handleInputChange('backupPower', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="Genset">Genset</option>
                  <option value="Battery">Battery</option>
                  <option value="UPS">UPS</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fiber Connection *</label>
                <select
                  value={formData.fiberConnection}
                  onChange={(e) => handleInputChange('fiberConnection', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Microwave Connection *</label>
                <select
                  value={formData.microwaveConnection}
                  onChange={(e) => handleInputChange('microwaveConnection', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person *</label>
              <input
                type="text"
                value={formData.contactPerson}
                onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md ${errors.contactPerson ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.contactPerson && <p className="text-red-500 text-sm mt-1">{errors.contactPerson}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone *</label>
              <input
                type="text"
                value={formData.contactPhone}
                onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md ${errors.contactPhone ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.contactPhone && <p className="text-red-500 text-sm mt-1">{errors.contactPhone}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email *</label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md ${errors.contactEmail ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.contactEmail && <p className="text-red-500 text-sm mt-1">{errors.contactEmail}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="PLANNING">Planning</option>
                <option value="CONSTRUCTION">Construction</option>
                <option value="ACTIVE">Active</option>
                <option value="MAINTENANCE">Maintenance</option>
              </select>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center">
          {[1, 2, 3, 4].map((step) => (
            <React.Fragment key={step}>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                {step}
              </div>
              {step < 4 && (
                <div className={`flex-1 h-1 mx-2 ${
                  step < currentStep ? 'bg-blue-600' : 'bg-gray-300'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-sm text-gray-600">
          <span>Basic Info</span>
          <span>Location</span>
          <span>Technical</span>
          <span>Contact</span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border">
        {renderStep()}
        
        <div className="flex justify-between mt-8">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          
          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Registering...' : 'Register Site'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SingleSiteRegistration;