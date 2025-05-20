import { useState, useEffect, RefObject } from 'react';

export interface Position {
  x: number;
  y: number;
}

export interface DragConstraints {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

interface UseBoundedDragOptions {
  /**
   * Initial position of the draggable element
   */
  initialPosition?: Position;
  
  /**
   * Whether element is collapsed (for elements that can change size)
   */
  isCollapsed?: boolean;
  
  /**
   * Custom margin from window edges (default: 0)
   */
  edgeMargin?: number;
}

interface UseBoundedDragResult {
  /**
   * Current position of the draggable element
   */
  position: Position;
  
  /**
   * Function to update position (e.g. after drag ends)
   */
  setPosition: (newPosition: Position) => void;
  
  /**
   * Drag constraints for framer-motion
   */
  dragConstraints: DragConstraints | undefined;
  
  /**
   * Handler for drag end events
   */
  handleDragEnd: (info: { point: Position }) => void;
}

/**
 * Hook to manage draggable elements that stay within window bounds
 */
export function useBoundedDrag(
  elementRef: RefObject<HTMLElement | null>,
  options: UseBoundedDragOptions = {}
): UseBoundedDragResult {
  const { 
    initialPosition = { x: 0, y: 0 },
    isCollapsed = false,
    edgeMargin = 0
  } = options;
  
  const [position, setPosition] = useState<Position>(initialPosition);
  const [dragConstraints, setDragConstraints] = useState<DragConstraints | undefined>({
    left: edgeMargin,
    top: edgeMargin,
    right: typeof window !== 'undefined' ? window.innerWidth - 300 - edgeMargin : 500,
    bottom: typeof window !== 'undefined' ? window.innerHeight - 300 - edgeMargin : 500
  });

  // Update constraints when needed
  useEffect(() => {
    if (!elementRef.current) return;
    
    const updateConstraints = () => {
      if (!elementRef.current) return;
      
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      
      // Use a fixed width for collapsed state
      const elementWidth = isCollapsed ? 250 : elementRef.current.getBoundingClientRect().width;
      const elementHeight = elementRef.current.getBoundingClientRect().height;
      
      // Only update constraints if they've actually changed
      const newConstraints = {
        left: edgeMargin,
        top: edgeMargin,
        right: windowWidth - elementWidth - edgeMargin,
        bottom: windowHeight - elementHeight - edgeMargin,
      };
      
      // Check if constraints have changed before updating state
      const constraintsChanged = !dragConstraints ||
        dragConstraints.left !== newConstraints.left ||
        dragConstraints.top !== newConstraints.top ||
        dragConstraints.right !== newConstraints.right ||
        dragConstraints.bottom !== newConstraints.bottom;
        
      if (constraintsChanged) {
        setDragConstraints(newConstraints);
      }
      
      // Also ensure position stays within constraints
      const newX = Math.min(
        Math.max(edgeMargin, position.x),
        windowWidth - elementWidth - edgeMargin
      );
      
      const newY = Math.min(
        Math.max(edgeMargin, position.y),
        windowHeight - elementHeight - edgeMargin
      );
      
      // Only update if needed to avoid loops - use strict equality checks
      if (newX !== position.x || newY !== position.y) {
        setPosition({ x: newX, y: newY });
      }
    };

    // Update constraints immediately
    updateConstraints();
    
    // And add resize listener
    window.addEventListener('resize', updateConstraints);
    
    return () => {
      window.removeEventListener('resize', updateConstraints);
    };
  }, [elementRef, position, isCollapsed, edgeMargin, dragConstraints]);
  
  // Simple drag end handler with position update
  const handleDragEnd = (info: { point: Position }) => {
    setPosition(info.point);
  };

  return {
    position,
    setPosition,
    dragConstraints,
    handleDragEnd
  };
} 