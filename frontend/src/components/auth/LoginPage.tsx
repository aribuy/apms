import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface TestCredential {
  email: string;
  password: string;
}

const TEST_CREDENTIALS: Record<string, TestCredential> = {
  superAdmin: { email: 'superadmin@apms.com', password: 'test123' },
  admin: { email: 'admin@aviat.com', password: 'test123' },
  docControl: { email: 'doc.control@aviat.com', password: 'test123' },
  qaEngineer: { email: 'qa.engineer@aviat.com', password: 'test123' },
  businessOps: { email: 'bo@aviat.com', password: 'test123' },
  smeTeam: { email: 'sme@aviat.com', password: 'test123' },
  nocHead: { email: 'head.noc@aviat.com', password: 'test123' },
  picReviewer: { email: 'pic@aviat.com', password: 'test123' }
};

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const result = await login(email, password);

    if (!result.success) {
      setError(result.error || 'Login failed');
    }

    setIsLoading(false);
  };

  const handleAutoFill = (credentialKey: string) => {
    const cred = TEST_CREDENTIALS[credentialKey];
    if (cred) {
      setEmail(cred.email);
      setPassword(cred.password);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            APMS
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Advanced Project Management System
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Test Credentials:</h4>
            <div className="space-y-2">
              <CredentialRow
                label="Super Admin"
                email="superadmin@apms.com"
                onClick={() => handleAutoFill('superAdmin')}
                disabled={isLoading}
              />
              <CredentialRow
                label="Admin"
                email="admin@aviat.com"
                onClick={() => handleAutoFill('admin')}
                disabled={isLoading}
              />
              <CredentialRow
                label="Document Control"
                email="doc.control@aviat.com"
                onClick={() => handleAutoFill('docControl')}
                disabled={isLoading}
              />
              <CredentialRow
                label="QA Engineer"
                email="qa.engineer@aviat.com"
                onClick={() => handleAutoFill('qaEngineer')}
                disabled={isLoading}
              />
              <CredentialRow
                label="Business Ops"
                email="bo@aviat.com"
                onClick={() => handleAutoFill('businessOps')}
                disabled={isLoading}
              />
              <CredentialRow
                label="SME Team"
                email="sme@aviat.com"
                onClick={() => handleAutoFill('smeTeam')}
                disabled={isLoading}
              />
              <CredentialRow
                label="Head NOC"
                email="head.noc@aviat.com"
                onClick={() => handleAutoFill('nocHead')}
                disabled={isLoading}
              />
              <CredentialRow
                label="PIC"
                email="pic@aviat.com"
                onClick={() => handleAutoFill('picReviewer')}
                disabled={isLoading}
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

interface CredentialRowProps {
  label: string;
  email: string;
  onClick: () => void;
  disabled: boolean;
}

const CredentialRow: React.FC<CredentialRowProps> = ({ label, email, onClick, disabled }) => {
  return (
    <div className="flex items-center justify-between text-xs bg-white p-2 rounded border border-gray-200 hover:border-blue-300 transition-colors">
      <div className="flex-1">
        <span className="font-medium text-gray-700">{label}:</span>
        <span className="text-gray-600 ml-1">{email}</span>
      </div>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="ml-3 px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Login
      </button>
    </div>
  );
};
