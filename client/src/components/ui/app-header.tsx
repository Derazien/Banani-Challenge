'use client';

import React, { useEffect, useState } from 'react';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
}

export function AppHeader({ 
  title = "Banani Data Explorer", 
  subtitle = "Ask questions about your data through natural language" 
}: AppHeaderProps) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  return (
    <header className="w-full py-6 px-4 md:px-8 flex flex-col items-center">
      <div 
        className={`text-center transform transition-all duration-700 ${
          mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          {title}
        </h1>
        <p className="mt-2 text-gray-600 text-sm md:text-base max-w-2xl mx-auto">
          {subtitle}
        </p>
      </div>
    </header>
  );
} 