'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Send, AlertTriangle, Smile, ShieldAlert } from 'lucide-react';
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

const QUICK_EMOJIS = ['👍', '🙌', '👏', '🔥', '❤️', '😂', '😮', '🚀'];

export default function ChatPanel({
  messages,
  onSendMessage,
  username,
  typingUsers,
  onTypingStart,
  onTypingEnd,
}: ChatPanelProps) {
  const [chatInput, setChatInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isCurrentlyTyping, setIsCurrentlyTyping] = useState(false);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    onSendMessage(chatInput);
    setChatInput('');

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
    }, 2000);
  };

  const handleEmojiClick = (emoji: string) => {
    setChatInput((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const getTypingText = () => {
    const activeTypers = typingUsers.filter(
      (u) => u.toLowerCase() !== username.toLowerCase()
    );

    if (activeTypers.length === 0) return '';
    if (activeTypers.length === 1) return `@${activeTypers[0]} is typing...`;
    if (activeTypers.length === 2)
      return `@${activeTypers[0]} & @${activeTypers[1]} are typing...`;
    return 'Several people are typing...';
  };

  const typingText = getTypingText();

  return (
    <div className="flex-1 flex flex-col h-full bg-stone-50 dark:bg-zinc-950/40 overflow-hidden relative select-none">
      
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar min-h-0">
        
        {messages.length === 0 ? (
          <div className="flex-grow flex flex-col items-center justify-center text-center p-6 text-zinc-500 select-none">
            <div className="w-14 h-14 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shadow-sm text-lg mb-3">
              💬
            </div>
            <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">No chat messages yet</p>
            <p className="text-[10px] text-zinc-500 max-w-[200px] mt-1 leading-relaxed">
              Send a secure direct message. All text streams are encrypted and linkless.
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            // System notices
            if (msg.sender === 'SystemAlert') {
              return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={index}
                  className="w-full text-center py-2 px-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-450 text-[10px] font-bold leading-relaxed flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
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
                {/* Meta header */}
                <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                  <span className="font-bold text-zinc-700 dark:text-zinc-400">
                    {isMine ? 'You' : `@${msg.sender}`}
                  </span>
                  <span className="font-mono text-[9px]">{msg.timestamp}</span>
                </div>

                {/* Message Box */}
                <div
                  className={`p-3 rounded-2xl text-xs leading-relaxed text-left break-words border shadow-[0_2px_6px_rgba(0,0,0,0.02)] ${
                    msg.flagged
                      ? 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold'
                      : isMine
                      ? 'bg-landing-primary border-landing-primary text-white rounded-br-none'
                      : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-850 text-zinc-800 dark:text-zinc-200 rounded-bl-none'
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

      {/* Typing ticker */}
      <div className="h-5 px-4 text-[10px] text-zinc-500 dark:text-zinc-400 italic flex items-center shrink-0">
        <AnimatePresence>
          {typingText && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1.5"
            >
              <div className="flex items-center gap-0.5">
                <span className="w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-600 animate-pulse" />
                <span className="w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-600 animate-pulse delay-75" />
                <span className="w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-600 animate-pulse delay-150" />
              </div>
              <span className="font-semibold">{typingText}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Quick Emojis bar */}
      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-[72px] left-4 right-4 bg-white dark:bg-[#111827] border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 flex items-center justify-between shadow-2xl z-30"
          >
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleEmojiClick(emoji)}
                className="w-8 h-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center text-sm cursor-pointer active:scale-95 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input container */}
      <form
        onSubmit={handleSubmit}
        className="p-4 border-t border-zinc-200/80 dark:border-zinc-900 bg-white dark:bg-[#111827] flex gap-2 items-center shrink-0 relative"
      >
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
            showEmojiPicker 
              ? 'bg-landing-primary/10 border-landing-primary/20 text-landing-primary' 
              : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-white'
          }`}
          title="Insert Emojis"
        >
          <Smile className="w-4.5 h-4.5" />
        </button>
        
        <input
          type="text"
          value={chatInput}
          onChange={handleInputChange}
          placeholder="Type a secure message..."
          className="flex-grow px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs rounded-xl text-zinc-800 dark:text-zinc-150 focus:outline-none focus:border-landing-primary/80 focus:ring-1 focus:ring-landing-primary/30 transition-all placeholder:text-zinc-500"
        />

        <button
          type="submit"
          className="w-9 h-9 rounded-xl bg-landing-primary hover:bg-landing-primary/90 text-white flex items-center justify-center shadow-lg shadow-landing-primary/10 active:scale-95 transition-all shrink-0 cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
