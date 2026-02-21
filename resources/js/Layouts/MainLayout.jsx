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
import NavBarNested from '@/components/NavBarNested';
import UserButton from '@/components/UserButton';
import Notifications from '@/components/Notifications';
import FlashNotification from '@/components/FlashNotification';
import AiChatbot from '@/components/AiChatbot';
import { useWorkspace } from '@/Context/WorkspaceContext';
import { useProfile } from '@/Context/ProfileContext';
import ProfileDrawer from '@/components/Marketplace/ProfileDrawer';
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
  const { isOpen, userId, closeProfile } = useProfile();


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
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-[#4F46E5] rounded-xl flex items-center justify-center animate-pulse">
            <Building className="h-6 w-6 text-white" />
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4F46E5]"></div>
          <p className="text-sm text-[#64748B] font-medium">Loading workspace...</p>
        </div>
      </div>
    );
  }

  // Redirect to workspace selection if no workspace
  if (!currentWorkspace) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="relative z-10 text-center bg-white rounded-xl p-10 border border-[#E2E8F0] shadow-sm">
          <div className="mx-auto w-16 h-16 bg-[#4F46E5] rounded-2xl flex items-center justify-center mb-6">
            <Building className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-[#0F172A] mb-2">No Workspace Selected</h2>
          <p className="text-[#64748B] mb-6">Please join or select a workspace to continue.</p>
          <Button onClick={() => window.location.href = '/workspaces/select'} className="bg-[#4F46E5] text-white hover:bg-[#4338CA] border-0">
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
      <div className="space-y-0.5">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.title}
              href={item.href.replace('/workspaces/current', `/workspaces/${currentWorkspace?.id}`)}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150 relative",
                item.current
                  ? "bg-[rgba(79,70,229,0.08)] text-[#4F46E5]"
                  : "text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
              )}
            >
              {/* Teal active indicator bar */}
              {item.current && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#14B8A6] rounded-r-full" />
              )}
              <Icon className={cn(
                "h-[18px] w-[18px] flex-shrink-0 transition-colors duration-150",
                item.current
                  ? "text-[#4F46E5]"
                  : "text-[#94A3B8] group-hover:text-[#64748B]"
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
          <Button variant="ghost" size="icon" className="relative text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]">
            <Bell className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto bg-white border border-[#E2E8F0]">
          <DropdownMenuLabel className="flex items-center justify-between text-[#0F172A]">
            <span>Notifications</span>
            {unread > 0 && (
              <button onClick={(e) => { e.stopPropagation(); markAllRead(); }} className="text-xs text-[#4F46E5] hover:underline font-normal">
                Mark all read
              </button>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {notifs.length === 0 ? (
            <div className="p-6 text-center text-sm text-[#94A3B8]">
              <Bell className="h-6 w-6 mx-auto mb-2 opacity-40" />
              No notifications
            </div>
          ) : (
            notifs.slice(0, 8).map((n) => (
              <DropdownMenuItem
                key={n.id}
                className={cn("cursor-pointer", !n.read_at && "bg-[rgba(79,70,229,0.04)]")}
                onClick={() => {
                  if (!n.read_at) markRead(n.id);
                  const d = typeof n.data === 'string' ? JSON.parse(n.data) : (n.data || {});
                  if (d.project_id) window.location.href = `/projects/${d.project_id}/tasks`;
                }}
              >
                <div className="flex items-start gap-3 w-full">
                  <div className={cn("h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                    n.type === 'comment_added' ? 'bg-blue-50 text-blue-600' : n.type === 'attachment_added' ? 'bg-emerald-50 text-emerald-600' : n.type === 'status_changed' ? 'bg-orange-50 text-orange-600' : 'bg-indigo-50 text-indigo-600'
                  )}>
                    {n.type === 'comment_added' ? <MessageSquare className="h-4 w-4" /> :
                      n.type === 'status_changed' ? <CheckSquare className="h-4 w-4" /> :
                        <CheckSquare className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0F172A] truncate">{n.title}</p>
                    <p className="text-xs text-[#64748B] truncate">{n.message}</p>
                    <p className="text-[10px] text-[#94A3B8] mt-0.5">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.read_at && <div className="w-2 h-2 bg-[#4F46E5] rounded-full mt-1.5 flex-shrink-0" />}
                </div>
              </DropdownMenuItem>
            ))
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem className="justify-center">
            <a href="/notifications" className="text-sm text-[#4F46E5] hover:underline">View all notifications</a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const TopBar = () => (
    <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center gap-x-4 border-b border-[#E2E8F0] bg-white px-4 sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden text-[#64748B] hover:bg-[#F1F5F9]"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Marketplace & Messages - Only for Clients and Freelancers */}
      <div className="flex items-center gap-x-2">
        {props.auth?.user?.usage_type !== 'team_member' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.href = '/marketplace'}
            className="flex items-center gap-2 h-9 px-3 border-[#E2E8F0] hover:border-[#4F46E5] hover:bg-[rgba(79,70,229,0.04)] text-[#0F172A]"
          >
            <Store className="h-4 w-4" />
            <span className="hidden sm:inline">Marketplace</span>
          </Button>
        )}

        {props.auth?.user?.usage_type !== 'team_member' && (
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = '/marketplace/chats'}
              className="flex items-center gap-2 h-9 px-3 border-[#E2E8F0] hover:border-[#4F46E5] hover:bg-[rgba(79,70,229,0.04)] text-[#0F172A]"
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
      </div>

      {/* Workspace Switcher */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2 h-9 px-3 border-[#E2E8F0] hover:border-[#4F46E5] hover:bg-[rgba(79,70,229,0.04)] text-[#0F172A]">
            <div className="h-5 w-5 bg-[#4F46E5] rounded flex items-center justify-center">
              <Building className="h-3 w-3 text-white" />
            </div>
            <span className="font-semibold text-[#0F172A]">{currentWorkspace?.name || 'Select Workspace'}</span>
            <ChevronDown className="h-4 w-4 text-[#94A3B8]" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64 bg-white border border-[#E2E8F0]">
          <DropdownMenuLabel className="text-xs uppercase tracking-wider text-[#94A3B8] font-semibold">Workspaces</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {workspaces.map((workspace) => (
            <DropdownMenuItem
              key={workspace.id}
              onClick={() => switchWorkspace(workspace.id)}
              className={cn(
                "flex items-center gap-3 cursor-pointer rounded-lg mx-1 transition-all duration-150",
                workspace.id === currentWorkspace?.id
                  ? "bg-[rgba(79,70,229,0.08)]"
                  : "hover:bg-[#F1F5F9]"
              )}
            >
              <div className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0",
                workspace.id === currentWorkspace?.id
                  ? "bg-[#4F46E5]"
                  : "bg-[#F1F5F9]"
              )}>
                <Building className={cn("h-4 w-4", workspace.id === currentWorkspace?.id ? "text-white" : "text-[#64748B]")} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-[#0F172A] truncate">{workspace.name}</div>
                <div className="text-xs text-[#64748B] capitalize">{workspace.user_role}</div>
              </div>
              {workspace.id === currentWorkspace?.id && (
                <Check className="h-4 w-4 text-[#4F46E5] flex-shrink-0" />
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          {hasPermission('manage_settings') && (
            <DropdownMenuItem onClick={() => router.visit(route('invite.members'))} className="text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]">
              <UserPlus className="h-4 w-4 mr-2 text-[#4F46E5]" />
              Invite Team Member
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => window.location.href = '/workspaces/select'} className="text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]">
            <Plus className="h-4 w-4 mr-2 text-[#14B8A6]" />
            Switch Workspace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex-1" />

      {/* Right side items */}
      <div className="flex items-center gap-x-4">
        {/* Notifications — dynamic */}
        <NotificationBell />
      </div>
    </header>
  );
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <Head title={title} />

      {/* Flash Notifications */}
      <FlashNotification />

      {/* Toast Notifications */}
      <Notifications notifications={props.notifications || []} />

      <div className="flex h-screen">
        {/* Sidebar */}
        <aside className={cn(
          "hidden lg:flex lg:flex-col lg:w-60 lg:fixed lg:inset-y-0 lg:z-40 lg:bg-white lg:border-r lg:border-[#E2E8F0]",
          sidebarOpen && "lg:block"
        )}>
          {/* Sidebar Header */}
          <div className="flex h-14 shrink-0 items-center gap-x-4 px-5 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-[#4F46E5] rounded-lg flex items-center justify-center">
                <Building className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-[#0F172A]">CollabTool</h1>
                <p className="text-[11px] text-[#94A3B8] truncate max-w-[140px]">{currentWorkspace?.name}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <SidebarNavigation />

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-[#E2E8F0]">
            <div
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#F1F5F9] transition-all duration-150 cursor-pointer"
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
              <Avatar className="h-8 w-8">
                <AvatarImage src={props.auth?.user?.avatar_url ? `${props.auth?.user?.avatar_url}?t=${Date.now()}` : undefined} alt={props.auth?.user?.name} />
                <AvatarFallback className="bg-[#4F46E5] text-white text-xs font-semibold">
                  {props.auth?.user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#0F172A] truncate">
                  {props.auth?.user?.name}
                </p>
                <p className="text-xs text-[#64748B] capitalize truncate">
                  {userRole || 'Member'}
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className={cn("flex flex-col flex-1 lg:pl-60")}>
          {/* Top Bar */}
          <TopBar />

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto bg-[#F8FAFC] custom-scrollbar">
            <div className="p-6 lg:p-8">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/20" onClick={() => setSidebarOpen(false)} />
          <div className="fixed left-0 top-0 h-full w-60 bg-white border-r border-[#E2E8F0] shadow-lg">
            <div className="flex h-14 shrink-0 items-center justify-between px-5 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-[#4F46E5] rounded-lg flex items-center justify-center">
                  <Building className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className="text-base font-bold text-[#0F172A]">CollabTool</h1>
                  <p className="text-[11px] text-[#94A3B8]">{currentWorkspace?.name}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-[#64748B] hover:bg-[#F1F5F9]"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <SidebarNavigation />

            <div className="p-3 border-t border-[#E2E8F0]">
              <div
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#F1F5F9] transition-all duration-150 cursor-pointer"
                onClick={() => {
                  if (props.auth?.user?.usage_type === 'team_member') {
                    window.location.href = '/profile';
                  } else if (props.auth?.user?.usage_type === 'client') {
                    window.location.href = '/marketplace/client-profile';
                  } else {
                    window.location.href = '/marketplace/profile';
                  }
                }}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={props.auth?.user?.avatar_url ? `${props.auth?.user?.avatar_url}?t=${Date.now()}` : undefined} alt={props.auth?.user?.name} />
                  <AvatarFallback className="bg-[#4F46E5] text-white text-xs font-semibold">
                    {props.auth?.user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#0F172A] truncate">
                    {props.auth?.user?.name}
                  </p>
                  <p className="text-xs text-[#64748B] capitalize">
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

      {/* Profile Drawer */}
      <ProfileDrawer
        isOpen={isOpen}
        onClose={closeProfile}
        userId={userId}
      />
    </div>
  );
};

const MainLayout = ({ title, children }) => {
  return <MainLayoutContent title={title} children={children} />;
};

export default MainLayout;
