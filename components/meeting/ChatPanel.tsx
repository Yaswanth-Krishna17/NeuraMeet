'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Send, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessage {
  sender: string;
  text: string;
  flagged: boolean;
  timestamp: string;
}

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  username: string;
  typingUsers: string[];
  onTypingStart: () => void;
  onTypingEnd: () => void;
}

export default function ChatPanel({
  messages,
  onSendMessage,
  username,
  typingUsers,
  onTypingStart,
  onTypingEnd,
}: ChatPanelProps) {
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isCurrentlyTyping, setIsCurrentlyTyping] = useState(false);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    onSendMessage(chatInput);
    setChatInput('');

    // End typing status on send
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setIsCurrentlyTyping(false);
    onTypingEnd();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChatInput(e.target.value);

    if (!isCurrentlyTyping) {
      setIsCurrentlyTyping(true);
      onTypingStart();
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsCurrentlyTyping(false);
      onTypingEnd();
    }, 2000); // Stop typing state after 2s of inactivity
  };

  // Build typing indicator text
  const getTypingText = () => {
    const activeTypers = typingUsers.filter(
      (u) => u.toLowerCase() !== username.toLowerCase()
    );

    if (activeTypers.length === 0) return '';
    if (activeTypers.length === 1) return `@${activeTypers[0]} is typing...`;
    if (activeTypers.length === 2)
      return `@${activeTypers[0]} and @${activeTypers[1]} are typing...`;
    return 'Several people are typing...';
  };

  const typingText = getTypingText();

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950/60 overflow-hidden relative">
      {/* Scrollable message window */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5 custom-scrollbar min-h-0">
        {messages.length === 0 ? (
          <div className="flex-grow flex flex-col items-center justify-center text-center p-6 text-zinc-500 select-none">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 font-bold mb-3 text-sm">
              💬
            </div>
            <p className="text-xs font-semibold">Welcome to the Secure Chat</p>
            <p className="text-[10px] text-zinc-650 max-w-[180px] mt-1">
              Messages are processed locally with real-time text checks.
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            if (msg.sender === 'SystemAlert') {
              return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={index}
                  className="w-full text-center py-1.5 px-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-[10px] font-medium leading-relaxed flex items-center justify-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{msg.text}</span>
                </motion.div>
              );
            }

            const isMine = msg.sender.toLowerCase() === username.toLowerCase();

            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={index}
                className={`flex flex-col max-w-[85%] gap-1 ${
                  isMine ? 'self-end items-end' : 'self-start items-start'
                }`}
              >
                {/* Meta details (Author and timestamp) */}
                <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                  <span className="font-bold text-zinc-400">
                    {isMine ? 'You' : `@${msg.sender}`}
                  </span>
                  <span className="font-mono">{msg.timestamp}</span>
                </div>

                {/* Message Bubble */}
                <div
                  className={`p-3 rounded-[20px] text-xs leading-relaxed text-left break-words ${
                    msg.flagged
                      ? 'bg-rose-550/20 border border-rose-500/30 text-rose-300 font-medium'
                      : isMine
                      ? 'bg-indigo-600 text-white rounded-br-sm'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-bl-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Typing indicators */}
      <div className="h-5 px-4 text-[10px] text-zinc-400 italic flex items-center">
        <AnimatePresence>
          {typingText && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1.5"
            >
              {/* Pulsing Dots */}
              <div className="flex items-center gap-0.5">
                <span className="w-1 h-1 rounded-full bg-zinc-400 animate-pulse" />
                <span className="w-1 h-1 rounded-full bg-zinc-400 animate-pulse delay-75" />
                <span className="w-1 h-1 rounded-full bg-zinc-400 animate-pulse delay-150" />
              </div>
              <span>{typingText}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Message Form input */}
      <form
        onSubmit={handleSubmit}
        className="p-4 border-t border-zinc-900 bg-zinc-950 flex gap-2"
      >
        <input
          type="text"
          value={chatInput}
          onChange={handleInputChange}
          placeholder="Type a message..."
          className="flex-grow px-4 py-2.5 bg-[#09090B] border border-zinc-800 text-xs rounded-full text-zinc-150 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 transition-all placeholder:text-zinc-600"
        />
        <button
          type="submit"
          className="w-9 h-9 rounded-full bg-indigo-600 hover:bg-indigo-550 text-white flex items-center justify-center shadow-md active:scale-95 transition-all shrink-0 cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
