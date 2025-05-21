"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ThreeDCardProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  glareMaxOpacity?: number;
  rotationIntensity?: number;
  childrenClassName?: string;
}

export const ThreeDCard = ({
  children,
  className,
  containerClassName,
  glareMaxOpacity = 0.1,
  rotationIntensity = 10,
  childrenClassName,
}: ThreeDCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [cardDimensions, setCardDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (cardRef.current) {
      const { width, height } = cardRef.current.getBoundingClientRect();
      setCardDimensions({ width, height });
    }
  }, []);

  // Calculate rotation based on mouse position and card dimensions
  const calculateRotation = () => {
    const centerX = cardDimensions.width / 2;
    const centerY = cardDimensions.height / 2;
    
    // Calculate rotation value between -rotation and +rotation
    const rotateY = ((mousePosition.x - centerX) / centerX) * rotationIntensity;
    const rotateX = -((mousePosition.y - centerY) / centerY) * rotationIntensity;
    
    return { rotateX, rotateY };
  };

  // Calculate glare position based on mouse movement
  const calculateGlarePosition = () => {
    const centerX = cardDimensions.width / 2;
    const centerY = cardDimensions.height / 2;
    
    // Get angle based on mouse position relative to center
    const angle = Math.atan2(mousePosition.y - centerY, mousePosition.x - centerX);
    
    // Convert radians to degrees and adjust to proper CSS angle
    const angleDegrees = (angle * 180) / Math.PI + 90;
    
    // Calculate distance from center to edge with mouse vector
    const mouseDistanceX = (mousePosition.x - centerX) / centerX;
    const mouseDistanceY = (mousePosition.y - centerY) / centerY;
    const distance = Math.sqrt(mouseDistanceX ** 2 + mouseDistanceY ** 2);
    
    // Stronger glare when mouse is at the edges of the card
    const glareOpacity = Math.min(distance, 1) * glareMaxOpacity;
    
    return { angle: angleDegrees, opacity: glareOpacity };
  };

  // Get rotation values
  const { rotateX, rotateY } = calculateRotation();
  
  // Get glare properties
  const glare = calculateGlarePosition();

  return (
    <div 
      className={cn("relative group perspective", containerClassName)}
      onMouseMove={(e) => {
        if (!cardRef.current) return;
        
        const rect = cardRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        ref={cardRef}
        animate={{
          rotateX: isHovered ? rotateX : 0,
          rotateY: isHovered ? rotateY : 0,
          scale: isHovered ? 1.02 : 1,
          transition: { duration: 0.2 }
        }}
        className={cn(
          "w-full relative flex items-center justify-center backface-hidden transform-gpu",
          className
        )}
      >
        {children}
        
        {/* Glare effect */}
        {isHovered && (
          <div
            className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg"
            style={{
              background: `linear-gradient(${glare.angle}deg, rgba(255, 255, 255, ${glare.opacity}) 0%, rgba(255, 255, 255, 0) 80%)`,
            }}
          />
        )}
      </motion.div>
    </div>
  );
}; 