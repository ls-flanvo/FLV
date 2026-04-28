'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Send, User, Phone } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  isDriver: boolean;
  senderName: string;
  isMe: boolean;
  createdAt: string;
}

interface DriverChatProps {
  isOpen: boolean;
  onClose: () => void;
  driverName: string;
  driverPhone?: string;
  groupId: string;
}

export default function DriverChat({
  isOpen,
  onClose,
  driverName,
  driverPhone,
  groupId,
}: DriverChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchMessages = async () => {
    if (!groupId || groupId === 'driver-chat') return;
    try {
      const token = localStorage.getItem('flanvo_token');
      const res = await fetch(`/api/messages/${groupId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages ?? []);
      }
    } catch {
      // silent
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    fetchMessages();
    intervalRef.current = setInterval(fetchMessages, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isOpen, groupId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;
    setSending(true);
    const text = newMessage.trim();
    setNewMessage('');

    try {
      const token = localStorage.getItem('flanvo_token');
      const res = await fetch(`/api/messages/${groupId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ content: text }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
      }
    } catch {
      // silent
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
        <div
          className="bg-white w-full md:max-w-lg md:rounded-xl shadow-2xl flex flex-col"
          style={{ height: '100vh', maxHeight: '100vh' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-4 flex items-center justify-between md:rounded-t-xl">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold">{driverName}</h3>
                <p className="text-sm text-primary-100">Chat di gruppo</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {driverPhone && (
                <a
                  href={`tel:${driverPhone}`}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <Phone className="w-5 h-5" />
                </a>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-8">
                Nessun messaggio. Scrivi il primo!
              </p>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs md:max-w-sm rounded-2xl px-4 py-2 ${
                    message.isMe
                      ? 'bg-accent-500 text-white rounded-br-none'
                      : 'bg-white text-gray-900 rounded-bl-none shadow-sm'
                  }`}
                >
                  {!message.isMe && (
                    <p className="text-xs font-semibold mb-1 opacity-70">
                      {message.senderName}
                    </p>
                  )}
                  <p className="text-sm break-words">{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.isMe ? 'text-accent-100' : 'text-gray-400'
                    }`}
                  >
                    {new Date(message.createdAt).toLocaleTimeString('it-IT', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={handleSendMessage}
            className="p-4 bg-white border-t border-gray-200 md:rounded-b-xl"
          >
            <div className="flex items-end space-x-2">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                placeholder="Scrivi un messaggio..."
                rows={1}
                className="flex-1 resize-none rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                style={{ maxHeight: '120px' }}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="bg-accent-500 text-white p-3 rounded-lg hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Aggiornamento ogni 5 secondi · Invio per inviare
            </p>
          </form>
        </div>
      </div>
    </>
  );
}
