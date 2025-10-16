import React, { useState, useEffect } from 'react';
import { Radio, Antenna, Settings, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import DigitalFormBuilder from './DigitalFormBuilder';

interface MWATPFormProps {
  atpId: string;
  scopeType: 'MW' | 'MW_UPGRADE';
  onFormSubmit: (formData: any) => void;
  initialData?: any;
}

const MWATPForm: React.FC<MWATPFormProps> = ({
  atpId,
  scopeType,
  onFormSubmit,
  initialData
}) => {
  const [activeTab, setActiveTab] = useState('form');
  const [formProgress, setFormProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const tabs = [
    { id: 'form', label: 'ATP Form', icon: FileText },
    { id: 'checklist', label: 'Checklist', icon: CheckCircle },
    { id: 'validation', label: 'Validation', icon: AlertCircle }
  ];

  // MW-specific validation rules
  const validateMWForm = (formData: any) => {
    const errors: string[] = [];
    
    if (scopeType === 'MW') {
      // Validate MW installation requirements
      if (formData.rf_measurements) {
        const fadeMargin = parseFloat(formData.rf_measurements.fade_margin);
        if (fadeMargin < 20) {
          errors.push('Fade margin should be at least 20dB for reliable MW link');
        }
        
        const availability = parseFloat(formData.rf_measurements.availability);
        if (availability < 99.9) {
          errors.push('Link availability should be at least 99.9%');
        }
      }
      
      // Validate frequency coordination
      if (formData.site_a_config?.site_a_frequency && formData.site_b_config?.site_b_frequency) {
        const freqA = parseFloat(formData.site_a_config.site_a_frequency);
        const freqB = parseFloat(formData.site_b_config.site_b_frequency);
        if (Math.abs(freqA - freqB) < 100) {
          errors.push('TX/RX frequency separation should be at least 100MHz');
        }
      }
    } else if (scopeType === 'MW_UPGRADE') {
      // Validate MW upgrade requirements
      if (formData.upgrade_execution?.backup_completed !== 'Yes') {
        errors.push('Configuration backup must be completed before upgrade');
      }
      
      if (formData.post_upgrade_testing?.link_stability_test) {
        const testDuration = parseFloat(formData.post_upgrade_testing.link_stability_test);
        if (testDuration < 24) {
          errors.push('Link stability test should run for at least 24 hours');
        }
      }
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const calculateProgress = (formData: any) => {
    if (!formData) return 0;
    
    const sections = Object.keys(formData);
    const totalSections = scopeType === 'MW' ? 8 : 6; // Based on template sections
    
    let completedSections = 0;
    sections.forEach(sectionKey => {
      const section = formData[sectionKey];
      if (section && Object.keys(section).length > 0) {
        const hasRequiredFields = Object.values(section).some(value => 
          value !== '' && value !== null && value !== undefined
        );
        if (hasRequiredFields) completedSections++;
      }
    });
    
    return Math.round((completedSections / totalSections) * 100);
  };

  const handleFormSubmit = (formData: any) => {
    const progress = calculateProgress(formData);
    setFormProgress(progress);
    
    const isValid = validateMWForm(formData);
    if (isValid) {
      onFormSubmit({
        ...formData,
        mw_validation: {
          progress,
          validated_at: new Date().toISOString(),
          validation_passed: true
        }
      });
    }
  };

  const renderProgressBar = () => (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">Form Completion</span>
        <span className="text-sm text-gray-500">{formProgress}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${
            formProgress >= 80 ? 'bg-green-500' : 
            formProgress >= 50 ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          style={{ width: `${formProgress}%` }}
        />
      </div>
    </div>
  );

  const renderValidationPanel = () => (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <AlertCircle className="w-5 h-5 mr-2 text-orange-500" />
        MW ATP Validation
      </h3>
      
      {validationErrors.length > 0 ? (
        <div className="space-y-3">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <h4 className="font-medium text-red-800 mb-2">Validation Issues Found:</h4>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index} className="text-red-700 text-sm">{error}</li>
              ))}
            </ul>
          </div>
          <p className="text-sm text-gray-600">
            Please resolve these issues before submitting the ATP.
          </p>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            <span className="text-green-800 font-medium">All validations passed</span>
          </div>
          <p className="text-green-700 text-sm mt-1">
            MW ATP form meets all technical requirements.
          </p>
        </div>
      )}
      
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 p-4 rounded-md">
          <h4 className="font-medium text-blue-800 mb-2">MW Technical Standards</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Fade margin ≥ 20dB</li>
            <li>• Link availability ≥ 99.9%</li>
            <li>• Frequency separation ≥ 100MHz</li>
            <li>• BER ≤ 10^-6</li>
          </ul>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-md">
          <h4 className="font-medium text-purple-800 mb-2">XLSmart Requirements</h4>
          <ul className="text-sm text-purple-700 space-y-1">
            <li>• 24h stability test minimum</li>
            <li>• Configuration backup mandatory</li>
            <li>• Performance documentation</li>
            <li>• NMS integration verified</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const renderChecklistPanel = () => {
    const checklistItems = scopeType === 'MW' ? [
      {
        category: 'Pre-Installation',
        items: [
          'Site survey completed and documented',
          'Line of sight confirmed between sites',
          'Frequency coordination approved',
          'Equipment delivery verified'
        ]
      },
      {
        category: 'Installation',
        items: [
          'Antenna alignment within tolerance',
          'Waveguide installation completed',
          'Grounding system installed',
          'Power systems verified'
        ]
      },
      {
        category: 'Testing',
        items: [
          'RF measurements completed',
          'Performance testing passed',
          'Network integration verified',
          'Documentation completed'
        ]
      }
    ] : [
      {
        category: 'Pre-Upgrade',
        items: [
          'Configuration backup completed',
          'Upgrade plan approved',
          'Rollback procedure documented',
          'Maintenance window scheduled'
        ]
      },
      {
        category: 'Upgrade Execution',
        items: [
          'Software/license upgrade completed',
          'System reboot successful',
          'Basic connectivity restored',
          'No critical alarms present'
        ]
      },
      {
        category: 'Post-Upgrade',
        items: [
          'Performance improvement verified',
          'Stability test completed',
          'Documentation updated',
          'Operations team briefed'
        ]
      }
    ];

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
          {scopeType === 'MW' ? 'MW Installation' : 'MW Upgrade'} Checklist
        </h3>
        
        <div className="space-y-6">
          {checklistItems.map((category, categoryIndex) => (
            <div key={categoryIndex} className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-medium text-gray-800 mb-3">{category.category}</h4>
              <div className="space-y-2">
                {category.items.map((item, itemIndex) => (
                  <label key={itemIndex} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{item}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {scopeType === 'MW' ? (
              <Radio className="w-8 h-8 text-blue-600 mr-3" />
            ) : (
              <Settings className="w-8 h-8 text-purple-600 mr-3" />
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {scopeType === 'MW' ? 'MW Link Installation ATP' : 'MW Upgrade ATP'}
              </h1>
              <p className="text-gray-600">
                XLSmart {scopeType === 'MW' ? 'Microwave Link' : 'Microwave Upgrade'} Acceptance Test Procedure
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">ATP ID</div>
            <div className="font-mono text-lg">{atpId}</div>
          </div>
        </div>
        
        {renderProgressBar()}
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'form' && (
        <DigitalFormBuilder
          atpId={atpId}
          category={scopeType === 'MW' ? 'hardware' : 'software'}
          onFormSubmit={handleFormSubmit}
          initialData={initialData}
        />
      )}

      {activeTab === 'checklist' && renderChecklistPanel()}
      
      {activeTab === 'validation' && renderValidationPanel()}
    </div>
  );
};

export default MWATPForm;