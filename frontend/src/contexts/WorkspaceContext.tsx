import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient } from '../utils/apiClient';
import { useAuth } from './AuthContext';

interface Workspace {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
}

interface WorkspaceMembership {
  id: string;
  workspaceId: string;
  role: string;
  isDefault: boolean;
  workspace: Workspace;
}

interface ConfigVersion {
  id: string;
  workspaceId: string;
  versionNumber: number;
  status: 'DRAFT' | 'ACTIVE' | 'SUPERSEDED';
  sourceType: string;
  createdAt: string;
}

interface WorkspaceContextType {
  currentWorkspace: Workspace | null;
  userWorkspaces: WorkspaceMembership[];
  activeConfigs: ConfigVersion[];
  userRole: string;
  isLoading: boolean;
  error: string | null;
  switchWorkspace: (workspaceId: string) => Promise<void>;
  refreshContext: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};

interface WorkspaceProviderProps {
  children: React.ReactNode;
}

export const WorkspaceProvider: React.FC<WorkspaceProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [userWorkspaces, setUserWorkspaces] = useState<WorkspaceMembership[]>([]);
  const [activeConfigs, setActiveConfigs] = useState<ConfigVersion[]>([]);
  const [userRole, setUserRole] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkspaceContext = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem('apms_token');

      if (!token) {
        setCurrentWorkspace(null);
        setUserWorkspaces([]);
        setActiveConfigs([]);
        setIsLoading(false);
        return;
      }

      // For hardcoded auth (test-token), pass userId from localStorage
      let url = '/api/v1/user/context';
      const userId = localStorage.getItem('apms_user_id');
      if (token.startsWith('test-token') && userId) {
        url = `/api/v1/user/context?userId=${userId}`;
      }

      const response = await apiClient.get(url);

      if (response.data && response.data.data) {
        const { currentWorkspace: workspace, userWorkspaces: workspaces, activeConfigs: configs, userRole: role } = response.data.data;

        setCurrentWorkspace(workspace || null);
        setUserWorkspaces(workspaces || []);
        setActiveConfigs(configs || []);
        setUserRole(role || '');

        // Store current workspace in localStorage for persistence
        if (workspace) {
          localStorage.setItem('apms_current_workspace', JSON.stringify(workspace));
          localStorage.setItem('apms_user_role', role || '');
        }
      } else {
        // Fallback: try to load from localStorage
        const savedWorkspace = localStorage.getItem('apms_current_workspace');
        const savedRole = localStorage.getItem('apms_user_role');

        if (savedWorkspace) {
          setCurrentWorkspace(JSON.parse(savedWorkspace));
        }
        if (savedRole) {
          setUserRole(savedRole);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch workspace context:', err);

      if (err.response?.status === 404) {
        setCurrentWorkspace(null);
        setUserWorkspaces([]);
        setActiveConfigs([]);
        setUserRole('');
        localStorage.removeItem('apms_current_workspace');
        localStorage.removeItem('apms_user_role');
        return;
      }

      setError('Failed to load workspace context');

      // Fallback to localStorage for transient errors
      const savedWorkspace = localStorage.getItem('apms_current_workspace');
      const savedRole = localStorage.getItem('apms_user_role');

      if (savedWorkspace) {
        try {
          setCurrentWorkspace(JSON.parse(savedWorkspace));
        } catch (e) {
          console.error('Failed to parse saved workspace:', e);
        }
      }
      if (savedRole) {
        setUserRole(savedRole);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const switchWorkspace = useCallback(async (workspaceId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Find the workspace in user's memberships
      const targetMembership = userWorkspaces.find(
        (membership) => membership.workspaceId === workspaceId
      );

      if (!targetMembership) {
        throw new Error('Workspace not found in your memberships');
      }

      // Update local state immediately
      setCurrentWorkspace(targetMembership.workspace);
      setUserRole(targetMembership.role);

      // Store in localStorage
      localStorage.setItem('apms_current_workspace', JSON.stringify(targetMembership.workspace));
      localStorage.setItem('apms_user_role', targetMembership.role);

      // Optional: Call API to update default workspace
      try {
        await apiClient.put(`/api/v1/workspaces/${workspaceId}/default`);
      } catch (err) {
        console.warn('Failed to update default workspace on server:', err);
        // Don't fail the switch if API call fails
      }

      // Refresh context to get new active configs
      await fetchWorkspaceContext();
    } catch (err: any) {
      console.error('Failed to switch workspace:', err);
      setError(err.message || 'Failed to switch workspace');
      setIsLoading(false);
      throw err;
    }
  }, [userWorkspaces, fetchWorkspaceContext]);

  const refreshContext = useCallback(async () => {
    await fetchWorkspaceContext();
  }, [fetchWorkspaceContext]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchWorkspaceContext();
      return;
    }

    setCurrentWorkspace(null);
    setUserWorkspaces([]);
    setActiveConfigs([]);
    setUserRole('');
  }, [isAuthenticated, fetchWorkspaceContext]);

  const value: WorkspaceContextType = {
    currentWorkspace,
    userWorkspaces,
    activeConfigs,
    userRole,
    isLoading,
    error,
    switchWorkspace,
    refreshContext
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
};
