import { useState, useCallback } from 'react';
import { Position } from '@/types/draggable';

/**
 * Hook for managing UI element positions
 */
export function usePromptPosition() {
  const [positions, setPositions] = useState(getInitialPositions());
  
  // Create a memoized position change handler to prevent recreation on each render
  const handlePromptBoxPositionChange = useCallback((newPos: Position) => {
    // Only update if the position has actually changed
    setPositions(prev => {
      // Skip update if position is the same
      if (prev.promptBox.x === newPos.x && prev.promptBox.y === newPos.y) {
        return prev;
      }
      return {
        ...prev,
        promptBox: newPos
      };
    });
  }, []);
  
  return {
    positions,
    handlePromptBoxPositionChange
  };
}

/**
 * Calculate proper initial positions for UI elements
 */
function getInitialPositions() {
  // Use sensible default values for server-side rendering
  const defaultPositions = {
    promptBox: { x: 20, y: 80 },
    table: { x: 20, y: 120 }
  };

  // Only access window in browser environment
  if (typeof window === 'undefined') {
    return defaultPositions;
  }

  // Calculate based on actual window size
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  return {
    promptBox: { x: 20, y: 80 },
    table: { 
      x: Math.max(20, (windowWidth / 2) - 300),  // Center horizontally with 300px offset
      y: Math.min(120, windowHeight * 0.15)      // 15% from top, max 120px
    }
  };
} 