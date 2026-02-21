import { Head, Link, router } from '@inertiajs/react';
import { useState, useRef, useEffect } from 'react';
import MarketplaceLayout from '@/Layouts/MarketplaceLayout';
import ChatBubble from '@/Components/Marketplace/ChatBubble';
import { useProfile } from '@/Context/ProfileContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Send } from 'lucide-react';
import axios from 'axios';

export default function CollaborationChat({ collaboration, messages: initialMessages, otherUser, currentUserId }) {
    const [messages, setMessages] = useState(initialMessages || []);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const { openProfile } = useProfile();
    const messagesEndRef = useRef(null);

    const openProfileDrawer = (userId) => {
        openProfile(userId);
    };

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    useEffect(() => {
        if (collaboration && currentUserId) markMessagesAsRead();
    }, [collaboration?.id, currentUserId]);

    const markMessagesAsRead = async () => {
        try {
            await axios.post(route('marketplace.collaborations.mark-read', collaboration.id));
            window.dispatchEvent(new CustomEvent('messagesRead', { detail: { chatId: collaboration.id, chatType: 'collaboration', unreadCount: 0 } }));
        } catch (error) { /* silently fail */ }
    };

    const sendMessage = async () => {
        const body = newMessage.trim();
        if (!body || sending) return;
        setSending(true);
        setNewMessage('');
        try {
            const { data } = await axios.post(route('marketplace.collaborations.message', collaboration.id), { body });
            setMessages(prev => [...prev, data]);
        } catch (err) {
            setNewMessage(body);
        } finally {
            setSending(false);
        }
    };

    return (
        <MarketplaceLayout>
            <Head title={`Message ${otherUser?.name}`} />

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 140px)' }}>
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E2E8F0] bg-white">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => router.visit(route('marketplace.chats.index'))}
                                className="p-1.5 rounded-lg hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A] transition-colors"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                            <div
                                className="h-10 w-10 rounded-full bg-[#14B8A6] flex items-center justify-center text-white font-semibold flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-[rgba(20,184,166,0.3)] transition-all overflow-hidden"
                                onClick={() => openProfileDrawer(otherUser.id)}
                            >
                                {otherUser?.avatar_url ? (
                                    <img src={otherUser.avatar_url} alt={otherUser.name} className="h-10 w-10 rounded-full object-cover" />
                                ) : (
                                    otherUser?.name?.charAt(0)?.toUpperCase() || '?'
                                )}
                            </div>
                            <div>
                                <h2 className="font-semibold text-[#0F172A] text-sm">{otherUser?.name}</h2>
                                <p className="text-xs text-[#64748B] capitalize">{otherUser?.usage_type}</p>
                            </div>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-5 py-4 bg-[#F8FAFC]">
                        {messages.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="h-16 w-16 bg-[rgba(20,184,166,0.08)] rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Send className="h-8 w-8 text-[#14B8A6]" />
                                </div>
                                <p className="text-sm font-medium text-[#0F172A]">Start the conversation!</p>
                                <p className="text-xs text-[#64748B] mt-1 max-w-[240px] mx-auto">Discuss project partnerships, workspace collaboration, or just network with {otherUser?.name}.</p>
                            </div>
                        ) : (
                            messages.map((msg) => (
                                <ChatBubble
                                    key={msg.id}
                                    message={msg}
                                    isOwn={msg.sender_id === currentUserId}
                                    openProfileDrawer={openProfileDrawer}
                                />
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="px-5 py-3.5 border-t border-[#E2E8F0] bg-white">
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                                placeholder="Type a message..."
                                className="flex-1 h-11 px-4 rounded-xl border border-[#E2E8F0] bg-white text-sm focus:border-[#14B8A6] focus:ring-2 focus:ring-[rgba(20,184,166,0.1)] transition-all outline-none text-[#0F172A] placeholder-[#94A3B8]"
                                disabled={sending}
                            />
                            <Button
                                onClick={sendMessage}
                                disabled={!newMessage.trim() || sending}
                                className="h-11 w-11 rounded-xl bg-[#14B8A6] hover:bg-[#0D9488] p-0"
                            >
                                <Send className="h-4.5 w-4.5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

        </MarketplaceLayout>
    );
}
