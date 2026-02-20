import React, { useState, useEffect } from 'react';
import { Head, usePage, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import {
  Menu,
  Bell,
  Settings,
  User,
  Home,
  FolderOpen,
  CheckSquare,
  Users,
  FileText,
  BarChart3,
  Building,
  ChevronDown,
  Briefcase,
  Calendar,
  MessageSquare,
  Check,
  Store,
  X,
  Moon,
  Sun,
  Plus,
  TrendingUp,
  UserPlus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/Context/ThemeContext';
import NavBarNested from '@/Components/NavBarNested';
import UserButton from '@/Components/UserButton';
import Notifications from '@/Components/Notifications';
import FlashNotification from '@/Components/FlashNotification';
import AiChatbot from '@/Components/AiChatbot';
import { useWorkspace } from '@/Context/WorkspaceContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from '@/components/ui/input';

const MainLayoutContent = ({ title, children }) => {
  const { props } = usePage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { currentWorkspace, userRole, workspaces, switchWorkspace, loading, hasPermission } = useWorkspace();


  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);


  // Show loading state while workspace context is loading
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        {/* Animated Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-20"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-20"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-600 rounded-full mix-blend-multiply filter blur-xl opacity-20"></div>
        </div>
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg animate-pulse shadow-blue-600/30">
            <Building className="h-6 w-6 text-white" />
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-400 font-medium">Loading workspace...</p>
        </div>
      </div>
    );
  }

  // Redirect to workspace selection if no workspace
  if (!currentWorkspace) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        {/* Animated Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-20"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-20"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-600 rounded-full mix-blend-multiply filter blur-xl opacity-20"></div>
        </div>
        <div className="relative z-10 text-center bg-slate-800 rounded-2xl p-10 shadow-xl shadow-blue-600/20 border border-slate-700">
          <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg mb-6 shadow-blue-600/30">
            <Building className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">No Workspace Selected</h2>
          <p className="text-gray-400 mb-6">Please join or select a workspace to continue.</p>
          <Button onClick={() => window.location.href = '/workspaces/select'} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-600/30 hover:shadow-xl border-0">
            Select Workspace
          </Button>
        </div>
      </div>
    );
  }

  // Navigation items
  const allNavigationItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      current: window.location.pathname === '/dashboard',
      permission: null,
    },
    {
      title: 'Projects & Tasks',
      href: '/projects',
      icon: FolderOpen,
      current: window.location.pathname.startsWith('/projects'),
      permission: 'view_projects',
    },
    {
      title: 'Team',
      href: '/team',
      icon: Users,
      current: window.location.pathname.startsWith('/team'),
      permission: 'view_users',
    },
    {
      title: 'Clients',
      href: '/clients',
      icon: Briefcase,
      current: window.location.pathname.startsWith('/clients'),
      permission: 'view_clients',
    },
    {
      title: 'Settings',
      href: '/workspaces/current/settings',
      icon: Settings,
      current: window.location.pathname.includes('/settings'),
      permission: 'manage_settings',
    },
  ];

  const navigationItems = allNavigationItems.filter((item) =>
    item.permission ? hasPermission(item.permission) : true
  );

  const SidebarNavigation = () => (
    <nav className="flex-1 px-3 py-6 space-y-1 custom-scrollbar overflow-y-auto">
      <div className="space-y-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.title}
              href={item.href.replace('/workspaces/current', `/workspaces/${currentWorkspace?.id}`)}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-300",
                item.current
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-600/30"
                  : "text-gray-400 hover:bg-gradient-to-r hover:from-blue-900/30 hover:to-purple-900/30 hover:text-white"
              )}
            >
              <Icon className={cn(
                "h-5 w-5 flex-shrink-0 transition-colors duration-300",
                item.current
                  ? "text-white"
                  : "text-gray-500 group-hover:text-blue-400"
              )} />
              <span className="flex-1">{item.title}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );

  // ─── Dynamic Notification Bell ────────────────────────────
  const NotificationBell = () => {
    const [notifs, setNotifs] = React.useState([]);
    const [unread, setUnread] = React.useState(0);
    const [open, setOpen] = React.useState(false);

    const fetchNotifs = React.useCallback(async () => {
      try {
        const res = await fetch('/api/notifications', { headers: { 'Accept': 'application/json' } });
        if (res.ok) {
          const data = await res.json();
          setNotifs(data.notifications || []);
          setUnread(data.unread_count || 0);
        }
      } catch (e) { /* silent */ }
    }, []);

    React.useEffect(() => {
      fetchNotifs();
      const interval = setInterval(fetchNotifs, 30000); // poll every 30s
      return () => clearInterval(interval);
    }, [fetchNotifs]);

    const markRead = async (id) => {
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
      setUnread(prev => Math.max(0, prev - 1));
      try { await fetch(`/api/notifications/${id}/read`, { method: 'POST', headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content, 'Accept': 'application/json' } }); } catch (e) { }
    };

    const markAllRead = async () => {
      setNotifs(prev => prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
      setUnread(0);
      try { await fetch('/api/notifications/mark-all-read', { method: 'POST', headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content, 'Accept': 'application/json' } }); } catch (e) { }
    };

    const timeAgo = (ts) => {
      if (!ts) return '';
      const diff = Date.now() - new Date(ts).getTime();
      const m = Math.floor(diff / 60000);
      if (m < 1) return 'Just now';
      if (m < 60) return `${m}m ago`;
      const h = Math.floor(m / 60);
      if (h < 24) return `${h}h ago`;
      return `${Math.floor(h / 24)}d ago`;
    };

    return (
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-gradient-to-r from-red-500 to-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md shadow-red-500/40">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto bg-slate-800 border-slate-700 shadow-xl shadow-blue-600/20">
          <DropdownMenuLabel className="flex items-center justify-between text-white">
            <span>Notifications</span>
            {unread > 0 && (
              <button onClick={(e) => { e.stopPropagation(); markAllRead(); }} className="text-xs text-purple-600 hover:underline font-normal">
                Mark all read
              </button>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {notifs.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-400">
              <Bell className="h-6 w-6 mx-auto mb-2 opacity-40" />
              No notifications
            </div>
          ) : (
            notifs.slice(0, 8).map((n) => (
              <DropdownMenuItem
                key={n.id}
                className={cn("cursor-pointer", !n.read_at && "bg-blue-900/30")}
                onClick={() => {
                  if (!n.read_at) markRead(n.id);
                  const d = typeof n.data === 'string' ? JSON.parse(n.data) : (n.data || {});
                  if (d.project_id) window.location.href = `/projects/${d.project_id}/tasks`;
                }}
              >
                <div className="flex items-start gap-3 w-full">
                  <div className={cn("h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                    n.type === 'comment_added' ? 'bg-blue-600/20' : n.type === 'attachment_added' ? 'bg-emerald-600/20' : n.type === 'status_changed' ? 'bg-orange-600/20' : 'bg-purple-600/20'
                  )}>
                    {n.type === 'comment_added' ? <MessageSquare className="h-4 w-4 text-blue-400" /> :
                      n.type === 'status_changed' ? <CheckSquare className="h-4 w-4 text-orange-400" /> :
                        <CheckSquare className="h-4 w-4 text-purple-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{n.title}</p>
                    <p className="text-xs text-gray-500 truncate">{n.message}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.read_at && <div className="w-2 h-2 bg-purple-600 rounded-full mt-1.5 flex-shrink-0 shadow-sm shadow-purple-500/50" />}
                </div>
              </DropdownMenuItem>
            ))
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem className="justify-center">
            <a href="/notifications" className="text-sm text-purple-600 hover:underline">View all notifications</a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const TopBar = () => (
    <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-x-4 border-b border-slate-700 bg-slate-800/90 backdrop-blur-xl px-4 shadow-lg shadow-blue-600/20 sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Workspace Switcher */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2 h-9 px-3 border-slate-600 hover:border-blue-500 hover:bg-blue-900/30 transition-all duration-300 text-white">
            <div className="h-5 w-5 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded flex items-center justify-center">
              <Building className="h-3 w-3 text-white" />
            </div>
            <span className="font-semibold text-white">{currentWorkspace?.name || 'Select Workspace'}</span>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64 shadow-xl shadow-blue-600/20 border-slate-700 bg-slate-800">
          <DropdownMenuLabel className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Workspaces</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {workspaces.map((workspace) => (
            <DropdownMenuItem
              key={workspace.id}
              onClick={() => switchWorkspace(workspace.id)}
              className={cn(
                "flex items-center gap-3 cursor-pointer rounded-lg mx-1 transition-all duration-200",
                workspace.id === currentWorkspace?.id
                  ? "bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 shadow-sm"
                  : "hover:bg-gradient-to-r hover:from-blue-900/30 hover:to-purple-900/30 hover:border-blue-500/30"
              )}
            >
              <div className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200",
                workspace.id === currentWorkspace?.id
                  ? "bg-gradient-to-tr from-blue-600 to-purple-600 shadow-md"
                  : "bg-slate-700 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600"
              )}>
                <Building className={cn("h-4 w-4", workspace.id === currentWorkspace?.id ? "text-white" : "text-gray-400")} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate text-white">{workspace.name}</div>
                <div className="text-xs text-gray-400 capitalize">{workspace.user_role}</div>
              </div>
              {workspace.id === currentWorkspace?.id && (
                <Check className="h-4 w-4 text-blue-400 flex-shrink-0" />
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          {hasPermission('manage_settings') && (
            <DropdownMenuItem onClick={() => router.visit(route('invite.members'))} className="text-gray-300 hover:text-white hover:bg-slate-700">
              <UserPlus className="h-4 w-4 mr-2 text-blue-400" />
              Invite Team Member
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => window.location.href = '/workspaces/select'} className="text-gray-300 hover:text-white hover:bg-slate-700">
            <Plus className="h-4 w-4 mr-2 text-emerald-400" />
            Switch Workspace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>


      {/* Right side items */}
      <div className="flex items-center gap-x-4">
        {/* Marketplace Quick Access - Only for Clients and Freelancers */}
        {props.auth?.user?.usage_type !== 'team_member' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.href = '/marketplace'}
            className="flex items-center gap-2 h-9 px-3 border-slate-600 hover:border-blue-500 hover:bg-blue-900/30 transition-all duration-300 text-white"
          >
            <Store className="h-4 w-4" />
            <span className="hidden sm:inline">Marketplace</span>
          </Button>
        )}

        {/* Messages - Only for Clients and Freelancers */}
        {props.auth?.user?.usage_type !== 'team_member' && (
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = '/marketplace/chats'}
              className="flex items-center gap-2 h-9 px-3 border-slate-600 hover:border-blue-500 hover:bg-blue-900/30 transition-all duration-300 text-white"
            >
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Messages</span>
            </Button>
            {props.unread_message_count > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                {props.unread_message_count > 99 ? '99+' : props.unread_message_count}
              </span>
            )}
          </div>
        )}


        {/* Notifications — dynamic */}
        <NotificationBell />
      </div>
    </header>
  );
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-20"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-20"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-600 rounded-full mix-blend-multiply filter blur-xl opacity-20"></div>
      </div>
      <Head title={title} />

      {/* Flash Notifications */}
      <FlashNotification />

      {/* Toast Notifications */}
      <Notifications notifications={props.notifications || []} />

      <div className="flex h-screen">
        {/* Sidebar */}
        <aside className={cn(
          "hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:z-40 lg:bg-slate-800 lg:border-r lg:border-slate-700 lg:shadow-lg lg:shadow-blue-600/20",
          sidebarOpen && "lg:block"
        )}>
          {/* Sidebar Header */}
          <div className="flex h-16 shrink-0 items-center gap-x-4 px-6 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Building className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">CollabTool</h1>
                <p className="text-xs text-gray-400 truncate max-w-[140px]">{currentWorkspace?.name}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <SidebarNavigation />

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-slate-700 bg-gradient-to-r from-slate-700 to-blue-900/30">
            <div
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/80 transition-all duration-300 cursor-pointer"
              onClick={() => {
                // Route to correct profile based on user type
                if (props.auth?.user?.usage_type === 'team_member') {
                  window.location.href = '/profile'; // Team members go to workspace profile
                } else if (props.auth?.user?.usage_type === 'client') {
                  window.location.href = '/marketplace/client-profile';
                } else {
                  window.location.href = '/marketplace/profile';
                }
              }}
            >
              <Avatar className="h-9 w-9 ring-2 ring-blue-500/30 shadow-md">
                <AvatarImage src={props.auth?.user?.avatar_url ? `${props.auth?.user?.avatar_url}?t=${Date.now()}` : undefined} alt={props.auth?.user?.name} />
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-sm font-semibold">
                  {props.auth?.user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {props.auth?.user?.name}
                </p>
                <p className="text-xs text-blue-400 capitalize truncate font-medium">
                  {userRole || 'Member'}
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className={cn("flex flex-col flex-1 lg:pl-64")}>
          {/* Top Bar */}
          <TopBar />

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto bg-slate-900 custom-scrollbar">
            <div className="p-6 lg:p-8">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="fixed left-0 top-0 h-full w-64 bg-slate-800 shadow-2xl shadow-blue-600/20">
            <div className="flex h-16 shrink-0 items-center gap-x-4 px-6 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <Building className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">CollabTool</h1>
                  <p className="text-xs text-gray-400">{currentWorkspace?.name}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <SidebarNavigation />

            <div className="p-4 border-t border-slate-700 bg-gradient-to-r from-slate-700 to-blue-900/30">
              <div
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-700/80 transition-all duration-300 cursor-pointer"
                onClick={() => {
                  // Route to correct profile based on user type
                  if (props.auth?.user?.usage_type === 'team_member') {
                    window.location.href = '/profile'; // Team members go to workspace profile
                  } else if (props.auth?.user?.usage_type === 'client') {
                    window.location.href = '/marketplace/client-profile';
                  } else {
                    window.location.href = '/marketplace/profile';
                  }
                }}
              >
                <Avatar className="h-8 w-8 ring-2 ring-indigo-100">
                  <AvatarImage src={props.auth?.user?.avatar_url ? `${props.auth?.user?.avatar_url}?t=${Date.now()}` : undefined} alt={props.auth?.user?.name} />
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-semibold">
                    {props.auth?.user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {props.auth?.user?.name}
                  </p>
                  <p className="text-xs text-indigo-600 capitalize font-medium">
                    {userRole || 'Member'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Chatbot - Available on all pages */}
      <AiChatbot />
    </div>
  );
};

const MainLayout = ({ title, children }) => {
  return <MainLayoutContent title={title} children={children} />;
};

export default MainLayout;
