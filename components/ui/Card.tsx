import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
}

export const Card: React.FC<CardProps> = ({ children, className, title, description }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-6 shadow-2xl",
        className
      )}
    >
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5" />
      
      {(title || description) && (
        <div className="mb-6">
          {title && <h3 className="text-xl font-bold text-white mb-1">{title}</h3>}
          {description && <p className="text-sm text-slate-400">{description}</p>}
        </div>
      )}
      
      {children}
    </motion.div>
  );
};
