'use client';

import { motion } from 'framer-motion';

export function LearningBadge() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', damping: 15, stiffness: 200 }}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-brand-500/20 border border-purple-400/30"
    >
      <span className="text-sm">🎓</span>
      <span className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider">
        Trading Fundamentals Complete
      </span>
    </motion.div>
  );
}
