import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Sparkles, Mic, MicOff, Paperclip, AtSign, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useWorkspace } from '@/Context/WorkspaceContext';
import axios from 'axios';

export default function AiChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    // Load chat history from localStorage on component mount
    const savedHistory = localStorage.getItem('aiChatHistory');
    if (savedHistory) {
      const parsed = JSON.parse(savedHistory);
      // Convert timestamp strings back to Date objects
      return parsed.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
    }
    return [
      {
        role: 'assistant',
        content: 'Hi! I\'m your AI assistant. I can help you with tasks, projects, and answer questions about the system. How can I help you today?',
        timestamp: new Date(),
      }
    ];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const { userRole } = useWorkspace();

  useEffect(() => {
    // Save chat history to localStorage on component update
    localStorage.setItem('aiChatHistory', JSON.stringify(messages));
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const clearChatHistory = () => {
    const defaultMessage = {
      role: 'assistant',
      content: 'Hi! I\'m your AI assistant. I can help you with tasks, projects, and answer questions about the system. How can I help you today?',
      timestamp: new Date(),
    };
    setMessages([defaultMessage]);
    localStorage.setItem('aiChatHistory', JSON.stringify([defaultMessage]));
  };

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + ' ' + transcript);
        setIsRecording(false);
      };

      recognitionRef.current.onerror = () => {
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    let messageContent = input.trim();
    
    // Add file context if uploaded
    if (uploadedFile) {
      messageContent += `\n\n[Attached file: ${uploadedFile.name}]`;
    }

    const userMessage = {
      role: 'user',
      content: messageContent,
      timestamp: new Date(),
      file: uploadedFile,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setUploadedFile(null);
    setIsLoading(true);

    try {
      // Refresh CSRF token before AI request
      await axios.get('/sanctum/csrf-cookie');

      const response = await axios.post('/marketplace/api/ai/chat', {
        message: input.trim(),
        conversation_history: messages.slice(-10), // Send last 10 messages for context
      });

      // Simple response handling - Laravel returns clean text
      const assistantMessage = {
        role: 'assistant',
        content: response.data.message,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI Chat Error:', error);
      console.error('Error details:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      let errorContent = 'Sorry, I encountered an error. Please try again.';
      
      if (error.response?.data?.message) {
        errorContent = error.response.data.message;
        
        // Handle CSRF token mismatch specifically
        if (error.response.data.message.includes('CSRF token mismatch')) {
          errorContent = 'Session expired. Please refresh the page and try again.';
        }
      } else if (error.message) {
        errorContent = `Error: ${error.message}`;
      }
      
      const errorMessage = {
        role: 'assistant',
        content: errorContent,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickQuestions = [
    "How do I create a task?",
    "How do I assign a task?",
    "What are the user roles?",
    "How do I add comments?",
  ];

  const handleQuickQuestion = (question) => {
    setInput(question);
  };

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Voice input is not supported in your browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Limit file size to 5MB
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      setUploadedFile(file);
      setInput(prev => prev + ` [File: ${file.name}] `);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);
    
    // Check for @ mention trigger
    const lastChar = value.slice(-1);
    if (lastChar === '@') {
      setShowMentions(true);
    } else if (showMentions && (lastChar === ' ' || value.length === 0)) {
      setShowMentions(false);
    }
  };

  const insertMention = (name) => {
    setInput(prev => prev + name + ' ');
    setShowMentions(false);
  };

  const teamMembers = [
    { name: 'Admin', role: 'Admin' },
    { name: 'Team Member', role: 'Member' },
    { name: 'Support', role: 'Support' },
  ];

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all z-50 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-20 right-6 w-[380px] h-[600px] shadow-2xl z-50 flex flex-col border-2 border-slate-700">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-violet-600 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">AI Assistant</h3>
                <p className="text-xs text-blue-100">Always here to help</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={clearChatHistory}
                className="h-8 w-8 text-white hover:bg-white/20"
                title="Clear chat history"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-800">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-2 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <Avatar className="h-7 w-7 flex-shrink-0">
                    <AvatarFallback className={message.role === 'user' ? 'bg-blue-600 text-white text-xs' : 'bg-gradient-to-br from-violet-500 to-blue-500 text-white text-xs'}>
                      {message.role === 'user' ? 'U' : 'AI'}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`rounded-lg px-3 py-2 text-sm ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 border border-slate-600 text-gray-200'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    {message.file && (
                      <div className="mt-1 text-[10px] flex items-center gap-1 opacity-75">
                        <Paperclip className="h-2.5 w-2.5" />
                        {message.file.name}
                      </div>
                    )}
                    <span className={`text-[10px] mt-1 block ${message.role === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                      {message.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-2 max-w-[85%]">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-gradient-to-br from-violet-500 to-blue-500 text-white text-xs">
                      AI
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-white border border-gray-200 rounded-lg px-3 py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.length === 1 && (
            <div className="px-4 py-2 border-t border-slate-700 bg-slate-800">
              <p className="text-xs text-gray-500 mb-2">Quick questions:</p>
              <div className="flex flex-wrap gap-1">
                {quickQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => handleQuickQuestion(question)}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="px-4 py-2 border-t border-slate-700 bg-slate-800 rounded-b-lg">
            {uploadedFile && (
              <div className="mb-2 flex items-center gap-2 text-xs bg-slate-700 p-2 rounded">
                <Paperclip className="h-3 w-3 text-blue-600" />
                <span className="flex-1 truncate">{uploadedFile.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0"
                  onClick={() => setUploadedFile(null)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
            
            {showMentions && (
              <div className="mb-2 bg-slate-800 border border-slate-700 rounded-lg shadow-lg max-h-32 overflow-y-auto">
                {teamMembers.map((member, idx) => (
                  <button
                    key={idx}
                    className="w-full px-3 py-2 text-left text-xs hover:bg-slate-700 flex items-center gap-2"
                    onClick={() => insertMention(member.name)}
                  >
                    <AtSign className="h-3 w-3 text-gray-400" />
                    <div>
                      <div className="font-medium">{member.name}</div>
                      <div className="text-[10px] text-gray-500">{member.role}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            <div className="flex gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
              />
              
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                title="Attach file"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className={`h-9 w-9 ${isRecording ? 'text-red-600 bg-red-50' : ''}`}
                onClick={toggleVoiceInput}
                disabled={isLoading}
                title={isRecording ? 'Stop recording' : 'Voice input'}
              >
                {isRecording ? (
                  <MicOff className="h-4 w-4 animate-pulse" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
              
              <Input
                value={input}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything... (Type @ to mention)"
                className="flex-1 text-sm"
                disabled={isLoading}
              />
              
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="h-9 w-9 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}
