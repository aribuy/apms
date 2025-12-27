import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('admin@apms.com');
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
            <div className="space-y-2 text-xs text-gray-600">
              <div><strong>Admin:</strong> admin@aviat.com / Admin123!</div>
              <div><strong>Document Control:</strong> doc.control@aviat.com / test123</div>
              <div><strong>Business Ops:</strong> business.ops@xlsmart.co.id / test123</div>
              <div><strong>SME Team:</strong> sme.team@xlsmart.co.id / test123</div>
              <div><strong>NOC Head:</strong> noc.head@xlsmart.co.id / test123</div>
              <div><strong>FOP RTS:</strong> fop.rts@xlsmart.co.id / test123</div>
              <div><strong>Region Team:</strong> region.team@xlsmart.co.id / test123</div>
              <div><strong>RTH Head:</strong> rth.head@xlsmart.co.id / test123</div>
              <div><strong>ZTE Vendor:</strong> vendor.zte@gmail.com / test123</div>
              <div><strong>HTI Vendor:</strong> vendor.hti@gmail.com / test123</div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
