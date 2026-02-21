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
    const saved = localStorage.getItem('aiChatHistory');
    if (saved) { const parsed = JSON.parse(saved); return parsed.map(m => ({ ...m, timestamp: new Date(m.timestamp) })); }
    return [{ role: 'assistant', content: 'Hi! I\'m your AI assistant. I can help you with tasks, projects, and answer questions about the system. How can I help you today?', timestamp: new Date() }];
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

  useEffect(() => { localStorage.setItem('aiChatHistory', JSON.stringify(messages)); }, [messages]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const clearChatHistory = () => {
    const def = { role: 'assistant', content: 'Hi! I\'m your AI assistant. I can help you with tasks, projects, and answer questions about the system. How can I help you today?', timestamp: new Date() };
    setMessages([def]); localStorage.setItem('aiChatHistory', JSON.stringify([def]));
  };

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SR();
      recognitionRef.current.continuous = false; recognitionRef.current.interimResults = false; recognitionRef.current.lang = 'en-US';
      recognitionRef.current.onresult = (e) => { setInput(p => p + ' ' + e.results[0][0].transcript); setIsRecording(false); };
      recognitionRef.current.onerror = () => setIsRecording(false);
      recognitionRef.current.onend = () => setIsRecording(false);
    }
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    let content = input.trim();
    if (uploadedFile) content += `\n\n[Attached file: ${uploadedFile.name}]`;
    setMessages(p => [...p, { role: 'user', content, timestamp: new Date(), file: uploadedFile }]);
    setInput(''); setUploadedFile(null); setIsLoading(true);
    try {
      await axios.get('/sanctum/csrf-cookie');
      const res = await axios.post('/marketplace/api/ai/chat', { message: input.trim(), conversation_history: messages.slice(-10) });
      setMessages(p => [...p, { role: 'assistant', content: res.data.message, timestamp: new Date() }]);
    } catch (error) {
      let msg = 'Sorry, I encountered an error. Please try again.';
      if (error.response?.data?.message) { msg = error.response.data.message; if (msg.includes('CSRF token mismatch')) msg = 'Session expired. Please refresh.'; }
      else if (error.message) msg = `Error: ${error.message}`;
      setMessages(p => [...p, { role: 'assistant', content: msg, timestamp: new Date() }]);
    } finally { setIsLoading(false); }
  };

  const handleKeyPress = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };
  const quickQuestions = ["How do I create a task?", "How do I assign a task?", "What are the user roles?", "How do I add comments?"];
  const toggleVoiceInput = () => {
    if (!recognitionRef.current) { alert('Voice input not supported in your browser.'); return; }
    if (isRecording) { recognitionRef.current.stop(); setIsRecording(false); } else { recognitionRef.current.start(); setIsRecording(true); }
  };
  const handleFileUpload = (e) => { const f = e.target.files[0]; if (f) { if (f.size > 5 * 1024 * 1024) { alert('File must be < 5MB'); return; } setUploadedFile(f); setInput(p => p + ` [File: ${f.name}] `); } };
  const handleInputChange = (e) => { const v = e.target.value; setInput(v); if (v.slice(-1) === '@') setShowMentions(true); else if (showMentions && (v.slice(-1) === ' ' || !v.length)) setShowMentions(false); };
  const insertMention = (name) => { setInput(p => p + name + ' '); setShowMentions(false); };
  const teamMembers = [{ name: 'Admin', role: 'Admin' }, { name: 'Team Member', role: 'Member' }, { name: 'Support', role: 'Support' }];

  return (
    <>
      {!isOpen && (
        <Button onClick={() => setIsOpen(true)} className="fixed bottom-20 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all z-50 bg-[#4F46E5] hover:bg-[#4338CA]" size="icon">
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {isOpen && (
        <Card className="fixed bottom-20 right-6 w-[380px] h-[600px] shadow-xl z-50 flex flex-col border border-[#E2E8F0] bg-white">
          {/* Header */}
          <div className="bg-[#4F46E5] text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center"><Sparkles className="h-4 w-4" /></div>
              <div><h3 className="font-semibold text-sm">AI Assistant</h3><p className="text-xs text-indigo-200">Always here to help</p></div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={clearChatHistory} className="h-8 w-8 text-white hover:bg-white/20" title="Clear chat"><Trash2 className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 text-white hover:bg-white/20"><X className="h-4 w-4" /></Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F8FAFC]">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <Avatar className="h-7 w-7 flex-shrink-0">
                    <AvatarFallback className={msg.role === 'user' ? 'bg-[#4F46E5] text-white text-xs' : 'bg-indigo-100 text-[#4F46E5] text-xs'}>
                      {msg.role === 'user' ? 'U' : 'AI'}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`rounded-lg px-3 py-2 text-sm ${msg.role === 'user' ? 'bg-[#4F46E5] text-white' : 'bg-white border border-[#E2E8F0] text-[#0F172A]'}`}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    {msg.file && <div className="mt-1 text-[10px] flex items-center gap-1 opacity-75"><Paperclip className="h-2.5 w-2.5" />{msg.file.name}</div>}
                    <span className={`text-[10px] mt-1 block ${msg.role === 'user' ? 'text-indigo-200' : 'text-[#94A3B8]'}`}>
                      {msg.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-2 max-w-[85%]">
                  <Avatar className="h-7 w-7"><AvatarFallback className="bg-indigo-100 text-[#4F46E5] text-xs">AI</AvatarFallback></Avatar>
                  <div className="bg-white border border-[#E2E8F0] rounded-lg px-3 py-2"><Loader2 className="h-4 w-4 animate-spin text-[#94A3B8]" /></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.length === 1 && (
            <div className="px-4 py-2 border-t border-[#E2E8F0] bg-white">
              <p className="text-xs text-[#94A3B8] mb-2">Quick questions:</p>
              <div className="flex flex-wrap gap-1">
                {quickQuestions.map((q, i) => <Button key={i} variant="outline" size="sm" className="h-7 text-xs border-[#E2E8F0] text-[#64748B]" onClick={() => setInput(q)}>{q}</Button>)}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="px-4 py-2 border-t border-[#E2E8F0] bg-white rounded-b-lg">
            {uploadedFile && (
              <div className="mb-2 flex items-center gap-2 text-xs bg-[#F8FAFC] p-2 rounded border border-[#E2E8F0]">
                <Paperclip className="h-3 w-3 text-[#4F46E5]" /><span className="flex-1 truncate text-[#64748B]">{uploadedFile.name}</span>
                <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => setUploadedFile(null)}><X className="h-3 w-3" /></Button>
              </div>
            )}
            {showMentions && (
              <div className="mb-2 bg-white border border-[#E2E8F0] rounded-lg shadow-lg max-h-32 overflow-y-auto">
                {teamMembers.map((m, i) => (
                  <button key={i} className="w-full px-3 py-2 text-left text-xs hover:bg-[#F8FAFC] flex items-center gap-2" onClick={() => insertMention(m.name)}>
                    <AtSign className="h-3 w-3 text-[#94A3B8]" /><div><div className="font-medium text-[#0F172A]">{m.name}</div><div className="text-[10px] text-[#94A3B8]">{m.role}</div></div>
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg" />
              <Button variant="ghost" size="icon" className="h-9 w-9 text-[#94A3B8]" onClick={() => fileInputRef.current?.click()} disabled={isLoading} title="Attach file"><Paperclip className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className={`h-9 w-9 ${isRecording ? 'text-red-500 bg-red-50' : 'text-[#94A3B8]'}`} onClick={toggleVoiceInput} disabled={isLoading}>
                {isRecording ? <MicOff className="h-4 w-4 animate-pulse" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Input value={input} onChange={handleInputChange} onKeyPress={handleKeyPress} placeholder="Ask me anything..." className="flex-1 text-sm border-[#E2E8F0] text-[#0F172A]" disabled={isLoading} />
              <Button onClick={handleSend} disabled={!input.trim() || isLoading} size="icon" className="h-9 w-9 bg-[#4F46E5] hover:bg-[#4338CA]">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}
