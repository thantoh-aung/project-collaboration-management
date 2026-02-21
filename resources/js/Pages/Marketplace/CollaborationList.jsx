import { Head, Link } from '@inertiajs/react';
import MarketplaceLayout from '@/Layouts/MarketplaceLayout';
import { MessageSquare, Clock, ArrowRight, Search, Users, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function CollaborationList({ collaborations }) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredCollaborations = collaborations?.filter(collab => {
        const otherUser = collab.other_user;
        const matchesSearch = !searchQuery ||
            otherUser?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            collab.messages?.[0]?.body?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    }) || [];

    const totalUnread = collaborations?.reduce((sum, collab) => sum + (collab.unread_count || 0), 0) || 0;

    return (
        <MarketplaceLayout>
            <Head title="Freelancer Collaborations" />

            <div className="min-h-screen bg-[#F8FAFC]">
                {/* Header */}
                <div className="bg-white border-b border-[#E2E8F0] sticky top-0 z-40">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-[#0F172A]">Collaborations</h1>
                                <p className="text-[#64748B] mt-1">Network and partner with other freelancers</p>
                            </div>
                            <div className="hidden lg:flex items-center gap-4">
                                <div className="bg-[rgba(20,184,166,0.08)] text-[#14B8A6] px-4 py-2 rounded-xl flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    <div>
                                        <p className="text-xs opacity-80">Total Network</p>
                                        <p className="text-lg font-bold">{collaborations?.length || 0}</p>
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

                {/* Search */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search collaborations..."
                            className="pl-10 h-11 bg-white border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] rounded-xl"
                        />
                    </div>
                </div>

                {/* List */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
                    {filteredCollaborations.length > 0 ? (
                        <div className="grid gap-4">
                            {filteredCollaborations.map((collab) => {
                                const otherUser = collab.other_user;
                                const lastMessage = collab.messages?.[0];

                                return (
                                    <Link
                                        key={collab.id}
                                        href={route('marketplace.collaborations.show', collab.id)}
                                        className="group bg-white rounded-xl border border-[#E2E8F0] hover:border-[rgba(20,184,166,0.3)] hover:shadow-md transition-all duration-200 overflow-hidden"
                                    >
                                        <div className="p-6">
                                            <div className="flex items-start gap-4">
                                                {/* Avatar */}
                                                <div className="relative">
                                                    <div className="h-14 w-14 rounded-full bg-[#14B8A6] flex items-center justify-center text-white font-bold text-lg flex-shrink-0 group-hover:scale-105 transition-transform overflow-hidden">
                                                        {otherUser?.avatar_url ? (
                                                            <img src={otherUser.avatar_url} alt={otherUser.name} className="h-14 w-14 rounded-full object-cover" />
                                                        ) : (
                                                            otherUser?.name?.charAt(0)?.toUpperCase() || '?'
                                                        )}
                                                    </div>
                                                    {collab.unread_count > 0 && (
                                                        <div className="absolute -top-1 -right-1 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                                            {collab.unread_count}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div>
                                                            <h3 className="text-lg font-semibold text-[#0F172A] group-hover:text-[#14B8A6] transition-colors">
                                                                {otherUser?.name || 'Unknown User'}
                                                            </h3>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <span className="text-xs text-[#94A3B8] capitalize">{otherUser?.usage_type}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-2 ml-4">
                                                            {collab.last_message_at && (
                                                                <span className="text-xs text-[#94A3B8] flex items-center gap-1">
                                                                    <Clock className="h-3 w-3" />
                                                                    {new Date(collab.last_message_at).toLocaleDateString(undefined, {
                                                                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                                    })}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="mb-2">
                                                        <p className="text-[#64748B] text-sm leading-relaxed line-clamp-2">
                                                            {lastMessage ? (
                                                                <span className={collab.unread_count > 0 ? 'font-semibold text-[#0F172A]' : ''}>
                                                                    {lastMessage.body}
                                                                </span>
                                                            ) : (
                                                                <span className="text-[#94A3B8] italic">No messages yet</span>
                                                            )}
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center justify-end">
                                                        <ArrowRight className="h-4 w-4 text-[#94A3B8] group-hover:text-[#14B8A6] group-hover:translate-x-1 transition-all" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 max-w-2xl mx-auto">
                                <div className="h-20 w-20 bg-[rgba(20,184,166,0.08)] rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <Users className="h-10 w-10 text-[#14B8A6]" />
                                </div>
                                <h3 className="text-2xl font-bold text-[#0F172A] mb-3">
                                    {searchQuery ? 'No collaborations found' : 'Start networking'}
                                </h3>
                                <p className="text-[#64748B] mb-8 max-w-md mx-auto">
                                    CollabTool is better with friends. Reach out to other freelancers to discuss project partnerships or just to say hi.
                                </p>
                                <Link href={route('marketplace.home')}>
                                    <Button className="rounded-xl bg-[#14B8A6] hover:bg-[#0D9488] text-white">
                                        Browse Marketplace
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </MarketplaceLayout>
    );
}
