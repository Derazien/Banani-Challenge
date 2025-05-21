import { useState, useEffect, RefObject, useRef, useLayoutEffect } from 'react';

// Safe useLayoutEffect that falls back to useEffect during SSR
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

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
  
  // State for position and constraints
  const [position, setPosition] = useState<Position>(initialPosition);
  const [dragConstraints, setDragConstraints] = useState<DragConstraints | undefined>(undefined);

  // Use a ref to track the current position to avoid dependency cycles
  const positionRef = useRef(position);
  
  // Update position ref when position changes
  useIsomorphicLayoutEffect(() => {
    positionRef.current = position;
  }, [position]);
  
  // Calculate initial constraints on mount
  useIsomorphicLayoutEffect(() => {
    // Skip on server-side render
    if (typeof window === 'undefined' || !elementRef.current) return;
    
    const el = elementRef.current;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    const elementWidth = isCollapsed ? 250 : el.getBoundingClientRect().width;
    const elementHeight = el.getBoundingClientRect().height;
    
    // Calculate initial constraints
    const initialConstraints = {
      left: edgeMargin,
      top: edgeMargin,
      right: windowWidth - elementWidth - edgeMargin,
      bottom: windowHeight - elementHeight - edgeMargin,
    };
    
    setDragConstraints(initialConstraints);
    
    // Ensure initial position is within constraints
    const boundedX = Math.min(
      Math.max(initialConstraints.left, initialPosition.x),
      initialConstraints.right
    );
    
    const boundedY = Math.min(
      Math.max(initialConstraints.top, initialPosition.y),
      initialConstraints.bottom
    );
    
    // Only update if the position needs to change
    if (boundedX !== position.x || boundedY !== position.y) {
      setPosition({ x: boundedX, y: boundedY });
    }
  // This effect runs once on mount and when these dependencies change
  }, [elementRef.current, isCollapsed, edgeMargin, initialPosition.x, initialPosition.y]);
  
  // Update constraints on resize or when dependencies change
  useEffect(() => {
    // Skip on server-side
    if (typeof window === 'undefined' || !elementRef.current) return;
    
    const updateConstraints = () => {
      if (!elementRef.current) return;
      
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      
      // Use a fixed width for collapsed state
      const elementWidth = isCollapsed ? 250 : elementRef.current.getBoundingClientRect().width;
      const elementHeight = elementRef.current.getBoundingClientRect().height;
      
      // Calculate new constraints
      const newConstraints = {
        left: edgeMargin,
        top: edgeMargin,
        right: windowWidth - elementWidth - edgeMargin,
        bottom: windowHeight - elementHeight - edgeMargin,
      };
      
      setDragConstraints(newConstraints);
      
      // Access current position from ref to avoid dependency cycles
      const currentPos = positionRef.current;
      
      // Ensure position stays within constraints
      const newX = Math.min(
        Math.max(newConstraints.left, currentPos.x),
        newConstraints.right
      );
      
      const newY = Math.min(
        Math.max(newConstraints.top, currentPos.y),
        newConstraints.bottom
      );
      
      // Only update if needed to avoid loops
      if (newX !== currentPos.x || newY !== currentPos.y) {
        setPosition({ x: newX, y: newY });
      }
    };

    // Update constraints immediately
    updateConstraints();
    
    // Add resize listener
    window.addEventListener('resize', updateConstraints);
    
    // Cleanup listener on unmount or when dependencies change
    return () => {
      window.removeEventListener('resize', updateConstraints);
    };
  }, [elementRef, isCollapsed, edgeMargin]);
  
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