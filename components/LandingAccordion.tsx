'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: "Why are there no meeting links?",
    answer: "NeuraMeet replaces links with username-based invitations. Because there are no public URLs or random meeting IDs to share, it is impossible for unauthorized intruders to access, forward, or crash your meeting. This eliminates Zoombombing entirely at the architectural level."
  },
  {
    question: "How does username invitation work?",
    answer: "When creating a meeting, you simply input the verified NeuraMeet usernames of your participants. When the meeting starts, they receive an immediate in-app invitation on their dashboard and can join directly. No email links, no copy-pasting."
  },
  {
    question: "Can invitations be forwarded?",
    answer: "No. Since invitations are strictly tied to specific NeuraMeet accounts and verified server-side, they cannot be forwarded, shared, or hijacked by third parties. Only the verified owner of the invited username can establish the connection."
  },
  {
    question: "Why is this safer than Zoom?",
    answer: "Zoom and other services rely on sharing URLs or meeting IDs which can easily leak, be forwarded to unauthorized parties, or be brute-forced. NeuraMeet implements a strict, linkless, invite-only, zero-trust model where access is identity-locked before anyone enters."
  },
  {
    question: "How do participants join?",
    answer: "Invited participants simply log into their NeuraMeet dashboard. When the meeting begins, an active invitation banner appears on their dashboard, allowing them to connect with a single secure click."
  },
  {
    question: "Do I need a meeting ID?",
    answer: "No. NeuraMeet does not use meeting IDs. Access is resolved entirely through account identity verification at the server and database level, removing another potential vector of unauthorized entry."
  },
  {
    question: "Is my meeting encrypted?",
    answer: "Yes. Video and audio streams are transmitted directly between participants using peer-to-peer WebRTC connections secured with end-to-end encryption, ensuring complete confidentiality for your conversations."
  }
];

export default function LandingAccordion() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggleAccordion = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-4">
      {faqData.map((item, index) => {
        const isOpen = activeIndex === index;
        return (
          <div
            key={index}
            className="group rounded-2xl border transition-all duration-300 border-landing-border/80 hover:border-landing-primary/30 bg-landing-card shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)]"
          >
            <button
              onClick={() => toggleAccordion(index)}
              className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 cursor-pointer"
              aria-expanded={isOpen}
            >
              <div className="flex items-center gap-3.5">
                <HelpCircle className={`w-5 h-5 transition-colors duration-300 ${isOpen ? 'text-landing-primary' : 'text-landing-text-secondary/60'}`} />
                <span className="text-sm sm:text-base font-semibold text-landing-text-primary">
                  {item.question}
                </span>
              </div>
              <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-landing-bg/50 text-landing-text-secondary group-hover:text-landing-text-primary"
              >
                <ChevronDown className="w-4 h-4" />
              </motion.div>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-landing-text-secondary leading-relaxed border-t border-landing-border/40">
                    {item.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
