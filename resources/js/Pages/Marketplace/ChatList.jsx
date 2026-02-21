import { Head, Link, router, usePage } from '@inertiajs/react';
import MarketplaceLayout from '@/Layouts/MarketplaceLayout';
import { MessageSquare, Clock, CheckCircle2, ArrowRight, Search, Filter, Users, Briefcase, Star, Phone, Mail, Calendar, TrendingUp, Crown, Trash2 } from 'lucide-react';
import ProfileDrawer from '@/Components/Marketplace/ProfileDrawer';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const statusMap = {
    open: { label: 'Active', color: 'bg-emerald-50 text-emerald-600', icon: MessageSquare },
    converted_to_workspace: { label: 'Converted', color: 'bg-blue-50 text-blue-600', icon: CheckCircle2 },
};


export default function ChatList({ chats }) {
    const { auth } = usePage().props;
    const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [chatsState, setChatsState] = useState(chats || []);

    useEffect(() => {
        const handleMessagesRead = (event) => {
            const { chatId, chatType, unreadCount } = event.detail;
            setChatsState(prevChats => prevChats.map(chat =>
                (chat.id === chatId && chat.chat_type === chatType) ? { ...chat, unread_count: unreadCount } : chat
            ));
        };
        window.addEventListener('messagesRead', handleMessagesRead);
        return () => window.removeEventListener('messagesRead', handleMessagesRead);
    }, []);

    useEffect(() => { setChatsState(chats || []); }, [chats]);

    const filteredChats = chatsState?.filter(chat => {
        const otherUser = chat.other_user;
        const matchesSearch = !searchQuery ||
            otherUser?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            chat.messages?.[0]?.body?.toLowerCase().includes(searchQuery.toLowerCase());

        let matchesFilter = true;
        if (activeFilter === 'all') {
            matchesFilter = true;
        } else {
            matchesFilter = chat.category === activeFilter;
        }

        return matchesSearch && matchesFilter;
    }) || [];

    const totalUnread = chatsState?.reduce((sum, chat) => sum + (chat.unread_count || 0), 0) || 0;

    const openProfileDrawer = (userId) => {
        setSelectedUserId(userId);
        setProfileDrawerOpen(true);
    };

    const deleteChat = (chatId, e) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this chat?')) {
            router.delete(route('marketplace.chats.delete', chatId), {
                onSuccess: (page) => {
                    if (page.props.redirect) window.location.href = page.props.redirect;
                    else window.location.reload();
                },
                onError: (errors) => alert('Error deleting chat: ' + (errors.message || 'Unknown error')),
            });
        }
    };

    return (
        <MarketplaceLayout>
            <Head title="Messages" />

            <div className="min-h-screen bg-[#F8FAFC]">
                {/* Header */}
                <div className="bg-white border-b border-[#E2E8F0] sticky top-0 z-40">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-[#0F172A]">Messages</h1>
                                <p className="text-[#64748B] mt-1">Connect with clients and freelancers</p>
                            </div>
                            <div className="hidden lg:flex items-center gap-4">
                                <div className="bg-[rgba(79,70,229,0.08)] text-[#4F46E5] px-4 py-2 rounded-xl flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4" />
                                    <div>
                                        <p className="text-xs opacity-80">Total Chats</p>
                                        <p className="text-lg font-bold">{chats?.length || 0}</p>
                                    </div>
                                </div>
                                {totalUnread > 0 && (
                                    <div className="bg-red-50 text-red-600 px-4 py-2 rounded-xl flex items-center gap-2 animate-pulse">
                                        <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                                        <div>
                                            <p className="text-xs opacity-80">Unread</p>
                                            <p className="text-lg font-bold">{totalUnread}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search and Filter */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search conversations..."
                                className="pl-10 h-11 bg-white border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] rounded-xl"
                            />
                        </div>
                        <div className="flex items-center gap-2 bg-[#F1F5F9] rounded-xl p-1 border border-[#E2E8F0]">
                            {[
                                { key: 'all', label: 'All Messages' },
                                { key: 'collaborator', label: 'Collaborators' },
                            ].map((filter) => {
                                const count = filter.key === 'all'
                                    ? chatsState?.length
                                    : chatsState?.filter(c => c.category === filter.key).length;

                                return (
                                    <button
                                        key={filter.key}
                                        onClick={() => setActiveFilter(filter.key)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeFilter === filter.key
                                            ? 'bg-white text-[#4F46E5] shadow-sm'
                                            : 'text-[#64748B] hover:text-[#0F172A]'
                                            }`}
                                    >
                                        {filter.label}
                                        {count > 0 && (
                                            <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${activeFilter === filter.key
                                                ? 'bg-[rgba(79,70,229,0.08)] text-[#4F46E5]'
                                                : 'bg-[#E2E8F0] text-[#64748B]'
                                                }`}>
                                                {count}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
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
                                        key={`${chat.chat_type}-${chat.id}`}
                                        href={chat.chat_type === 'collaboration'
                                            ? route('marketplace.collaborations.show', chat.id)
                                            : route('marketplace.chats.show', chat.id)}
                                        className="group bg-white rounded-xl border border-[#E2E8F0] hover:border-[rgba(79,70,229,0.3)] hover:shadow-md transition-all duration-200 overflow-hidden"
                                    >
                                        <div className="p-6">
                                            <div className="flex items-start gap-4">
                                                {/* Avatar */}
                                                <div className="relative">
                                                    <div
                                                        className="h-14 w-14 rounded-full bg-[#4F46E5] flex items-center justify-center text-white font-bold text-lg flex-shrink-0 cursor-pointer hover:ring-4 hover:ring-[rgba(79,70,229,0.15)] transition-all group-hover:scale-105 overflow-hidden"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            openProfileDrawer(otherUser.id);
                                                        }}
                                                    >
                                                        {otherUser?.avatar_url ? (
                                                            <img src={`${otherUser.avatar_url}?t=${Date.now()}`} alt={otherUser.name} className="h-14 w-14 rounded-full object-cover" />
                                                        ) : (
                                                            otherUser?.name?.charAt(0)?.toUpperCase() || '?'
                                                        )}
                                                    </div>
                                                    {chat.unread_count > 0 && (
                                                        <div className="absolute -top-1 -right-1 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                                            {chat.unread_count > 99 ? '99+' : chat.unread_count}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h3 className="text-lg font-semibold text-[#0F172A] group-hover:text-[#4F46E5] transition-colors">
                                                                    {otherUser?.name || 'Unknown User'}
                                                                </h3>
                                                                {jobTitle && (
                                                                    <span className="text-sm text-[#64748B] font-medium">{jobTitle}</span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-3 flex-wrap">
                                                                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${status.color}`}>
                                                                    <StatusIcon className="h-3 w-3" />
                                                                    {status.label}
                                                                </span>
                                                                {chat.status === 'converted_to_workspace' && (
                                                                    <span className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                                                                        <Briefcase className="h-3 w-3" />
                                                                        Workspace
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-2 ml-4">
                                                            <button
                                                                onClick={(e) => deleteChat(chat.id, e)}
                                                                className="p-1.5 rounded-lg text-[#94A3B8] hover:text-red-500 hover:bg-red-50 transition-colors"
                                                                title="Delete chat"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                            {chat.last_message_at && (
                                                                <span className="text-xs text-[#94A3B8] flex items-center gap-1">
                                                                    <Clock className="h-3 w-3" />
                                                                    {new Date(chat.last_message_at).toLocaleDateString(undefined, {
                                                                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                                    })}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="mb-2">
                                                        <p className="text-[#64748B] text-sm leading-relaxed line-clamp-2">
                                                            {lastMessage ? (
                                                                <span className={chat.unread_count > 0 ? 'font-semibold text-[#0F172A]' : ''}>
                                                                    {lastMessage.body}
                                                                </span>
                                                            ) : (
                                                                <span className="text-[#94A3B8] italic">No messages yet</span>
                                                            )}
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center justify-end">
                                                        <ArrowRight className="h-4 w-4 text-[#94A3B8] group-hover:text-[#4F46E5] group-hover:translate-x-1 transition-all" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {chat.status === 'converted_to_workspace' && (
                                            <div className="bg-blue-50 px-6 py-3 border-t border-blue-100">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2 text-sm text-blue-600">
                                                        <CheckCircle2 className="h-4 w-4" />
                                                        <span className="font-medium">Workspace Created</span>
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            window.location.href = route('dashboard');
                                                        }}
                                                        className="text-xs text-blue-600 hover:text-blue-700 font-medium underline"
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
                            <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 max-w-2xl mx-auto">
                                <div className="h-20 w-20 bg-[rgba(79,70,229,0.08)] rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <MessageSquare className="h-10 w-10 text-[#4F46E5]" />
                                </div>
                                <h3 className="text-2xl font-bold text-[#0F172A] mb-3">
                                    {searchQuery ? 'No conversations found' : 'No conversations yet'}
                                </h3>
                                <p className="text-[#64748B] mb-8 max-w-md mx-auto">
                                    {searchQuery
                                        ? 'Try adjusting your search or filters.'
                                        : 'Browse the marketplace to find talented freelancers and start meaningful conversations.'}
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                    {searchQuery && (
                                        <Button onClick={() => setSearchQuery('')} variant="outline" className="rounded-xl border-[#E2E8F0] text-[#64748B]">
                                            Clear Search
                                        </Button>
                                    )}
                                    <Link href={route('marketplace.home')}>
                                        <Button className="rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white">
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

            <ProfileDrawer
                isOpen={profileDrawerOpen}
                onClose={() => { setProfileDrawerOpen(false); setSelectedUserId(null); }}
                userId={selectedUserId}
            />
        </MarketplaceLayout>
    );
}
