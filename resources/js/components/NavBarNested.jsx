import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Folder,
  Briefcase,
  Building,
  Users,
  FileText,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  Crown
} from 'lucide-react';
import { useWorkspace } from '@/Context/WorkspaceContext';
import { getMenuItemsByPermissions } from '@/Config/RoleMenus';

const NavBarNested = () => {
  const { url } = usePage();
  const [expandedItems, setExpandedItems] = useState(['projects', 'my-work', 'team', 'settings']);
  
  // Get current workspace and user role from context
  const { currentWorkspace, userRole, hasPermission } = useWorkspace();
  
  // Get menu items based on permissions
  const menuItems = getMenuItemsByPermissions(hasPermission);

  const toggleExpanded = (itemId) => {
    setExpandedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const getIcon = (iconName) => {
    const icons = {
      LayoutDashboard,
      Folder,
      Briefcase,
      Building,
      Users,
      FileText,
      BarChart3,
      Settings,
    };
    return icons[iconName] || LayoutDashboard;
  };

  const isActive = (href) => {
    if (href === '/') return url === href;
    return url.startsWith(href);
  };

  if (!currentWorkspace) {
    return (
      <div className="flex flex-col w-64 bg-white border-r border-gray-200">
        <div className="p-4">
          <div className="text-sm text-gray-500">No workspace selected</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-64 bg-white border-r border-gray-200">
      {/* Workspace Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <Crown className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{currentWorkspace.name}</h3>
            <p className="text-xs text-gray-500 capitalize">Role: {userRole || 'null'}</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = getIcon(item.icon);
          const isExpanded = expandedItems.includes(item.id);
          const hasSubItems = item.subItems && item.subItems.length > 0;
          const active = isActive(item.href);

          return (
            <div key={item.id}>
              <div className="relative">
                <Link
                  href={item.href.replace('/workspaces/current', `/workspaces/${currentWorkspace.id}`)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors',
                    active
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                  onClick={() => hasSubItems && toggleExpanded(item.id)}
                >
                  <Icon className="h-4 w-4" />
                  <span className="flex-1">{item.label}</span>
                  {hasSubItems && (
                    <ChevronRight
                      className={cn(
                        'h-4 w-4 transition-transform',
                        isExpanded && 'rotate-90'
                      )}
                    />
                  )}
                </Link>
              </div>

              {/* Sub Items */}
              {hasSubItems && isExpanded && (
                <div className="ml-6 mt-1 space-y-1">
                  {item.subItems.map((subItem) => {
                    const subActive = isActive(subItem.href);
                    return (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors',
                          subActive
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-100'
                        )}
                      >
                        <div className="h-1.5 w-1.5 bg-gray-400 rounded-full" />
                        <span>{subItem.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
};

export default NavBarNested;
