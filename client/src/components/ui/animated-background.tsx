'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function AnimatedBackground() {
  // Create state to hold generated values for the UI elements
  const [blobs, setBlobs] = useState<React.ReactNode[]>([]);
  const [stars, setStars] = useState<React.ReactNode[]>([]);
  
  // Generate the random elements only on the client side in useEffect
  useEffect(() => {
    // Generate blobs
    const generatedBlobs = Array(5).fill(0).map((_, i) => {
      const r1 = Math.floor(Math.random() * 100) + 30;
      const g1 = Math.floor(Math.random() * 100) + 50;
      const b1 = Math.floor(Math.random() * 200) + 55;
      
      const r2 = Math.floor(Math.random() * 50) + 20;
      const g2 = Math.floor(Math.random() * 50) + 30;
      const b2 = Math.floor(Math.random() * 150) + 50;
      
      const width = `${Math.floor(Math.random() * 40) + 20}%`;
      const height = `${Math.floor(Math.random() * 40) + 20}%`;
      const left = `${Math.floor(Math.random() * 80)}%`;
      const top = `${Math.floor(Math.random() * 80)}%`;
      
      const animDuration = Math.random() * 10 + 20;
      const scale = Math.random() * 0.4 + 0.8;
      const moveX = Math.random() * 30 - 15;
      const moveY = Math.random() * 30 - 15;
      
      return (
        <motion.div
          key={`blob-${i}`}
          className="absolute rounded-full mix-blend-screen filter blur-3xl"
          style={{
            background: `radial-gradient(circle, rgba(${r1}, ${g1}, ${b1}, 0.8) 0%, rgba(${r2}, ${g2}, ${b2}, 0.4) 70%)`,
            width,
            height,
            left,
            top,
          }}
          animate={{
            x: [0, moveX, 0],
            y: [0, moveY, 0],
            scale: [1, scale, 1],
          }}
          transition={{
            duration: animDuration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      );
    });
    
    // Generate stars/particles
    const generatedStars = Array(100).fill(0).map((_, i) => {
      const size = Math.random() * 2 + 1;
      const left = `${Math.random() * 100}%`;
      const top = `${Math.random() * 100}%`;
      const opacity = Math.random() * 0.5 + 0.2;
      const duration = Math.random() * 3 + 2;
      const delay = Math.random() * 5;
      
      return (
        <motion.div
          key={`star-${i}`}
          className="absolute rounded-full bg-white"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            left,
            top,
            opacity,
          }}
          animate={{
            opacity: [opacity * 0.5, opacity, opacity * 0.5],
          }}
          transition={{
            duration,
            repeat: Infinity,
            delay,
          }}
        />
      );
    });
    
    setBlobs(generatedBlobs);
    setStars(generatedStars);
  }, []); // Empty dependency array to run only once on mount

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-black">
      <motion.div
        className="absolute inset-0 z-0"
        style={{
          background: 'radial-gradient(circle at center, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.5) 100%)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
      />
      
      {/* Animated gradient blobs - only rendered client-side */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        {blobs}
      </div>
      
      {/* Grid overlay */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px)`,
          backgroundSize: '30px 30px',
          backgroundPosition: '0 0',
          opacity: 0.2,
        }}
      />
      
      {/* Subtle moving stars/particles - only rendered client-side */}
      <div className="absolute inset-0">
        {stars}
      </div>
    </div>
  );
} 