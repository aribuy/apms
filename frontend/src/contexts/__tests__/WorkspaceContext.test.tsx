import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { WorkspaceProvider, useWorkspace } from '../WorkspaceContext';
import { apiClient } from '../../utils/apiClient';

jest.mock('../../utils/apiClient', () => ({
  apiClient: {
    get: jest.fn(),
    put: jest.fn()
  }
}));

jest.mock('../AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: true })
}));

const TestConsumer: React.FC = () => {
  const { currentWorkspace, userRole, userWorkspaces, isLoading, switchWorkspace } = useWorkspace();
  return (
    <div>
      <div data-testid="workspace-name">{currentWorkspace?.name || 'none'}</div>
      <div data-testid="role">{userRole || 'none'}</div>
      <div data-testid="workspaces-count">{userWorkspaces.length}</div>
      <div data-testid="loading">{isLoading ? 'loading' : 'ready'}</div>
      <button type="button" onClick={() => switchWorkspace('w2')}>Switch</button>
    </div>
  );
};

const mockContextResponse = (override: Partial<any> = {}) => ({
  data: {
    data: {
      currentWorkspace: {
        id: 'w1',
        code: 'WS-1',
        name: 'Workspace One',
        isActive: true
      },
      userWorkspaces: [
        {
          id: 'm1',
          workspaceId: 'w1',
          role: 'ADMIN',
          isDefault: true,
          workspace: {
            id: 'w1',
            code: 'WS-1',
            name: 'Workspace One',
            isActive: true
          }
        },
        {
          id: 'm2',
          workspaceId: 'w2',
          role: 'MEMBER',
          isDefault: false,
          workspace: {
            id: 'w2',
            code: 'WS-2',
            name: 'Workspace Two',
            isActive: true
          }
        }
      ],
      activeConfigs: [],
      userRole: 'ADMIN',
      ...override
    }
  }
});

describe('WorkspaceContext', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    localStorage.setItem('apms_token', 'token');
  });

  it('loads workspace context on mount', async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce(mockContextResponse());

    render(
      <WorkspaceProvider>
        <TestConsumer />
      </WorkspaceProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('ready');
    });

    expect(screen.getByTestId('workspace-name')).toHaveTextContent('Workspace One');
    expect(screen.getByTestId('role')).toHaveTextContent('ADMIN');
    expect(screen.getByTestId('workspaces-count')).toHaveTextContent('2');
  });

  it('switches workspace and updates localStorage', async () => {
    (apiClient.get as jest.Mock)
      .mockResolvedValueOnce(mockContextResponse())
      .mockResolvedValueOnce(mockContextResponse({
        currentWorkspace: {
          id: 'w2',
          code: 'WS-2',
          name: 'Workspace Two',
          isActive: true
        },
        userRole: 'MEMBER'
      }));
    (apiClient.put as jest.Mock).mockResolvedValue({ data: { success: true } });

    render(
      <WorkspaceProvider>
        <TestConsumer />
      </WorkspaceProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('ready');
    });

    await act(async () => {
      screen.getByRole('button', { name: 'Switch' }).click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('workspace-name')).toHaveTextContent('Workspace Two');
    });

    expect(apiClient.put).toHaveBeenCalledWith('/api/v1/workspaces/w2/default');
    const storedWorkspace = JSON.parse(localStorage.getItem('apms_current_workspace') || '{}');
    expect(storedWorkspace.id).toBe('w2');
    expect(localStorage.getItem('apms_user_role')).toBe('MEMBER');
  });
});
