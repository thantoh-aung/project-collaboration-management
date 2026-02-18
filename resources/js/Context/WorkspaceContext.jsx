import React, { createContext, useContext, useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { ThemeProvider } from './ThemeContext';

const WorkspaceContext = createContext();

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};

export const WorkspaceProvider = ({ children, pageProps = null }) => {
  // Bootstrap from server-rendered props for instant rendering
  const initialAuth = pageProps?.auth || {};

  const [currentWorkspace, setCurrentWorkspace] = useState(initialAuth.current_workspace || null);
  const [userRole, setUserRole] = useState(initialAuth.user_role || null);
  const [workspaces, setWorkspaces] = useState(initialAuth.workspaces || []);
  const [loading, setLoading] = useState(false); // No initial loading state

  const getPermissionsForRole = (role) => {
    const permissions = {
      admin: [
        'view_projects', 'create_projects', 'edit_projects', 'delete_projects',
        'view_users', 'manage_users', 'view_clients', 'manage_clients',
        'manage_settings',
        'view_tasks', 'create_tasks', 'edit_tasks', 'delete_tasks',
      ],
      member: [
        'view_projects', 'view_tasks', 'create_tasks', 'edit_tasks',
        'view_time_logs', 'create_time_logs',
        'view_users',
      ],
      client: [
        'view_projects',
        'view_tasks', 'view_users',
      ],
    };
    return permissions[role] || [];
  };

  // Sync with Inertia navigation updates
  useEffect(() => {
    if (typeof router?.on !== 'function') return;

    const unbind = router.on('success', (event) => {
      const auth = event?.detail?.page?.props?.auth;
      if (!auth) return;

      if (auth.current_workspace) {
        setCurrentWorkspace(auth.current_workspace);
        setUserRole(auth.user_role);
      }

      if (auth.workspaces) {
        setWorkspaces(auth.workspaces);
      }
    });

    return () => {
      try {
        unbind?.();
      } catch {
        // ignore
      }
    };
  }, []);

  const refreshWorkspaces = async () => {
    setLoading(true);
    try {
      const response = await fetch('/me/workspaces', {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        }
      });

      if (response.ok) {
        const data = await response.json();
        setWorkspaces(data.workspaces);

        if (data.current_workspace_id) {
          const workspace = data.workspaces.find(w => w.id === data.current_workspace_id);
          if (workspace) {
            setCurrentWorkspace(workspace);
            setUserRole(workspace.user_role);
          }
        }
      }
    } catch (error) {
      console.error('Failed to refresh workspaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const switchWorkspace = async (workspaceId) => {
    // Optimistic update for instant UI feedback
    const selected = workspaces.find((w) => String(w.id) === String(workspaceId));
    if (selected) {
      setCurrentWorkspace(selected);
      setUserRole(selected.user_role);
    }

    return new Promise((resolve, reject) => {
      router.post(`/workspaces/switch/${workspaceId}`, {}, {
        preserveScroll: true,
        onSuccess: () => {
          resolve(true);
        },
        onError: () => {
          // Revert on error
          const auth = pageProps?.auth;
          if (auth?.current_workspace) {
            setCurrentWorkspace(auth.current_workspace);
            setUserRole(auth.user_role);
          }
          reject(new Error('Failed to switch workspace'));
        },
      });
    });
  };

  const hasPermission = (permission) => {
    if (!userRole) return false;
    const rolePermissions = getPermissionsForRole(userRole);
    return rolePermissions.includes(permission);
  };

  const value = {
    currentWorkspace,
    userRole,
    workspaces,
    loading,
    switchWorkspace,
    refreshWorkspaces,
    activeWorkspaceId: currentWorkspace?.id,
    hasWorkspace: !!currentWorkspace,
    hasPermission,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </WorkspaceContext.Provider>
  );
};
