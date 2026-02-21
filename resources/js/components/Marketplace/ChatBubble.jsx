import { Download, FileText, Play } from 'lucide-react';
import ImagePreview from './ImagePreview';
import UserProfileLink from '../UserProfileLink';

export default function ChatBubble({ message, isOwn }) {
    const isFile = message.type === 'file';
    const isVoice = message.type === 'voice';
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
    const fileExt = (message.file_path || message.file_name || '').split('.').pop()?.toLowerCase();
    const isImageMessage =
        message.type === 'image' ||
        message.attachment_type === 'image' ||
        (isFile && !!fileExt && imageExtensions.includes(fileExt));

    // Debug: Log image detection
    if (isFile) {
        console.log('🔍 File message detection:', {
            type: message.type,
            attachment_type: message.attachment_type,
            fileExt,
            isImageMessage,
            file_path: message.file_path
        });
    }
    const bubbleClass = isImageMessage
        ? 'p-0 bg-transparent border-0 shadow-none'
        : `${isOwn ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-br-md' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md shadow-sm'} px-4 py-2.5`;

    return (
        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}>
            <div className={`flex items-end gap-2 max-w-[75%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                {/* Avatar */}
                <UserProfileLink userId={message.sender?.id}>
                    <div
                        className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-indigo-300 transition-all ${isOwn ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white' : 'bg-gray-200 text-gray-600'}`}
                    >
                        {message.sender?.avatar_url ? (
                            <img src={`${message.sender.avatar_url}?t=${Date.now()}`} alt={message.sender.name} className="h-7 w-7 rounded-full object-cover" />
                        ) : (
                            message.sender?.name?.charAt(0)?.toUpperCase() || 'U'
                        )}
                    </div>
                </UserProfileLink>

                {/* Bubble */}
                <div>
                    <div className={`rounded-2xl text-sm ${bubbleClass}`}>
                        {isImageMessage ? (
                            <ImagePreview
                                src={`/storage/${message.file_path}`}
                                fileName={message.file_name || 'image'}
                            />
                        ) : isFile ? (
                            <a
                                href={`/storage/${message.file_path}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center gap-2 ${isOwn ? 'text-white hover:text-indigo-100' : 'text-indigo-600 hover:text-indigo-700'}`}
                            >
                                <FileText className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate">{message.file_name || message.body}</span>
                                <Download className="h-3.5 w-3.5 flex-shrink-0" />
                            </a>
                        ) : isVoice ? (
                            <div className="flex items-center gap-3">
                                <audio
                                    controls
                                    className="h-8 max-w-[200px]"
                                    preload="metadata"
                                >
                                    <source src={`/storage/${message.file_path}`} type="audio/webm" />
                                    <source src={`/storage/${message.file_path}`} type="audio/ogg" />
                                    <source src={`/storage/${message.file_path}`} type="audio/mp3" />
                                    <source src={`/storage/${message.file_path}`} type="audio/wav" />
                                    Your browser does not support the audio element.
                                </audio>
                                <div className={`flex items-center gap-1 ${isOwn ? 'text-white/80' : 'text-gray-500'}`}>
                                    <Play className="h-3 w-3" />
                                    <span className="text-xs">Voice</span>
                                </div>
                            </div>
                        ) : (
                            <p className="whitespace-pre-wrap">{message.body}</p>
                        )}
                    </div>
                    <p className={`text-[10px] text-gray-400 mt-1 ${isOwn ? 'text-right' : ''}`}>
                        {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
            </div>
        </div>
    );
}
