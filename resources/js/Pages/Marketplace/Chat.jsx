import { Head, Link, usePage, router } from '@inertiajs/react';
import { useState, useRef, useEffect } from 'react';
import MarketplaceLayout from '@/Layouts/MarketplaceLayout';
import ChatBubble from '@/Components/Marketplace/ChatBubble';
import StartProjectModal from '@/Components/Marketplace/StartProjectModal';
import ProfileDrawer from '@/Components/Marketplace/ProfileDrawer';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Send, Paperclip, Rocket, Lock, Trash2, Mic, Square, X } from 'lucide-react';
import axios from 'axios';

export default function ChatPage({ chat, messages: initialMessages, currentUserId }) {
    const { auth } = usePage().props;
    
    // Debug chat data
    console.log('🔍 Chat Page Debug - Chat Data:', {
        chat_id: chat?.id,
        client: chat?.client,
        freelancer: chat?.freelancer,
        currentUserId: currentUserId,
        isFreelancer: chat?.freelancer_id === currentUserId
    });
    const [messages, setMessages] = useState(initialMessages || []);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showStartProject, setShowStartProject] = useState(false);
    const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState(null);
    const [selectedImages, setSelectedImages] = useState([]);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const recordingIntervalRef = useRef(null);

    const openProfileDrawer = (userId) => {
        setSelectedUserId(userId);
        setProfileDrawerOpen(true);
    };

    const deleteWorkspace = () => {
        if (!chat.workspace) return;
        
        if (confirm('Are you sure you want to delete this workspace? This will permanently delete all projects, tasks, and data. The chat will be restored to its original state.')) {
            window.axios.delete(`/workspaces/${chat.workspace.id}`)
                .then(response => {
                    // Handle successful deletion with redirect
                    if (response.data && response.data.redirect) {
                        window.location.href = response.data.redirect;
                    } else {
                        // Fallback: reload current page to show updated chat state
                        window.location.reload();
                    }
                })
                .catch(error => {
                    console.error('Error deleting workspace:', error);
                    
                    // Better error message extraction
                    let errorMessage = 'Unknown error occurred';
                    if (error.response) {
                        if (error.response.data && error.response.data.message) {
                            errorMessage = error.response.data.message;
                        } else if (error.response.data && typeof error.response.data === 'string') {
                            errorMessage = error.response.data;
                        } else if (error.response.statusText) {
                            errorMessage = error.response.statusText;
                        }
                    } else if (error.message) {
                        errorMessage = error.message;
                    }
                    
                    alert('Error deleting workspace: ' + errorMessage);
                });
        }
    };

    const isFreelancer = chat.freelancer_id === currentUserId;
    const isOpen = chat.status !== 'closed'; // Allow messaging unless explicitly closed
    const otherUser = isFreelancer ? chat.client : chat.freelancer;

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Mark messages as read immediately when chat is opened
    useEffect(() => {
        if (chat && currentUserId) {
            markMessagesAsRead();
        }
    }, [chat?.id, currentUserId]);

    const markMessagesAsRead = async () => {
        try {
            // Mark unread messages as read in the backend
            await axios.post(route('marketplace.chats.mark-read', chat.id));
            
            // Emit custom event to update chat list
            window.dispatchEvent(new CustomEvent('messagesRead', {
                detail: { chatId: chat.id, unreadCount: 0 }
            }));
        } catch (error) {
            console.error('Failed to mark messages as read:', error);
        }
    };

    useEffect(() => {
        return () => {
            selectedImages.forEach(img => {
                if (img.preview) URL.revokeObjectURL(img.preview);
            });
        };
    }, [selectedImages]);

    // Cleanup recording on unmount
    useEffect(() => {
        return () => {
            if (isRecording && mediaRecorderRef.current) {
                mediaRecorderRef.current.stop();
            }
            if (recordingIntervalRef.current) {
                clearInterval(recordingIntervalRef.current);
            }
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
            console.error('Failed to send message:', err);
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
            const { data } = await axios.post(route('marketplace.chats.upload', chat.id), formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setMessages(prev => [...prev, data]);
        } catch (err) {
            console.error('Failed to upload file:', err);
        } finally {
            setUploading(false);
        }
    };

    const handleImageSelect = async (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        console.log('🔍 Files selected:', files.length);

        const imageFiles = files.filter(file => file.type?.startsWith('image/'));
        const nonImageFiles = files.filter(file => !file.type?.startsWith('image/'));

        // Handle non-image files immediately (keep existing behavior)
        for (const file of nonImageFiles) {
            console.log('🔍 Non-image file, uploading immediately:', file.name);
            await uploadFile(file);
        }

        // Add image files to state for preview
        if (imageFiles.length > 0) {
            console.log('🔍 Images detected, adding to preview:', imageFiles.length);
            const newImages = imageFiles.map(file => ({
                file,
                preview: URL.createObjectURL(file)
            }));
            setSelectedImages(prev => [...prev, ...newImages]);
        }

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSendImages = async () => {
        if (selectedImages.length === 0 || uploading) return;
        
        setUploading(true);
        const formData = new FormData();
        selectedImages.forEach((img, index) => {
            formData.append(`images[]`, img.file);
        });

        try {
            const { data } = await axios.post(route('marketplace.chats.upload-multiple', chat.id), formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            // Assuming backend returns array of created messages
            if (Array.isArray(data)) {
                setMessages(prev => [...prev, ...data]);
            } else {
                setMessages(prev => [...prev, data]);
            }
        } catch (err) {
            console.error('Failed to upload images:', err);
        } finally {
            setUploading(false);
            // Clean up previews
            selectedImages.forEach(img => {
                if (img.preview) URL.revokeObjectURL(img.preview);
            });
            setSelectedImages([]);
        }
    };

    const handleRemoveSelectedImage = (indexToRemove) => {
        setSelectedImages(prev => {
            const newImages = prev.filter((_, index) => index !== indexToRemove);
            // Revoke preview of removed image
            const removedImage = prev[indexToRemove];
            if (removedImage?.preview) {
                URL.revokeObjectURL(removedImage.preview);
            }
            return newImages;
        });
    };

    const handleRemoveAllImages = () => {
        selectedImages.forEach(img => {
            if (img.preview) URL.revokeObjectURL(img.preview);
        });
        setSelectedImages([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Voice recording functions
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            const audioChunks = [];

            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                setAudioBlob(audioBlob);
                
                // Stop all tracks to release microphone
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            // Start recording timer
            recordingIntervalRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (err) {
            console.error('Error accessing microphone:', err);
            alert('Could not access microphone. Please check your permissions.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            
            // Clear recording timer
            if (recordingIntervalRef.current) {
                clearInterval(recordingIntervalRef.current);
            }
        }
    };

    const sendVoiceMessage = async () => {
        if (!audioBlob) return;

        setSending(true);
        const formData = new FormData();
        formData.append('voice', audioBlob, `voice_${Date.now()}.webm`);

        try {
            const { data } = await axios.post(route('marketplace.chats.voice', chat.id), formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setMessages(prev => [...prev, data]);
            setAudioBlob(null);
            setRecordingTime(0);
        } catch (err) {
            console.error('Failed to send voice message:', err);
        } finally {
            setSending(false);
        }
    };

    const cancelRecording = () => {
        setAudioBlob(null);
        setRecordingTime(0);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    
    return (
        <MarketplaceLayout>
            <Head title={`Chat with ${otherUser?.name}`} />

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-sm overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 140px)' }}>
                    {/* Chat Header */}
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-700 bg-slate-900">
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => router.visit(route('marketplace.chats.index'))}
                                className="p-1.5 rounded-lg hover:bg-slate-700 text-gray-400 hover:text-gray-300 transition-colors"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                            {/* Avatar */}
                            <div 
                                className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-indigo-300 transition-all overflow-hidden"
                                onClick={() => {
                                    openProfileDrawer(otherUser.id);
                                }}
                            >
                                {(() => {
                                    console.log('🔍 Chat Debug - Other User Avatar Data:', {
                                        id: otherUser?.id,
                                        name: otherUser?.name,
                                        avatar: otherUser?.avatar,
                                        avatar_url: otherUser?.avatar_url,
                                        usage_type: otherUser?.usage_type
                                    });
                                    return otherUser?.avatar_url ? (
                                        <img src={`${otherUser.avatar_url}?t=${Date.now()}`} alt={otherUser.name} className="h-10 w-10 rounded-full object-cover" />
                                    ) : (
                                        otherUser?.name?.charAt(0)?.toUpperCase() || '?'
                                    );
                                })()}
                            </div>
                            <div>
                                <h2 className="font-semibold text-white text-sm">{otherUser?.name}</h2>
                                <p className="text-xs text-gray-400">
                                    {isFreelancer 
                                        ? (otherUser?.job_title || chat.client?.client_profile?.company_name || 'Client')
                                        : (otherUser?.job_title || chat.freelancer?.freelancer_profile?.title || 'Freelancer')
                                    }
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {isFreelancer && isOpen && chat.status !== 'converted_to_workspace' && (
                                <Button
                                    onClick={() => setShowStartProject(true)}
                                    className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg shadow-emerald-500/30 rounded-xl text-sm h-9 px-4"
                                >
                                    <Rocket className="h-4 w-4 mr-1.5" />Start Project
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Status Banner */}
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
                    <div className="flex-1 overflow-y-auto px-5 py-4 bg-slate-900">
                        {messages.length === 0 ? (
                            <div className="text-center py-16">
                                <p className="text-sm text-gray-300">No messages yet. Start the conversation!</p>
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
                        <div className="px-5 py-3.5 border-t border-slate-700 bg-slate-800">
                            {selectedImages.length > 0 && (
                                <div className="mb-3 rounded-xl border border-slate-600 p-3 bg-slate-700">
                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                        {selectedImages.map((img, index) => (
                                            <div key={index} className="relative group">
                                                <img
                                                    src={img.preview}
                                                    alt={img.file.name}
                                                    className="w-full h-32 object-cover rounded-lg"
                                                />
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
                                        <Button
                                            type="button"
                                            onClick={handleSendImages}
                                            disabled={uploading || sending || isRecording}
                                            className="h-9 px-4 rounded-lg"
                                        >
                                            {uploading ? `Sending ${selectedImages.length}...` : `Send ${selectedImages.length} ${selectedImages.length === 1 ? 'image' : 'images'}`}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleRemoveAllImages}
                                            disabled={uploading || sending}
                                            className="h-9 px-4 rounded-lg"
                                        >
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
                                            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                                                <Mic className="h-4 w-4 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-indigo-900">Voice Message</p>
                                                <p className="text-xs text-indigo-600">Duration: {formatTime(recordingTime)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={sendVoiceMessage}
                                                disabled={sending}
                                                className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                            >
                                                {sending ? 'Sending...' : 'Send'}
                                            </button>
                                            <button
                                                onClick={cancelRecording}
                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
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
                                        <button
                                            onClick={stopRecording}
                                            className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                        >
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
                                    className="p-2.5 rounded-xl text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-50"
                                >
                                    <Paperclip className="h-5 w-5" />
                                </button>
                                
                                {/* Voice Recording Button */}
                                {!isRecording && !audioBlob && (
                                    <button
                                        type="button"
                                        onClick={startRecording}
                                        disabled={sending || uploading}
                                        className="p-2.5 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
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
                                    className="flex-1 h-11 px-4 rounded-xl border border-slate-600 bg-slate-700 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:bg-slate-600 transition-all outline-none text-white placeholder-gray-400"
                                    disabled={sending || isRecording || uploading}
                                />
                                <Button
                                    onClick={sendMessage}
                                    disabled={!newMessage.trim() || sending || isRecording}
                                    className="h-11 w-11 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/30 p-0"
                                >
                                    <Send className="h-4.5 w-4.5" />
                                </Button>
                            </div>
                            {uploading && <p className="text-xs text-indigo-500 mt-1.5 ml-12">Uploading file...</p>}
                        </div>
                    ) : (
                        <div className="px-5 py-4 border-t border-slate-700 bg-slate-800 text-center">
                            <Lock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-300">This conversation has been closed.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Start Project Modal */}
            {showStartProject && (
                <StartProjectModal
                    chatId={chat.id}
                    clientName={chat.client?.name}
                    onClose={() => setShowStartProject(false)}
                />
            )}

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
