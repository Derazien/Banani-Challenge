'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
}

export function AppHeader({ 
  title = "Banani Test Challenge", 
  subtitle = "Create Tables with simple prompts" 
}: AppHeaderProps) {
  return (
    <motion.header 
      className="w-full py-8 relative z-20"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <motion.h1 
            className="text-4xl md:text-5xl font-bold tracking-tight"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <span className="inline-block bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
              {title}
            </span>
          </motion.h1>
          
          <motion.p 
            className="mt-2 text-lg text-indigo-200/90 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            {subtitle}
          </motion.p>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-1/2 left-0 transform -translate-y-1/2 w-24 h-24 md:w-40 md:h-40">
          <div className="absolute w-full h-full rounded-full bg-gradient-to-tr from-blue-600/20 to-purple-600/10 blur-xl" />
        </div>
        <div className="absolute top-1/2 right-0 transform -translate-y-1/2 w-32 h-32 md:w-48 md:h-48">
          <div className="absolute w-full h-full rounded-full bg-gradient-to-bl from-indigo-500/20 to-purple-800/10 blur-xl" />
        </div>
      </div>
    </motion.header>
  );
} 