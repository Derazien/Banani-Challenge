'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShareIcon } from '@/components/icons/ShareIcon';
import { ChevronDownIcon, Expand, Minimize2 } from 'lucide-react'; // Using lucide for all icons
import styles from './prompt-box.module.css';
import { useBoundedDrag } from '@/lib/hooks/use-bounded-drag';
import { Position, DraggableProps } from '@/types/draggable';

interface PromptBoxProps extends DraggableProps {
  prompt: string;
  setPrompt: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
  onSuggestionClick: (suggestion: string) => void;
  isEditMode?: boolean; // Add this prop to determine if we're editing an existing table
}

const examplePrompts = [
  "I need a table for my CRM where we track company expenses. Service name, total spend, latest transaction date. And action to save it",
  "Table for CRM with recent sales transactions",
  "Table with 5 rows displaying company documents with dates and actions",
  "What are the top 5 performing marketing campaigns this year?",
];

const editExamplePrompts = [
  "Add a column for priority level with high, medium, and low values",
  "Change the table to show quarterly sales figures instead of monthly",
  "Add more rows with additional data points",
  "Convert the numerical values to percentages",
];

export function PromptBox({ 
  prompt, 
  setPrompt, 
  onSubmit, 
  loading, 
  onSuggestionClick, 
  initialPosition = { x: 50, y: 50 }, // Default if not provided
  collapsible = true,
  zIndex = 1000,
  onPositionChange,
  isEditMode = false, // Add default value
}: PromptBoxProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  
  // Use the bounded drag hook
  const { position, dragConstraints, handleDragEnd } = useBoundedDrag(panelRef, {
    initialPosition,
    isCollapsed,
    edgeMargin: 8 // Small margin from window edges
  });

  // Replace the auto-clear effect with a version that tracks the previous loading state
  const prevLoadingRef = useRef(loading);

  // Auto-clear the prompt when loading completes (only when transitioning from loading to not loading)
  useEffect(() => {
    // Check if we're transitioning from loading to not loading
    if (prevLoadingRef.current && !loading && prompt.trim() !== '') {
      // Only clear if we were previously loading and now we're not
      const timer = setTimeout(() => {
        setPrompt('');
      }, 500); // Give a small delay so users can see the transition
      
      return () => clearTimeout(timer);
    }
    
    // Update the previous loading state
    prevLoadingRef.current = loading;
  }, [loading]);

  // Notify parent of position changes if callback provided
  // Add previous position tracking to avoid unnecessary updates
  const prevPositionRef = useRef<Position | null>(null);

  useEffect(() => {
    if (onPositionChange) {
      // Only notify if position actually changed from previous update
      if (!prevPositionRef.current || 
          prevPositionRef.current.x !== position.x || 
          prevPositionRef.current.y !== position.y) {
        
        // Store current position before notifying parent
        prevPositionRef.current = { ...position };
        
        // Notify parent
        onPositionChange(position);
      }
    }
  }, [position, onPositionChange]);

  const toggleCollapse = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsCollapsed(!isCollapsed);
  };

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isSubmitDisabled) onSubmit();
    }
  }

  const isSubmitDisabled = loading || !prompt.trim();

  const handleSuggestionInternalClick = (suggestion: string) => {
    onSuggestionClick(suggestion);
    setShowSuggestions(false);
  };

  const panelVariants = {
    expanded: {
      opacity: 1,
      width: '400px',
      height: 'auto',
      borderRadius: '12px 28px 28px 28px',
      scale: 1,
      backgroundColor: 'rgba(255, 255, 255, 1)',
      // Slightly softer spring for the main panel container
      transition: { type: 'spring', stiffness: 300, damping: 35, when: "beforeChildren" }
    },
    collapsed: {
      opacity: 1,
      width: '56px',
      height: '56px',
      borderRadius: '50%',
      scale: 1,
      backgroundColor: '#1784EF',
      transition: { type: 'spring', stiffness: 300, damping: 35, when: "afterChildren" }
    },
  };

  const contentVariants = {
    // Content wrapper animates its own opacity and height.
    // The `layout` prop on the parent will handle the parent's size change smoothly.
    expanded: { 
      opacity: 1, 
      height: 'auto', 
      transition: { 
        opacity: { duration: 0.2, delay: 0.1 }, // Fade in content slightly after panel starts expanding
        height: { type: 'spring', stiffness: 300, damping: 30, delay: 0.05 } // Animate height smoothly
      }
    },
    collapsed: { 
      opacity: 0, 
      height: 0, 
      transition: { 
        opacity: { duration: 0.15 }, 
        height: { type: 'spring', stiffness: 300, damping: 30, duration: 0.2 }
      }
    },
  };
  
  const collapsedButtonIconVariants = {
    initial: { opacity: 0, scale: 0.5 },
    animate: { opacity: 1, scale: 1, transition: { delay: isCollapsed ? 0.1 : 0 } }, // Slightly increased delay to ensure parent is ready
    exit: { opacity: 0, scale: 0.5, transition: { duration: 0.1 } },
  };

  // Determine placeholder text based on mode
  const placeholderText = isEditMode
    ? "How would you like to modify this table?"
    : "What kind of table do you want to generate?";

  // Get appropriate example prompts based on mode
  const currentExamples = isEditMode ? editExamplePrompts : examplePrompts;

  return (
    <motion.div
      ref={panelRef}
      className={`${styles.promptBox} ${isCollapsed ? styles.collapsedPromptBox : styles.expandedPromptBox} ${loading ? styles.loadingPromptBox : ''}`}
      style={{
        left: position.x,
        top: position.y,
        cursor: isCollapsed ? 'pointer' : 'grab',
        transformOrigin: "top center",
        zIndex
      }}
      variants={panelVariants}
      initial={false}
      animate={isCollapsed ? 'collapsed' : 'expanded'}
      drag
      dragConstraints={dragConstraints}
      dragMomentum={false}
      onDragEnd={(event, info) => {
        handleDragEnd(info);
      }}
      onClick={isCollapsed ? toggleCollapse : undefined} 
      layout
    >
      <AnimatePresence mode="wait">
        {isCollapsed ? (
          <motion.div
            key="collapsed-icon"
            variants={collapsedButtonIconVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={styles.collapsedIconContainer}
          >
            {loading ? (
              <div className={styles.loadingSpinner} />
            ) : (
              <Expand size={24} className="text-white" />
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="expanded-content-wrapper"
            className={styles.expandedContentWrapper}
            variants={contentVariants} 
            initial="collapsed" 
            animate="expanded"
            exit="collapsed"
            style={{ overflow: 'hidden' }}
          >
            {collapsible && (
              <motion.button
                onClick={toggleCollapse}
                className={styles.collapseButton}
                aria-label="Collapse"
                whileTap={{ scale: 0.9 }}
              >
                <Minimize2 size={18} />
              </motion.button>
            )}
            <div className={`${styles.promptBoxContent} ${isEditMode ? styles.editModePromptBox : ''}`}>
              <textarea
                className={styles.promptTextarea}
                placeholder={placeholderText}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
              />
              {loading && <div className={styles.promptLoadingIndicator} />}
            </div>
            
            <div className={styles.bottomControlsContainer}>
                <div className={styles.suggestionsArea}>
                    <button 
                    onClick={() => setShowSuggestions(!showSuggestions)}
                    className={styles.suggestionsToggleButton}
                    aria-expanded={showSuggestions}
                    disabled={loading}
                    >
                    <ChevronDownIcon /> 
                    <span>{showSuggestions ? 'Hide' : 'Show'} Example Prompts</span>
                    </button>
                </div>
                <motion.button
                    type="button"
                    onClick={onSubmit}
                    disabled={isSubmitDisabled}
                    aria-label="Submit"
                    className={`${styles.promptButton} ${isSubmitDisabled ? styles.promptButtonDisabled : styles.promptButtonEnabled} ${loading ? styles.loadingButton : ''}`}
                    whileHover={!isSubmitDisabled ? { scale: 1.05 } : {}}
                    whileTap={!isSubmitDisabled ? { scale: 0.95 } : {}}
                >
                    {loading ? (
                      <div className={styles.miniLoadingSpinner} />
                    ) : (
                      <ShareIcon className={styles.promptButtonIcon} />
                    )}
                </motion.button>
            </div>

            <AnimatePresence initial={false}>
              {showSuggestions && (
                <motion.div
                  key="suggestions-list"
                  className={styles.suggestionsListWrapper}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  {currentExamples.map((suggestion, index) => (
                    <motion.div
                      key={index}
                      className={styles.suggestionItem}
                      onClick={() => handleSuggestionInternalClick(suggestion)}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.2 }}
                      whileHover={{ backgroundColor: '#f0f8ff' }}
                    >
                      {suggestion}
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
} 