import React, { useEffect } from 'react';
import { render, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import { apiClient } from '../../utils/apiClient';

type AuthCapture = ReturnType<typeof useAuth>;

type CaptureProps = {
  onReady: (value: AuthCapture) => void;
};

const CaptureAuth: React.FC<CaptureProps> = ({ onReady }) => {
  const auth = useAuth();
  useEffect(() => {
    onReady(auth);
  }, [auth, onReady]);
  return null;
};

jest.mock('../../utils/apiClient', () => ({
  apiClient: {
    post: jest.fn()
  }
}));

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('hydrates user from localStorage', async () => {
    localStorage.setItem('apms_token', 'token');
    localStorage.setItem('apms_user', JSON.stringify({
      id: 'u1',
      email: 'user@apms.local',
      role: 'ADMIN',
      username: 'user'
    }));

    let auth: AuthCapture | null = null;
    render(
      <AuthProvider>
        <CaptureAuth onReady={(value) => {
          auth = value;
        }} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(auth?.isAuthenticated).toBe(true);
    });

    expect(auth?.user?.email).toBe('user@apms.local');
    expect(auth?.isLoading).toBe(false);
  });

  it('stores tokens and user on login', async () => {
    (apiClient.post as jest.Mock).mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          user: {
            id: 'u1',
            email: 'user@apms.local',
            role: 'ADMIN',
            username: 'user'
          },
          accessToken: 'access-token',
          refreshToken: 'refresh-token'
        }
      }
    });

    let auth: AuthCapture | null = null;
    render(
      <AuthProvider>
        <CaptureAuth onReady={(value) => {
          auth = value;
        }} />
      </AuthProvider>
    );

    await act(async () => {
      const result = await auth?.login('user@apms.local', 'password');
      expect(result?.success).toBe(true);
    });

    expect(localStorage.getItem('apms_token')).toBe('access-token');
    expect(localStorage.getItem('apms_refresh_token')).toBe('refresh-token');
    expect(JSON.parse(localStorage.getItem('apms_user') || '{}').email).toBe('user@apms.local');
  });

  it('clears storage and calls logout endpoint', async () => {
    localStorage.setItem('apms_token', 'access-token');
    localStorage.setItem('apms_user', JSON.stringify({ id: 'u1' }));
    localStorage.setItem('apms_user_id', 'u1');
    localStorage.setItem('apms_refresh_token', 'refresh-token');

    (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: { success: true } });

    let auth: AuthCapture | null = null;
    render(
      <AuthProvider>
        <CaptureAuth onReady={(value) => {
          auth = value;
        }} />
      </AuthProvider>
    );

    act(() => {
      auth?.logout();
    });

    expect(localStorage.getItem('apms_token')).toBeNull();
    expect(localStorage.getItem('apms_user')).toBeNull();
    expect(localStorage.getItem('apms_user_id')).toBeNull();
    expect(localStorage.getItem('apms_refresh_token')).toBeNull();
    expect(apiClient.post).toHaveBeenCalledWith('/api/v1/auth/logout', {
      refreshToken: 'refresh-token'
    });
  });
});
