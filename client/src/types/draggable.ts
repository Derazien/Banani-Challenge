/**
 * Common position interface for draggable elements
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Common props for draggable components
 */
export interface DraggableProps {
  /**
   * Initial position of the component
   */
  initialPosition?: Position;
  
  /**
   * Flag indicating if component can be collapsed
   */
  collapsible?: boolean;
  
  /**
   * Callback when position changes
   */
  onPositionChange?: (position: Position) => void;
  
  /**
   * Z-index for the component
   */
  zIndex?: number;
} 