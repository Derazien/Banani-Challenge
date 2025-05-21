import { useState } from 'react';

export interface TooltipInfo {
  id: string;
  text: string;
  x: number;
  y: number;
}

/**
 * @function
 * @returns {Object} Tooltip state and functions
 * @returns {TooltipInfo|null} activeTooltip - Currently active tooltip info
 * @returns {Function} showTooltip - Function to show a tooltip
 * @returns {Function} hideTooltip - Function to hide the tooltip
 * Custom hook for managing tooltips
 */
export function useTooltips() {
  const [activeTooltip, setActiveTooltip] = useState<TooltipInfo | null>(null);
  
  /**
   * @function
   * @param {React.MouseEvent<HTMLElement>} e - The mouse event
   * @param {string} text - The tooltip text
   * @param {string} [id] - Optional tooltip ID
   * @returns {void}
   */
  const showTooltip = (e: React.MouseEvent<HTMLElement>, text: string, id?: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setActiveTooltip({ 
      id: id || `tooltip-${Date.now()}`, 
      text, 
      x: rect.left + rect.width / 2, 
      y: rect.top 
    });
  };
  
  /**
   * @function
   * @returns {void}
   */
  const hideTooltip = () => setActiveTooltip(null);
  
  return {
    activeTooltip,
    showTooltip,
    hideTooltip
  };
} 