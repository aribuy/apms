import React, { useState, useEffect } from 'react';
import { Radio, Settings, Antenna } from 'lucide-react';
import { apiClient } from '../../utils/apiClient';

interface Scope {
  id: number;
  name: string;
  description: string;
}

interface ScopeSelectorProps {
  value?: number;
  onChange: (scopeId: number, scopeName?: string) => void;
  required?: boolean;
  showDetails?: boolean;
}

const ScopeSelector: React.FC<ScopeSelectorProps> = ({ 
  value, 
  onChange, 
  required = false, 
  showDetails = false 
}) => {
  const [scopes, setScopes] = useState<Scope[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScopes();
  }, []);

  const fetchScopes = async () => {
    try {
      const response = await apiClient.get('/api/v1/scopes');
      if (response.data.success) {
        setScopes(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching scopes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScopeIcon = (scopeName: string) => {
    if (scopeName.includes('MW')) {
      return scopeName.includes('Upgrade') ? Settings : Radio;
    }
    return Antenna;
  };

  const getScopeCategory = (scopeName: string) => {
    if (scopeName === 'MW') return 'Hardware Installation';
    if (scopeName === 'MW Upgrade') return 'Software/License Upgrade';
    if (scopeName.includes('RAN')) return 'Radio Access Network';
    if (scopeName.includes('PLN')) return 'Power Line Network';
    return 'General ATP';
  };

  const handleScopeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const scopeId = Number(e.target.value);
    const selectedScope = scopes.find(s => s.id === scopeId);
    onChange(scopeId, selectedScope?.name);
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (showDetails) {
    return (
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          ATP Scope Type {required && <span className="text-red-500">*</span>}
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {scopes.map((scope) => {
            const Icon = getScopeIcon(scope.name);
            const isSelected = value === scope.id;
            const isMW = scope.name.includes('MW');
            
            return (
              <div
                key={scope.id}
                onClick={() => onChange(scope.id, scope.name)}
                className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  isSelected
                    ? isMW
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <Icon className={`w-6 h-6 mt-1 ${
                    isSelected
                      ? isMW ? 'text-blue-600' : 'text-green-600'
                      : 'text-gray-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-medium ${
                      isSelected ? 'text-gray-900' : 'text-gray-700'
                    }`}>
                      {scope.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {getScopeCategory(scope.name)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {scope.description}
                    </p>
                  </div>
                </div>
                
                {isMW && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center text-xs text-blue-600">
                      <Radio className="w-3 h-3 mr-1" />
                      <span>Microwave Specialized</span>
                    </div>
                  </div>
                )}
                
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <div className={`w-4 h-4 rounded-full ${
                      isMW ? 'bg-blue-500' : 'bg-green-500'
                    } flex items-center justify-center`}>
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <select
      value={value || ''}
      onChange={handleScopeChange}
      required={required}
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    >
      <option value="">Select Site Type</option>
      {scopes.map((scope) => (
        <option key={scope.id} value={scope.id}>
          {scope.name} - {getScopeCategory(scope.name)}
        </option>
      ))}
    </select>
  );
};

export default ScopeSelector;