import { Head, Link, usePage, router } from '@inertiajs/react';
import { useState, useRef, useEffect } from 'react';
import MarketplaceLayout from '@/Layouts/MarketplaceLayout';
import ChatBubble from '@/Components/Marketplace/ChatBubble';
import StartProjectModal from '@/components/Marketplace/StartProjectModal';
import { useProfile } from '@/Context/ProfileContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Send, Paperclip, Rocket, Lock, Trash2, Mic, Square, X } from 'lucide-react';
import axios from 'axios';

export default function ChatPage({ chat, messages: initialMessages, currentUserId }) {
    const { auth } = usePage().props;

    const [messages, setMessages] = useState(initialMessages || []);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showStartProject, setShowStartProject] = useState(false);
    const { openProfile } = useProfile();
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState(null);
    const [selectedImages, setSelectedImages] = useState([]);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const recordingIntervalRef = useRef(null);

    const openProfileDrawer = (userId) => {
        openProfile(userId);
    };

    const deleteWorkspace = () => {
        if (!chat.workspace) return;
        if (confirm('Are you sure you want to delete this workspace? This will permanently delete all projects, tasks, and data.')) {
            window.axios.delete(`/workspaces/${chat.workspace.id}`)
                .then(response => {
                    if (response.data?.redirect) window.location.href = response.data.redirect;
                    else window.location.reload();
                })
                .catch(error => {
                    let errorMessage = 'Unknown error occurred';
                    if (error.response?.data?.message) errorMessage = error.response.data.message;
                    else if (error.message) errorMessage = error.message;
                    alert('Error deleting workspace: ' + errorMessage);
                });
        }
    };

    const deleteChat = () => {
        if (confirm('Are you sure you want to delete this chat?')) {
            router.delete(route('marketplace.chats.delete', chat.id), {
                onSuccess: (page) => {
                    if (page.props.redirect) window.location.href = page.props.redirect;
                    else router.visit(route('marketplace.chats.index'));
                },
                onError: (errors) => alert('Error deleting chat: ' + (errors.message || 'Unknown error')),
            });
        }
    };

    const isFreelancer = chat.freelancer_id === currentUserId;
    const isOpen = chat.status !== 'closed';
    const otherUser = isFreelancer ? chat.client : chat.freelancer;

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    useEffect(() => {
        if (chat && currentUserId) markMessagesAsRead();
    }, [chat?.id, currentUserId]);

    const markMessagesAsRead = async () => {
        try {
            await axios.post(route('marketplace.chats.mark-read', chat.id));
            window.dispatchEvent(new CustomEvent('messagesRead', { detail: { chatId: chat.id, chatType: 'pre_project', unreadCount: 0 } }));
        } catch (error) { /* silently fail */ }
    };

    useEffect(() => {
        return () => selectedImages.forEach(img => { if (img.preview) URL.revokeObjectURL(img.preview); });
    }, [selectedImages]);

    useEffect(() => {
        return () => {
            if (isRecording && mediaRecorderRef.current) mediaRecorderRef.current.stop();
            if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
        };
    }, [isRecording]);

    const sendMessage = async () => {
        const body = newMessage.trim();
        if (!body || sending) return;
        setSending(true);
        setNewMessage('');
        try {
            const { data } = await axios.post(route('marketplace.chats.message', chat.id), { body });
            setMessages(prev => [...prev, data]);
        } catch (err) {
            setNewMessage(body);
        } finally {
            setSending(false);
        }
    };

    const uploadFile = async (file) => {
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        try {
            const { data } = await axios.post(route('marketplace.chats.upload', chat.id), formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            setMessages(prev => [...prev, data]);
        } catch (err) { /* silently fail */ }
        finally { setUploading(false); }
    };

    const handleImageSelect = async (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        const imageFiles = files.filter(file => file.type?.startsWith('image/'));
        const nonImageFiles = files.filter(file => !file.type?.startsWith('image/'));
        for (const file of nonImageFiles) await uploadFile(file);
        if (imageFiles.length > 0) {
            const newImages = imageFiles.map(file => ({ file, preview: URL.createObjectURL(file) }));
            setSelectedImages(prev => [...prev, ...newImages]);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSendImages = async () => {
        if (selectedImages.length === 0 || uploading) return;
        setUploading(true);
        const formData = new FormData();
        selectedImages.forEach((img) => formData.append(`images[]`, img.file));
        try {
            const { data } = await axios.post(route('marketplace.chats.upload-multiple', chat.id), formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            if (Array.isArray(data)) setMessages(prev => [...prev, ...data]);
            else setMessages(prev => [...prev, data]);
        } catch (err) { /* silently fail */ }
        finally {
            setUploading(false);
            selectedImages.forEach(img => { if (img.preview) URL.revokeObjectURL(img.preview); });
            setSelectedImages([]);
        }
    };

    const handleRemoveSelectedImage = (indexToRemove) => {
        setSelectedImages(prev => {
            const removedImage = prev[indexToRemove];
            if (removedImage?.preview) URL.revokeObjectURL(removedImage.preview);
            return prev.filter((_, index) => index !== indexToRemove);
        });
    };

    const handleRemoveAllImages = () => {
        selectedImages.forEach(img => { if (img.preview) URL.revokeObjectURL(img.preview); });
        setSelectedImages([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            const audioChunks = [];
            mediaRecorder.ondataavailable = (event) => audioChunks.push(event.data);
            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunks, { type: 'audio/webm' });
                setAudioBlob(blob);
                stream.getTracks().forEach(track => track.stop());
            };
            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            recordingIntervalRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
        } catch (err) { alert('Could not access microphone. Please check your permissions.'); }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
        }
    };

    const sendVoiceMessage = async () => {
        if (!audioBlob) return;
        setSending(true);
        const formData = new FormData();
        formData.append('voice', audioBlob, `voice_${Date.now()}.webm`);
        try {
            const { data } = await axios.post(route('marketplace.chats.voice', chat.id), formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            setMessages(prev => [...prev, data]);
            setAudioBlob(null);
            setRecordingTime(0);
        } catch (err) { /* silently fail */ }
        finally { setSending(false); }
    };

    const cancelRecording = () => { setAudioBlob(null); setRecordingTime(0); };
    const formatTime = (seconds) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;

    const requestProject = () => {
        router.post(route('marketplace.chats.request', chat.id), {}, {
            preserveScroll: true,
            onSuccess: () => {
                // Flash message will handle notification
            }
        });
    };

    const approveProject = () => {
        router.post(route('marketplace.chats.approve', chat.id), {}, {
            preserveScroll: true,
        });
    };

    const rejectProject = () => {
        router.post(route('marketplace.chats.reject', chat.id), {}, {
            preserveScroll: true,
        });
    };

    const projectRequest = chat.project_request;

    return (
        <MarketplaceLayout>
            <Head title={`Chat with ${otherUser?.name}`} />

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 140px)' }}>
                    {/* Chat Header */}
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E2E8F0] bg-white">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => router.visit(route('marketplace.chats.index'))}
                                className="p-1.5 rounded-lg hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A] transition-colors"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                            <div
                                className="h-10 w-10 rounded-full bg-[#4F46E5] flex items-center justify-center text-white font-semibold flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-[rgba(79,70,229,0.3)] transition-all overflow-hidden"
                                onClick={() => openProfileDrawer(otherUser.id)}
                            >
                                {otherUser?.avatar_url ? (
                                    <img src={`${otherUser.avatar_url}?t=${Date.now()}`} alt={otherUser.name} className="h-10 w-10 rounded-full object-cover" />
                                ) : (
                                    otherUser?.name?.charAt(0)?.toUpperCase() || '?'
                                )}
                            </div>
                            <div>
                                <h2 className="font-semibold text-[#0F172A] text-sm">{otherUser?.name}</h2>
                                <p className="text-xs text-[#64748B]">
                                    {isFreelancer
                                        ? (otherUser?.job_title || chat.client?.client_profile?.company_name || 'Client')
                                        : (otherUser?.job_title || chat.freelancer?.freelancer_profile?.title || 'Freelancer')
                                    }
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {isFreelancer && isOpen && chat.status !== 'converted_to_workspace' && (
                                <>
                                    {(!projectRequest || projectRequest.status === 'rejected') && (
                                        <Button
                                            onClick={requestProject}
                                            className="bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl text-sm h-9 px-4"
                                        >
                                            <Rocket className="h-4 w-4 mr-1.5" />Request to Start Project
                                        </Button>
                                    )}
                                    {projectRequest?.status === 'approved' && (
                                        <Button
                                            onClick={() => setShowStartProject(true)}
                                            className="bg-[#14B8A6] hover:bg-[#0D9488] text-white rounded-xl text-sm h-9 px-4"
                                        >
                                            <Rocket className="h-4 w-4 mr-1.5" />Start Project
                                        </Button>
                                    )}
                                </>
                            )}

                            {!isFreelancer && isOpen && projectRequest?.status === 'pending' && (
                                <div className="flex items-center gap-2">
                                    <Button
                                        onClick={approveProject}
                                        className="bg-[#14B8A6] hover:bg-[#0D9488] text-white rounded-xl text-sm h-9 px-4"
                                    >
                                        Approve
                                    </Button>
                                    <Button
                                        onClick={rejectProject}
                                        variant="outline"
                                        className="border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-sm h-9 px-4"
                                    >
                                        Reject
                                    </Button>
                                </div>
                            )}

                            <button
                                onClick={deleteChat}
                                className="p-2 rounded-xl text-[#94A3B8] hover:text-red-500 hover:bg-red-50 transition-colors"
                                title="Delete conversation"
                            >
                                <Trash2 className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Status Banners */}
                    {projectRequest?.status === 'pending' && (
                        <div className="px-5 py-2.5 text-sm font-medium flex items-center gap-2 bg-amber-50 text-amber-700 border-b border-amber-100">
                            <Rocket className="h-4 w-4" />
                            {isFreelancer
                                ? "Project request sent. Waiting for client approval..."
                                : "Freelancer has requested to start a project. Please approve or reject above."
                            }
                        </div>
                    )}

                    {projectRequest?.status === 'approved' && chat.status !== 'converted_to_workspace' && (
                        <div className="px-5 py-2.5 text-sm font-medium flex items-center gap-2 bg-emerald-50 text-emerald-700 border-b border-emerald-100">
                            <Rocket className="h-4 w-4" />
                            {isFreelancer
                                ? "Project approved! You can now click 'Start Project' to create the workspace."
                                : "You approved the project. Freelancer can now set up the workspace."
                            }
                        </div>
                    )}

                    {projectRequest?.status === 'rejected' && (
                        <div className="px-5 py-2.5 text-sm font-medium flex items-center gap-2 bg-red-50 text-red-700 border-b border-red-100">
                            <Rocket className="h-4 w-4" />
                            {isFreelancer
                                ? "Your project request was rejected by the client."
                                : "You rejected the project request."
                            }
                        </div>
                    )}

                    {chat.status === 'converted_to_workspace' && (
                        <div className="px-5 py-2.5 text-sm font-medium flex items-center gap-2 bg-indigo-50 text-indigo-700 border-b border-indigo-100">
                            <Rocket className="h-4 w-4" />
                            Workspace created! You can continue chatting here or work in the workspace.
                            <div className="ml-auto flex items-center gap-3">
                                {chat.workspace?.owner_id === auth?.user?.id && (
                                    <button
                                        onClick={deleteWorkspace}
                                        className="text-red-600 hover:text-red-700 font-medium text-xs flex items-center gap-1 hover:bg-red-100 px-2 py-1 rounded transition-colors"
                                        title="Delete workspace"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                        Delete Workspace
                                    </button>
                                )}
                                <button
                                    onClick={() => router.visit(route('dashboard'))}
                                    className="text-indigo-600 hover:text-indigo-700 font-semibold text-xs underline"
                                >
                                    Go to Workspace
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-5 py-4 bg-[#F8FAFC]">
                        {messages.length === 0 ? (
                            <div className="text-center py-16">
                                <p className="text-sm text-[#64748B]">No messages yet. Start the conversation!</p>
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
                    {isOpen ? (
                        <div className="px-5 py-3.5 border-t border-[#E2E8F0] bg-white">
                            {selectedImages.length > 0 && (
                                <div className="mb-3 rounded-xl border border-[#E2E8F0] p-3 bg-[#F8FAFC]">
                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                        {selectedImages.map((img, index) => (
                                            <div key={index} className="relative group">
                                                <img src={img.preview} alt={img.file.name} className="w-full h-32 object-cover rounded-lg" />
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveSelectedImage(index)}
                                                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button type="button" onClick={handleSendImages} disabled={uploading || sending || isRecording} className="h-9 px-4 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-white">
                                            {uploading ? `Sending ${selectedImages.length}...` : `Send ${selectedImages.length} ${selectedImages.length === 1 ? 'image' : 'images'}`}
                                        </Button>
                                        <Button type="button" variant="outline" onClick={handleRemoveAllImages} disabled={uploading || sending} className="h-9 px-4 rounded-lg border-[#E2E8F0]">
                                            Remove All
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Voice Recording Preview */}
                            {audioBlob && !isRecording && (
                                <div className="mb-3 p-3 bg-indigo-50 rounded-xl border border-indigo-200">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-[#4F46E5] rounded-full flex items-center justify-center">
                                                <Mic className="h-4 w-4 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-indigo-900">Voice Message</p>
                                                <p className="text-xs text-indigo-600">Duration: {formatTime(recordingTime)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={sendVoiceMessage} disabled={sending} className="px-3 py-1.5 bg-[#4F46E5] text-white text-sm rounded-lg hover:bg-[#4338CA] disabled:opacity-50 transition-colors">
                                                {sending ? 'Sending...' : 'Send'}
                                            </button>
                                            <button onClick={cancelRecording} className="p-1.5 text-[#94A3B8] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Recording Indicator */}
                            {isRecording && (
                                <div className="mb-3 p-3 bg-red-50 rounded-xl border border-red-200">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center animate-pulse">
                                                <Mic className="h-4 w-4 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-red-900">Recording...</p>
                                                <p className="text-xs text-red-600">{formatTime(recordingTime)}</p>
                                            </div>
                                        </div>
                                        <button onClick={stopRecording} className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                                            <Square className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-2">
                                <input type="file" ref={fileInputRef} onChange={handleImageSelect} className="hidden" multiple accept="image/*" />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading || isRecording || selectedImages.length > 0}
                                    className="p-2.5 rounded-xl text-[#94A3B8] hover:text-[#4F46E5] hover:bg-[rgba(79,70,229,0.08)] transition-colors disabled:opacity-50"
                                >
                                    <Paperclip className="h-5 w-5" />
                                </button>
                                {!isRecording && !audioBlob && (
                                    <button
                                        type="button"
                                        onClick={startRecording}
                                        disabled={sending || uploading}
                                        className="p-2.5 rounded-xl text-[#94A3B8] hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                                        title="Record voice message"
                                    >
                                        <Mic className="h-5 w-5" />
                                    </button>
                                )}
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                                    placeholder="Type a message..."
                                    className="flex-1 h-11 px-4 rounded-xl border border-[#E2E8F0] bg-white text-sm focus:border-[#4F46E5] focus:ring-2 focus:ring-[rgba(79,70,229,0.1)] transition-all outline-none text-[#0F172A] placeholder-[#94A3B8]"
                                    disabled={sending || isRecording || uploading}
                                />
                                <Button
                                    onClick={sendMessage}
                                    disabled={!newMessage.trim() || sending || isRecording}
                                    className="h-11 w-11 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] p-0"
                                >
                                    <Send className="h-4.5 w-4.5" />
                                </Button>
                            </div>
                            {uploading && <p className="text-xs text-[#4F46E5] mt-1.5 ml-12">Uploading file...</p>}
                        </div>
                    ) : (
                        <div className="px-5 py-4 border-t border-[#E2E8F0] bg-[#F8FAFC] text-center">
                            <Lock className="h-8 w-8 text-[#94A3B8] mx-auto mb-2" />
                            <p className="text-sm text-[#64748B]">This conversation has been closed.</p>
                        </div>
                    )}
                </div>
            </div>

            {showStartProject && (
                <StartProjectModal
                    chatId={chat.id}
                    clientName={chat.client?.name}
                    onClose={() => setShowStartProject(false)}
                />
            )}

        </MarketplaceLayout>
    );
}
