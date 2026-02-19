import { Link, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { MessageSquare, Bell, Search, User, LogOut, Settings, ChevronDown, Code, Menu, X, Home, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AiChatbot from '@/Components/AiChatbot';

export default function MarketplaceLayout({ children }) {
    const { auth, unread_message_count } = usePage().props;
    const user = auth?.user;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [localUnreadCount, setLocalUnreadCount] = useState(unread_message_count || 0);
    const [avatarKey, setAvatarKey] = useState(0);

    // Listen for messagesRead event to update notification count
    useEffect(() => {
        const handleMessagesRead = (event) => {
            console.log('🔍 MarketplaceLayout messagesRead event received:', event.detail);
            const { chatId, unreadCount } = event.detail;
            
            // Update local unread count immediately
            setLocalUnreadCount(prevCount => {
                // Calculate new total by subtracting the read messages from this chat
                // This is a simplified approach - in a real app, you'd want to track per-chat counts
                return Math.max(0, prevCount - 1); // Assuming at least 1 message was read
            });
        };

        window.addEventListener('messagesRead', handleMessagesRead);
        
        return () => {
            window.removeEventListener('messagesRead', handleMessagesRead);
        };
    }, []);

    // Update local count when prop changes
    useEffect(() => {
        setLocalUnreadCount(unread_message_count || 0);
    }, [unread_message_count]);

    // Update avatar key when user avatar changes to force image refresh
    useEffect(() => {
        if (user?.avatar_url) {
            setAvatarKey(prev => prev + 1);
        }
    }, [user?.avatar_url]);

    // Debug: Log user avatar data in marketplace
    console.log('🔍 MarketplaceLayout Debug - User:', {
        id: user?.id,
        name: user?.name,
        avatar: user?.avatar,
        avatar_url: user?.avatar_url,
        usage_type: user?.usage_type
    });

    const isFreelancer = user?.usage_type === 'freelancer';
    const isClient = user?.usage_type === 'client';

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col">
            {/* Navbar */}
            <nav className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50 flex-shrink-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Left: Logo + Nav */}
                        <div className="flex items-center gap-8">
                            <Link href={route('marketplace.home')} className="flex items-center gap-2">
                                <div className="h-9 w-9 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                                    <Code className="h-5 w-5 text-white" />
                                </div>
                                <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent hidden sm:block">CollabTool</span>
                            </Link>

                            <div className="hidden md:flex items-center gap-1">
                                <Link href={route('marketplace.home')} className="px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-blue-400 hover:bg-slate-700 transition-colors">
                                    <Home className="h-4 w-4 inline mr-1.5" />Marketplace
                                </Link>
                                <Link href={route('workspaces.select')} className="px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-blue-400 hover:bg-slate-700 transition-colors">
                                    <Briefcase className="h-4 w-4 inline mr-1.5" />Workspaces
                                </Link>
                                <Link href={route('marketplace.chats.index')} className="relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-blue-400 hover:bg-slate-700 transition-colors">
                                    <MessageSquare className="h-4 w-4" />
                                    <span>Messages</span>
                                    {localUnreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 h-5 w-5 bg-gradient-to-r from-red-500 to-pink-600 text-white text-xs rounded-full flex items-center justify-center font-medium shadow-lg shadow-red-500/30">
                                            {localUnreadCount > 99 ? '99+' : localUnreadCount}
                                        </span>
                                    )}
                                </Link>
                            </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-3">

                            {/* Profile Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-700 transition-colors"
                                >
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium overflow-hidden">
                                        {user?.avatar_url ? (
                                            <img 
                                                key={`avatar-${user.id}-${avatarKey}`}
                                                src={`${user.avatar_url}?v=${avatarKey}`} 
                                                alt={user.name} 
                                                className="h-8 w-8 rounded-full object-cover"
                                            />
                                        ) : (
                                            user?.name?.charAt(0)?.toUpperCase() || 'U'
                                        )}
                                    </div>
                                    <span className="text-sm font-medium text-gray-300 hidden sm:block">{user?.name}</span>
                                    <ChevronDown className="h-4 w-4 text-gray-400 hidden sm:block" />
                                </button>

                                {profileMenuOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setProfileMenuOpen(false)} />
                                        <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-600 rounded-xl shadow-xl z-50 py-1">
                                            <div className="px-4 py-3 border-b border-slate-700">
                                                <p className="text-sm font-medium text-white">{user?.name}</p>
                                                <p className="text-xs text-gray-400">{user?.email}</p>
                                                <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-600/20 text-blue-300 border border-blue-500/30">
                                                    {user?.usage_type?.replace('_', ' ')}
                                                </span>
                                            </div>

                                            {isFreelancer && (
                                                <Link href={route('marketplace.profile')} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-slate-700 hover:text-blue-400" onClick={() => setProfileMenuOpen(false)}>
                                                    <Briefcase className="h-4 w-4" />My Freelancer Profile
                                                </Link>
                                            )}
                                            {isClient && (
                                                <Link href={route('marketplace.client-profile')} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-slate-700 hover:text-blue-400" onClick={() => setProfileMenuOpen(false)}>
                                                    <User className="h-4 w-4" />My Client Profile
                                                </Link>
                                            )}

                                            <div className="border-t border-slate-700 mt-1">
                                                <Link href={route('logout')} method="delete" as="button" className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-600/20 w-full" onClick={() => setProfileMenuOpen(false)}>
                                                    <LogOut className="h-4 w-4" />Sign Out
                                                </Link>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Mobile menu button */}
                            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg text-gray-400 hover:bg-slate-700">
                                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-slate-700 bg-slate-800 px-4 py-3 space-y-1">
                        <Link href={route('marketplace.home')} className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-slate-700">Marketplace</Link>
                        <Link href={route('workspaces.select')} className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-slate-700">Workspaces</Link>
                        <Link href={route('marketplace.chats.index')} className="relative flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-slate-700">
                            <span>Messages</span>
                            {localUnreadCount > 0 && (
                                <span className="ml-2 h-5 w-5 bg-gradient-to-r from-red-500 to-pink-600 text-white text-xs rounded-full flex items-center justify-center font-medium">
                                    {localUnreadCount > 99 ? '99+' : localUnreadCount}
                                </span>
                            )}
                        </Link>
                    </div>
                )}
            </nav>

            {/* Page Content */}
            <main className="flex-1">{children}</main>

            {/* Footer */}
            <footer className="bg-slate-800 border-t border-slate-700 mt-8 flex-shrink-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <div className="h-7 w-7 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <Code className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-sm font-semibold text-gray-300">CollabTool</span>
                        </div>
                        <p className="text-xs text-gray-400">&copy; {new Date().getFullYear()} CollabTool. All rights reserved.</p>
                    </div>
                </div>
            </footer>

            {/* AI Chatbot - Available on all marketplace pages */}
            <AiChatbot />
        </div>
    );
}
