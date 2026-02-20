import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
  Home,
  Briefcase,
  FolderOpen,
  Users,
  BarChart3,
  Settings,
  MessageSquare,
  User,
  Bell,
  ChevronDown,
  Menu,
  X,
  Store,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from '@/lib/utils';

export default function ModernNavigation({ children }) {
  const { page } = usePage();
  const { auth } = page.props;
  const user = auth?.user;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Debug: Log user avatar data
  console.log('🔍 ModernNavigation Debug - User:', {
    id: user?.id,
    name: user?.name,
    avatar: user?.avatar,
    avatar_url: user?.avatar_url,
    usage_type: user?.usage_type
  });

  const isMarketplace = window.location.pathname.startsWith('/marketplace');
  const isWorkspace = !isMarketplace;

  // Simplified primary navigation
  const primaryNav = [
    {
      name: 'Marketplace',
      href: '/marketplace',
      icon: Store,
      active: isMarketplace && window.location.pathname === '/marketplace',
      show: true
    },
    {
      name: 'Messages',
      href: '/marketplace/chats',
      icon: MessageSquare,
      active: window.location.pathname.startsWith('/marketplace/chats'),
      show: true,
      badge: unread_message_count
    },
    {
      name: 'Workspaces',
      href: '/workspaces/select',
      icon: Briefcase,
      active: window.location.pathname.startsWith('/workspaces'),
      show: true
    },
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      active: window.location.pathname === '/dashboard',
      show: isWorkspace
    },
    {
      name: 'Projects',
      href: '/projects',
      icon: FolderOpen,
      active: window.location.pathname.startsWith('/projects'),
      show: isWorkspace && currentWorkspace
    },
  ];

  // Secondary navigation (in dropdown)
  const secondaryNav = [
    {
      name: 'Team',
      href: '/team',
      icon: Users,
      show: isWorkspace && currentWorkspace
    },
    {
      name: 'Clients',
      href: '/clients',
      icon: Briefcase,
      show: isWorkspace && currentWorkspace
    },
    {
      name: 'Settings',
      href: isWorkspace ? '/workspaces/current/settings' : '/marketplace/profile',
      icon: Settings,
      show: true
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Top Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Left: Logo + Primary Nav */}
            <div className="flex items-center gap-8">
              {/* Logo */}
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="h-9 w-9 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <Store className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent hidden sm:block">
                  CollabTool
                </span>
              </Link>

              {/* Primary Navigation - Desktop */}
              <div className="hidden lg:flex items-center gap-1">
                {primaryNav.filter(item => item.show).map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                        item.active
                          ? "bg-indigo-100 text-indigo-700"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.name}
                      {item.badge && item.badge > 0 && (
                        <span className="ml-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                          {item.badge > 99 ? '99+' : item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">

              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative p-2">
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                  3
                </span>
              </Button>

              {/* More Menu (Secondary Nav + Profile) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2 p-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatar_url} />
                      <AvatarFallback className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-56">
                  {/* User Info */}
                  <DropdownMenuLabel className="flex flex-col items-start">
                    <div className="text-sm font-medium text-gray-900">{user?.name}</div>
                    <div className="text-xs text-gray-500">{user?.email}</div>
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {user?.usage_type?.replace('_', ' ') || 'User'}
                    </Badge>
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator />

                  {/* Secondary Navigation */}
                  {secondaryNav.filter(item => item.show).map((item) => {
                    const Icon = item.icon;
                    return (
                      <DropdownMenuItem key={item.name} asChild>
                        <Link href={item.href} className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {item.name}
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}

                  <DropdownMenuSeparator />

                  {/* Profile & Account */}
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      My Profile
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  {/* Logout */}
                  <DropdownMenuItem className="flex items-center gap-2 text-red-600">
                    <LogOut className="h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden p-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-3 space-y-1">
              {primaryNav.filter(item => item.show).map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                      item.active
                        ? "bg-indigo-100 text-indigo-700"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                    {item.badge && item.badge > 0 && (
                      <span className="ml-auto h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}

              <div className="border-t border-gray-200 my-2 pt-2">
                {secondaryNav.filter(item => item.show).map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
