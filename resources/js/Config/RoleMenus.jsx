// Permission-driven menu configurations
export const roleMenus = {
  all: [
    {
      id: 'dashboard',
      label: 'Dashboard',
      href: '/dashboard',
      icon: 'LayoutDashboard',
      permission: null,
    },
    {
      id: 'projects',
      label: 'Projects',
      href: '/projects',
      icon: 'Folder',
      permission: 'view_projects',
      subItems: [
        { label: 'All Projects', href: '/projects', permission: 'view_projects' },
        { label: 'Create Project', href: '/projects/create', permission: 'create_projects' },
      ],
    },
    {
      id: 'my-work',
      label: 'My Work',
      href: '/my-work',
      icon: 'Briefcase',
      permission: 'view_tasks',
      subItems: [
        { label: 'Tasks', href: '/tasks', permission: 'view_tasks' },
        { label: 'Activity', href: '/activity', permission: 'view_tasks' },
      ],
    },
    {
      id: 'team',
      label: 'Team',
      href: '/team',
      icon: 'Users',
      permission: 'view_users',
      subItems: [
        { label: 'Members', href: '/team/members', permission: 'view_users' },
        { label: 'Invitations', href: '/team/invitations', permission: 'manage_users' },
      ],
    },
    {
      id: 'settings',
      label: 'Settings',
      href: '/workspaces/current/settings',
      icon: 'Settings',
      permission: 'manage_settings',
    },
    {
      id: 'update-workspace',
      label: 'Update Workspace',
      href: '/onboarding',
      icon: 'Building',
      permission: 'manage_settings',
    },
  ],
};

export const getMenuItemsByPermissions = (hasPermission) => {
  const items = roleMenus.all || [];

  return items
    .filter((item) => !item.permission || hasPermission(item.permission))
    .map((item) => {
      if (!item.subItems) return item;

      const subItems = item.subItems.filter(
        (subItem) => !subItem.permission || hasPermission(subItem.permission)
      );

      return {
        ...item,
        subItems,
      };
    })
    .filter((item) => {
      if (!item.subItems) return true;
      return item.subItems.length > 0;
    });
};

export default roleMenus;
