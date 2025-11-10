'use client';

import { useState, useRef, useEffect } from 'react';
import { useLang } from '@/lib/useLang';
import { useTranslation } from '@/lib/translation';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  mode?: 'ai' | 'fallback';
}

export default function TravelAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [lang] = useLang();
  const t = useTranslation();

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current && isOpen) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: lang === 'fr' 
          ? "👋 Salut ! Je suis ton assistant voyage TripFlow propulsé par Google Gemini.\n\n✈️ Je peux t'aider à :\n• Planifier des voyages incroyables\n• Recommander des destinations\n• Créer des itinéraires détaillés\n• Conseiller sur le budget\n• Suggérer des hébergements\n• Et bien plus encore !\n\nQuelle est ta prochaine aventure ?"
          : "👋 Hi! I'm your TripFlow AI assistant powered by Google Gemini.\n\n✈️ I can help you:\n• Plan amazing trips\n• Recommend destinations\n• Create detailed itineraries\n• Advise on budgets\n• Suggest accommodations\n• And much more!\n\nWhat's your next adventure?",
        timestamp: new Date(),
        mode: 'ai'
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Get user context
      const userContext = {
        userName: '', // You can add from profile if needed
        currentPage: window.location.pathname,
        language: lang
      };

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory: messages.slice(-6).map(m => ({
            role: m.role,
            content: m.content
          })),
          userContext
        })
      });

      const data = await response.json();

      if (data.success && data.response) {
        const assistantMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          mode: data.mode || 'ai'
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: lang === 'fr'
          ? "❌ Désolé, j'ai rencontré une erreur. Peux-tu réessayer ?"
          : "❌ Sorry, I encountered an error. Can you try again?",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([{
      id: 'welcome-new',
      role: 'assistant',
      content: lang === 'fr'
        ? "💬 Conversation effacée ! Comment puis-je t'aider ?"
        : "💬 Chat cleared! How can I help you?",
      timestamp: new Date()
    }]);
  };

  const quickActions = [
    { icon: '🏖️', label: lang === 'fr' ? 'Recommande une destination' : 'Recommend a destination', prompt: 'Can you recommend a good travel destination for me?' },
    { icon: '💰', label: lang === 'fr' ? 'Conseils budget' : 'Budget tips', prompt: 'What are some budget travel tips?' },
    { icon: '🎒', label: lang === 'fr' ? 'Liste de bagages' : 'Packing list', prompt: 'What should I pack for my trip?' },
    { icon: '🌐', label: lang === 'fr' ? 'Aide traduction' : 'Translation help', prompt: 'How can you help me with translations?' },
  ];

  const sendQuickAction = (prompt: string) => {
    setInputMessage(prompt);
    setTimeout(() => {
      sendMessage();
    }, 100);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all group animate-float"
        style={{
          background: 'linear-gradient(135deg, #29D1FF, #2EA7D9)',
          boxShadow: '0 12px 40px rgba(41, 209, 255, 0.4)'
        }}
        aria-label="Open AI Travel Assistant"
      >
        <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
      </button>
    );
  }

  return (
    <div 
      className={`fixed z-50 transition-all ${
        isMinimized 
          ? 'bottom-6 right-6 w-80 h-16' 
          : 'bottom-6 right-6 w-[420px] h-[600px] max-h-[80vh]'
      }`}
      style={{
        background: 'var(--surface)',
        border: '1.5px solid rgba(41, 209, 255, 0.3)',
        borderRadius: '24px',
        boxShadow: '0 24px 80px rgba(41, 209, 255, 0.25)',
        backdropFilter: 'blur(20px)'
      }}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between px-5 py-4 rounded-t-[23px]"
        style={{
          background: 'linear-gradient(135deg, #29D1FF, #2EA7D9)',
          borderBottom: '1.5px solid rgba(255, 255, 255, 0.2)'
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-sm">TripFlow AI</h3>
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[10px] font-bold text-white/90">Gemini</span>
              </div>
            </div>
            <p className="text-xs text-white/80">{lang === 'fr' ? 'Assistant Voyage' : 'Travel Assistant'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center"
            aria-label={isMinimized ? 'Maximize' : 'Minimize'}
          >
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              {isMinimized ? (
                <path d="M4 14h6m0 0v6m0-6l-7 7m17-11h-6m0 0V4m0 6l7-7"/>
              ) : (
                <path d="M5 12h14"/>
              )}
            </svg>
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center"
            aria-label="Close"
          >
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ height: 'calc(100% - 140px)' }}>
            {/* Quick Actions - Show only when no conversation */}
            {messages.length <= 1 && !isLoading && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                {quickActions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendQuickAction(action.prompt)}
                    className="flex items-center gap-2 p-3 rounded-xl hover:scale-105 transition-all text-left"
                    style={{
                      background: 'rgba(var(--surface-rgb), 0.6)',
                      border: '1px solid rgba(41, 209, 255, 0.2)'
                    }}
                  >
                    <span className="text-xl">{action.icon}</span>
                    <span className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>
                      {action.label}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'rounded-br-sm text-white'
                      : 'rounded-bl-sm'
                  }`}
                  style={{
                    background: msg.role === 'user'
                      ? 'linear-gradient(135deg, #29D1FF, #2EA7D9)'
                      : 'rgba(var(--surface-rgb), 0.6)',
                    border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
                    color: msg.role === 'user' ? 'white' : 'var(--foreground)'
                  }}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  <p className={`text-xs mt-1.5 ${msg.role === 'user' ? 'text-white/70' : 'opacity-50'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div
                  className="rounded-2xl rounded-bl-sm px-4 py-3"
                  style={{
                    background: 'rgba(var(--surface-rgb), 0.6)',
                    border: '1px solid var(--border)'
                  }}
                >
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#29D1FF] to-[#2EA7D9] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#29D1FF] to-[#2EA7D9] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#29D1FF] to-[#2EA7D9] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-4 pb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={clearChat}
                className="w-10 h-10 rounded-xl flex items-center justify-center hover:scale-105 transition-transform"
                style={{
                  background: 'rgba(var(--surface-rgb), 0.8)',
                  border: '1px solid var(--border)'
                }}
                aria-label="Clear chat"
                title={lang === 'fr' ? 'Effacer la conversation' : 'Clear chat'}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                </svg>
              </button>
              <div className="flex-1 flex items-center gap-2 rounded-xl px-4 py-2.5" style={{ background: 'var(--background)', border: '1.5px solid var(--border)' }}>
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={lang === 'fr' ? 'Pose ta question...' : 'Ask me anything...'}
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ color: 'var(--foreground)' }}
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:scale-110 transition-transform"
                  style={{
                    background: 'linear-gradient(135deg, #29D1FF, #2EA7D9)'
                  }}
                  aria-label="Send message"
                >
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
