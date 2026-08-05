'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    const initialTheme = savedTheme || 'dark';
    setTheme(initialTheme);

    const root = window.document.documentElement;
    if (initialTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);

    const root = window.document.documentElement;
    if (nextTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-full bg-zinc-900/40 border border-zinc-800/40 select-none animate-pulse" />
    );
  }

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      className="w-9 h-9 rounded-full flex items-center justify-center border transition-all cursor-pointer shadow-md select-none bg-zinc-900/60 hover:bg-zinc-800 border-zinc-800 text-zinc-400 hover:text-white"
      title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
      aria-label="Toggle Theme"
    >
      {theme === 'dark' ? (
        <Sun className="w-4.5 h-4.5 text-amber-400" />
      ) : (
        <Moon className="w-4.5 h-4.5 text-indigo-400" />
      )}
    </motion.button>
  );
}
