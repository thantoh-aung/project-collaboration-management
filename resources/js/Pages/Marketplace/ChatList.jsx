import { Head, Link, router } from '@inertiajs/react';
import MarketplaceLayout from '@/Layouts/MarketplaceLayout';
import { MessageSquare, Clock, CheckCircle2, ArrowRight, Search, Filter, Users, Briefcase, Star, Phone, Mail, Calendar, TrendingUp, Crown, Trash2 } from 'lucide-react';
import ProfileDrawer from '@/Components/Marketplace/ProfileDrawer';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const statusMap = {
    open: { label: 'Active', color: 'bg-emerald-100 text-emerald-700', icon: MessageSquare },
    converted_to_workspace: { label: 'Converted', color: 'bg-indigo-100 text-indigo-700', icon: CheckCircle2 },
};


export default function ChatList({ chats }) {
    const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [chatsState, setChatsState] = useState(chats || []);
    
    // Debug: Log chat data to check user avatars
    console.log('🔍 ChatList Debug - Chats:', chats);

    // Listen for messagesRead event to update unread counts
    useEffect(() => {
        const handleMessagesRead = (event) => {
            console.log('🔍 messagesRead event received:', event.detail);
            const { chatId, unreadCount } = event.detail;
            
            console.log('🔍 Updating chat:', chatId, 'to unread_count:', unreadCount);
            console.log('🔍 Current chatsState:', chatsState);
            
            setChatsState(prevChats => {
                console.log('🔍 Previous chats:', prevChats);
                const updatedChats = prevChats.map(chat => 
                    chat.id === chatId 
                        ? { ...chat, unread_count: unreadCount }
                        : chat
                );
                console.log('🔍 Updated chats:', updatedChats);
                return updatedChats;
            });
        };

        console.log('🔍 Adding messagesRead event listener');
        window.addEventListener('messagesRead', handleMessagesRead);
        
        return () => {
            console.log('🔍 Removing messagesRead event listener');
            window.removeEventListener('messagesRead', handleMessagesRead);
        };
    }, []);

    // Update chats state when props change
    useEffect(() => {
        setChatsState(chats || []);
    }, [chats]);

    
    // Filter chats based on search and filter
    const filteredChats = chatsState?.filter(chat => {
        const otherUser = chat.other_user;
        const matchesSearch = !searchQuery || 
            otherUser?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            chat.messages?.[0]?.body?.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesFilter = activeFilter === 'all' || (activeFilter === 'open' && chat.status !== 'converted_to_workspace') || chat.status === activeFilter;
        
        return matchesSearch && matchesFilter;
    }) || [];

    // Calculate stats
    const totalUnread = chatsState?.reduce((sum, chat) => sum + (chat.unread_count || 0), 0) || 0;
    const activeChats = chatsState?.filter(chat => chat.status !== 'converted_to_workspace').length || 0;
    const convertedChats = chatsState?.filter(chat => chat.status === 'converted_to_workspace').length || 0;

    const openProfileDrawer = (userId) => {
        setSelectedUserId(userId);
        setProfileDrawerOpen(true);
    };

    const deleteChat = (chatId, e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (confirm('Are you sure you want to delete this chat? You can restore it later by starting a new conversation.')) {
            router.delete(route('marketplace.chats.delete', chatId), {
                onSuccess: (page) => {
                    // Handle JSON response with redirect
                    if (page.props.redirect) {
                        window.location.href = page.props.redirect;
                    } else {
                        // If no redirect, reload the page to update the list
                        window.location.reload();
                    }
                },
                onError: (errors) => {
                    alert('Error deleting chat: ' + (errors.message || 'Unknown error'));
                }
            });
        }
    };

    return (
        <MarketplaceLayout>
            <Head title="Messages" />

            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30">
                {/* Header Section */}
                <div className="bg-white border-b border-gray-200/80 backdrop-blur-sm sticky top-0 z-40">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 bg-clip-text text-transparent">
                                    Messages
                                </h1>
                                <p className="text-gray-600 mt-1">Connect with clients and freelancers</p>
                            </div>
                            
                            {/* Stats Cards */}
                            <div className="hidden lg:flex items-center gap-4">
                                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg">
                                    <MessageSquare className="h-4 w-4" />
                                    <div>
                                        <p className="text-xs opacity-90">Total Chats</p>
                                        <p className="text-lg font-bold">{chats?.length || 0}</p>
                                    </div>
                                </div>
                                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg">
                                    <Users className="h-4 w-4" />
                                    <div>
                                        <p className="text-xs opacity-90">Active</p>
                                        <p className="text-lg font-bold">{activeChats}</p>
                                    </div>
                                </div>
                                {totalUnread > 0 && (
                                    <div className="bg-gradient-to-r from-red-500 to-pink-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg animate-pulse">
                                        <div className="h-2 w-2 bg-white rounded-full"></div>
                                        <div>
                                            <p className="text-xs opacity-90">Unread</p>
                                            <p className="text-lg font-bold">{totalUnread}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search and Filter Section */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                        {/* Search Bar */}
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search conversations..."
                                className="pl-10 h-11 bg-white border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                            />
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex items-center gap-2 bg-white rounded-xl p-1 border border-gray-200 shadow-sm">
                            {[
                                { key: 'all', label: 'All', count: chats?.length || 0 },
                                { key: 'open', label: 'Active', count: activeChats },
                            ].map((filter) => (
                                <button
                                    key={filter.key}
                                    onClick={() => setActiveFilter(filter.key)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                        activeFilter === filter.key
                                            ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                >
                                    {filter.label}
                                    {filter.count > 0 && (
                                        <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                                            activeFilter === filter.key
                                                ? 'bg-white/20 text-white'
                                                : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {filter.count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Chat List */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
                    {filteredChats.length > 0 ? (
                        <div className="grid gap-4">
                            {filteredChats.map((chat) => {
                                const status = statusMap[chat.status] || statusMap.open;
                                const StatusIcon = status.icon;
                                const otherUser = chat.other_user;
                                const lastMessage = chat.messages?.[0];
                                const jobTitle = otherUser?.job_title;

                                return (
                                    <Link
                                        key={chat.id}
                                        href={route('marketplace.chats.show', chat.id)}
                                        className="group bg-white rounded-2xl border border-gray-200/80 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 overflow-hidden"
                                    >
                                        <div className="p-6">
                                            <div className="flex items-start gap-4">
                                                {/* Avatar Section */}
                                                <div className="relative">
                                                    <div 
                                                        className="h-14 w-14 rounded-full bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-700 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 cursor-pointer hover:ring-4 hover:ring-indigo-500/20 transition-all group-hover:scale-105 shadow-md shadow-indigo-500/20 overflow-hidden"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            openProfileDrawer(otherUser.id);
                                                        }}
                                                    >
                                                        {(() => {
                                                            console.log('🔍 ChatList Debug - User Avatar Data:', {
                                                                userId: otherUser?.id,
                                                                name: otherUser?.name,
                                                                avatar: otherUser?.avatar,
                                                                avatar_url: otherUser?.avatar_url,
                                                                usage_type: otherUser?.usage_type
                                                            });
                                                            return otherUser?.avatar_url ? (
                                                                <img src={`${otherUser.avatar_url}?t=${Date.now()}`} alt={otherUser.name} className="h-14 w-14 rounded-full object-cover" />
                                                            ) : (
                                                                otherUser?.name?.charAt(0)?.toUpperCase() || '?'
                                                            );
                                                        })()}
                                                    </div>
                                                    {chat.unread_count > 0 && (
                                                        <div className="absolute -top-1 -right-1 h-6 w-6 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg animate-pulse">
                                                            {chat.unread_count > 99 ? '99+' : chat.unread_count}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Content Section */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                                                    {otherUser?.name || 'Unknown User'}
                                                                </h3>
                                                                {jobTitle && (
                                                                    <span className="text-sm text-gray-500 font-medium">
                                                                        {jobTitle}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-3 flex-wrap">
                                                                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${status.color}`}>
                                                                    <StatusIcon className="h-3 w-3" />
                                                                    {status.label}
                                                                </span>
                                                                {chat.status === 'converted_to_workspace' && (
                                                                    <span className="inline-flex items-center gap-1 text-xs text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                                                                        <Briefcase className="h-3 w-3" />
                                                                        Workspace
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-2 ml-4">
                                                            {chat.last_message_at && (
                                                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                                                    <Clock className="h-3 w-3" />
                                                                    {new Date(chat.last_message_at).toLocaleDateString(undefined, { 
                                                                        month: 'short', 
                                                                        day: 'numeric',
                                                                        hour: '2-digit', 
                                                                        minute: '2-digit' 
                                                                    })}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="mb-3">
                                                        <p className="text-gray-600 text-sm leading-relaxed">
                                                            {lastMessage ? (
                                                                <span className={chat.unread_count > 0 ? 'font-semibold text-gray-900' : ''}>
                                                                    {lastMessage.body.length > 120 
                                                                        ? `${lastMessage.body.substring(0, 120)}...` 
                                                                        : lastMessage.body
                                                                    }
                                                                </span>
                                                            ) : (
                                                                <span className="text-gray-400 italic">No messages yet</span>
                                                            )}
                                                        </p>
                                                    </div>

                                                    {/* Action Buttons */}
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    openProfileDrawer(otherUser.id);
                                                                }}
                                                                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 hover:bg-indigo-50 px-2 py-1 rounded-lg transition-colors"
                                                            >
                                                                <Users className="h-3 w-3" />
                                                                View Profile
                                                            </button>
                                                            <button
                                                                onClick={(e) => deleteChat(chat.id, e)}
                                                                className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors"
                                                                title="Delete chat"
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                                Delete
                                                            </button>
                                                        </div>
                                                        <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Status Bar */}
                                        {chat.status === 'converted_to_workspace' && (
                                            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-3 border-t border-indigo-100">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2 text-sm text-indigo-700">
                                                        <CheckCircle2 className="h-4 w-4" />
                                                        <span className="font-medium">Workspace Created</span>
                                                    </div>
                                                    <button 
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            window.location.href = route('dashboard');
                                                        }}
                                                        className="text-xs text-indigo-600 hover:text-indigo-700 font-medium underline"
                                                    >
                                                        Go to Workspace →
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-12 max-w-2xl mx-auto">
                                <div className="h-20 w-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <MessageSquare className="h-10 w-10 text-indigo-600" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                                    {searchQuery ? 'No conversations found' : 'No conversations yet'}
                                </h3>
                                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                                    {searchQuery 
                                        ? 'Try adjusting your search or filters to find what you\'re looking for.'
                                        : 'Browse the marketplace to find talented freelancers and start meaningful conversations.'
                                    }
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                    {searchQuery && (
                                        <Button
                                            onClick={() => setSearchQuery('')}
                                            variant="outline"
                                            className="rounded-xl"
                                        >
                                            Clear Search
                                        </Button>
                                    )}
                                    <Link href={route('marketplace.home')}>
                                        <Button className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                                            <Search className="h-4 w-4 mr-2" />
                                            Browse Marketplace
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Profile Drawer */}
            <ProfileDrawer
                isOpen={profileDrawerOpen}
                onClose={() => {
                    setProfileDrawerOpen(false);
                    setSelectedUserId(null);
                }}
                userId={selectedUserId}
            />
        </MarketplaceLayout>
    );
}
