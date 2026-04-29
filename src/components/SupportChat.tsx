'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Bot } from 'lucide-react';
import { useAuthStore } from '@/store';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_QUESTIONS = [
  'Come funziona il prezzo?',
  'Posso cancellare la prenotazione?',
  'Quando arriva il mio autista?',
  'Come vengono verificati gli autisti?',
];

function MessageBubble({ content, role }: { content: string; role: 'user' | 'assistant' }) {
  // Splitta su righe vuote per creare paragrafi distinti
  const paragraphs = content.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);

  return (
    <div className={`max-w-[82%] px-3.5 py-3 rounded-2xl text-sm leading-relaxed space-y-2 ${
      role === 'user'
        ? 'bg-primary-500 text-[#0B0B0B] font-medium rounded-br-sm'
        : 'bg-surface-3 text-ink-secondary rounded-bl-sm'
    }`}>
      {paragraphs.map((para, i) => (
        <p key={i} className="whitespace-pre-line">{para}</p>
      ))}
    </div>
  );
}

export default function SupportChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { token } = useAuthStore();

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: 'Ciao, sono l\'assistente Flanvo.\nCome posso aiutarti?',
      }]);
    }
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const t = token || (typeof window !== 'undefined' ? localStorage.getItem('flanvo_token') : null);
      const res = await fetch('/api/support/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(t ? { Authorization: `Bearer ${t}` } : {}),
        },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      setMessages(m => [...m, { role: 'assistant', content: data.reply || 'Non ho capito. Puoi riformulare?' }]);
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: 'Errore di connessione. Riprova tra poco.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  // Mostra le quick questions quando l'ultimo messaggio è dell'assistente e non stiamo caricando
  const lastMessage = messages[messages.length - 1];
  const showQuickQuestions = !loading && lastMessage?.role === 'assistant';

  return (
    <>
      {open && (
        <div style={{ bottom: 'max(5.5rem, calc(env(safe-area-inset-bottom, 0px) + 5.5rem))' }} className="fixed right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 max-h-[70vh] flex flex-col bg-surface-1 border border-surface-4 rounded-2xl shadow-surface overflow-hidden animate-fade-up">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-surface-4 bg-surface-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-primary-500/15 border border-primary-500/20 rounded-xl flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Assistente Flanvo</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
                  <span className="text-xs text-ink-muted">Online</span>
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="p-1.5 text-ink-muted hover:text-white rounded-lg transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <MessageBubble role={m.role} content={m.content} />
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-surface-3 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-ink-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-ink-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-ink-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Quick questions — visibili dopo ogni risposta dell'assistente */}
          {showQuickQuestions && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {QUICK_QUESTIONS.map(q => (
                <button key={q} onClick={() => send(q)}
                  className="text-xs px-3 py-1.5 bg-surface-2 border border-surface-5 rounded-full text-ink-muted hover:text-white hover:border-surface-4 transition-all">
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-surface-4 flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Scrivi un messaggio..."
              disabled={loading}
              className="flex-1 px-3.5 py-2.5 bg-surface-2 border border-surface-5 rounded-xl text-sm text-white placeholder-ink-muted focus:outline-none focus:border-primary-500 transition-colors disabled:opacity-50"
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              className="p-2.5 bg-primary-500 text-[#0B0B0B] rounded-xl hover:bg-primary-400 transition-all disabled:opacity-40 shrink-0">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Trigger bubble */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{ bottom: 'max(1.5rem, env(safe-area-inset-bottom, 1.5rem))' }}
        className={`fixed right-4 sm:right-6 z-50 w-14 h-14 rounded-full shadow-teal flex items-center justify-center transition-all active:scale-95 ${
          open ? 'bg-surface-3 border border-surface-5' : 'bg-primary-500 hover:bg-primary-400'
        }`}
        aria-label="Apri assistente"
      >
        {open
          ? <X className="w-5 h-5 text-ink-secondary" />
          : <MessageCircle className="w-6 h-6 text-[#0B0B0B]" />}
      </button>
    </>
  );
}
