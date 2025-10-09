'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Send, User, Phone } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'driver';
  timestamp: Date;
}

interface DriverChatProps {
  isOpen: boolean;
  onClose: () => void;
  driverName: string;
  driverPhone?: string;
  bookingId: string;
}

export default function DriverChat({ isOpen, onClose, driverName, driverPhone, bookingId }: DriverChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Ciao! Sono ${driverName}, il tuo autista. Come posso aiutarti?`,
      sender: 'driver',
      timestamp: new Date(Date.now() - 3600000)
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll automatico all'ultimo messaggio
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      text: newMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages([...messages, message]);
    setNewMessage('');

    // Simula risposta automatica del driver dopo 2 secondi
    setTimeout(() => {
      const autoReply: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Messaggio ricevuto! Ti risponderò al più presto.',
        sender: 'driver',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, autoReply]);
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 animate-fadeIn"
        onClick={onClose}
      />

      {/* Chat Modal */}
      <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
        <div 
          className="bg-white w-full md:max-w-lg md:rounded-xl shadow-2xl flex flex-col animate-fadeIn"
          style={{ height: '100vh', maxHeight: '100vh' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-4 flex items-center justify-between md:rounded-t-xl">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold">{driverName}</h3>
                <p className="text-sm text-primary-100">Autista</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {driverPhone && (
                <a
                  href={`tel:${driverPhone}`}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  title="Chiama autista"
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

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs md:max-w-sm rounded-2xl px-4 py-2 ${
                    message.sender === 'user'
                      ? 'bg-accent-500 text-white rounded-br-none'
                      : 'bg-white text-gray-900 rounded-bl-none shadow-sm'
                  }`}
                >
                  <p className="text-sm break-words">{message.text}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.sender === 'user' ? 'text-accent-100' : 'text-gray-400'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString('it-IT', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
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
                disabled={!newMessage.trim()}
                className="bg-accent-500 text-white p-3 rounded-lg hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md hover:shadow-lg"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Premi Invio per inviare, Shift+Invio per andare a capo
            </p>
          </form>
        </div>
      </div>
    </>
  );
}