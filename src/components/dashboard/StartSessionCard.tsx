"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { SupportedLanguage } from "@/lib/languages.config";

type Props = {
  language: SupportedLanguage;
};

export function StartSessionCard({ language }: Props) {
  const router = useRouter();

  return (
    <div className="relative overflow-hidden rounded-2xl p-7 flex flex-col justify-between min-h-[220px] start-session-card">
      <style>{`
        @keyframes gradientFlow {
          0%   { background-position: 0% 50%;   }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%;   }
        }
        .start-session-card {
          background: linear-gradient(
            135deg,
            #5b21b6 0%,
            #7c3aed 25%,
            #a855f7 50%,
            #CA7DF9 75%,
            #7c3aed 100%
          );
          background-size: 300% 300%;
          animation: gradientFlow 10s ease-in-out infinite;
        }

        @keyframes gradientShift {
          0%   { opacity: 0.6; transform: scale(1)    rotate(0deg); }
          50%  { opacity: 1;   transform: scale(1.08) rotate(6deg); }
          100% { opacity: 0.6; transform: scale(1)    rotate(0deg); }
        }
        .start-session-orb {
          animation: gradientShift 6s ease-in-out infinite;
          transform-origin: center;
        }

        @keyframes onlinePulse {
          0%, 100% { opacity: 1;   transform: scale(1);   }
          50%      { opacity: 0.5; transform: scale(1.5); }
        }
        .online-dot {
          animation: onlinePulse 2s ease-in-out infinite;
        }
      `}</style>

      {/* Decorative animated orb */}
      <div
        className="start-session-orb absolute right-6 top-1/2 -translate-y-1/2 rounded-full flex items-center justify-center"
        style={{ width: 140, height: 140, background: "rgba(255,255,255,0.10)" }}
      >
        <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
          <path
            d="M28 8L34 22H48L36.5 30.5L40.5 46L28 37L15.5 46L19.5 30.5L8 22H22L28 8Z"
            fill="white"
            fillOpacity="0.9"
          />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-[60%]">
        <motion.div
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 mb-4"
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <span className="online-dot w-1.5 h-1.5 rounded-full bg-emerald-300" />
          <span className="text-white/90 text-xs font-medium tracking-wide">AI TUTOR ONLINE</span>
        </motion.div>

        <motion.h2
          className="text-white font-bold text-2xl leading-tight mb-2"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.45 }}
        >
          Immerse yourself
          <br />
          in conversation.
        </motion.h2>

        <motion.p
          className="text-white/75 text-sm leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.4 }}
        >
          Your AI tutor is ready to practice real-world scenarios with you.
        </motion.p>
      </div>

      <motion.div
        className="relative z-10 mt-5"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.35 }}
      >
        <motion.button
          onClick={() => router.push(`/chat/${language}` as never)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white rounded-xl font-semibold text-sm"
          style={{ color: "#7c3aed" }}
          whileHover={{ scale: 1.03, backgroundColor: "rgba(255,255,255,0.92)" }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        >
          Start Session
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M2.5 7H11.5M11.5 7L7.5 3M11.5 7L7.5 11"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.button>
      </motion.div>
    </div>
  );
}