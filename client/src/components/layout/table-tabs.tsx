'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TableData } from '@/types/table';
import styles from './table-tabs.module.css';
import { getIcon } from '@/components/icon-registry';
import { Expand } from 'lucide-react';

interface TableTabsProps {
  tables: TableData[];
  onTableExpand: (tableId: string) => void;
  onTableSelect: (table: TableData) => void;
  activeTableId?: string;
  loadingTableId?: string | null;
}

export function TableTabs({ 
  tables, 
  onTableExpand, 
  onTableSelect, 
  activeTableId,
  loadingTableId = null
}: TableTabsProps) {
  const [positions, setPositions] = useState<{x: number, y: number}[]>([]);
  const [mounted, setMounted] = useState(false);
  
  // Memoize the ordered tables array to avoid recalculating in every render
  const orderedTables = React.useMemo(() => {
    // Filter out any duplicate "Create New Table" entries
    const uniqueTables = tables.filter((table, index, self) => 
      table.key !== 'create_new' || 
      index === self.findIndex(t => t.key === 'create_new')
    );
    
    // Now reorder to ensure Create New Table is first if present
    const createNewTableIndex = uniqueTables.findIndex(t => t.key === 'create_new');
    
    if (createNewTableIndex > 0) {
      // If Create New Table exists but isn't first, move it to the front
      const createNewTable = uniqueTables.splice(createNewTableIndex, 1)[0];
      uniqueTables.unshift(createNewTable);
    }
    
    return uniqueTables;
  }, [tables]);

  // Ensure mounted state is tracked
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Calculate positions for tabs at the bottom of the screen
  useEffect(() => {
    if (typeof window === 'undefined' || !mounted || !orderedTables.length) {
      setPositions([]);
      return;
    }
    
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Position at the bottom of the screen
    const baseY = windowHeight - 60; // 60px from bottom
    
    // Calculate tab width based on available space and count
    const maxTabWidth = 200;
    const minTabWidth = 150;
    const spacing = 10; // Space between tabs
    
    // Calculate how many tabs we can fit with full size
    const idealWidth = Math.min(maxTabWidth, 
      (windowWidth * 0.8) / orderedTables.length); // Use 80% of screen width
    
    // Adjust if below minimum
    const tabWidth = Math.max(idealWidth, minTabWidth);
    
    // Calculate total width of all tabs
    const totalWidth = (tabWidth * orderedTables.length) + (spacing * (orderedTables.length - 1));
    
    // Calculate starting position (centered)
    const startX = (windowWidth - totalWidth) / 2;
    
    // Create positions for each tab
    const newPositions = orderedTables.map((_, index) => {
      const x = startX + (index * (tabWidth + spacing));
      return { x, y: baseY };
    });
    
    setPositions(newPositions);
    
    // Update on window resize
    const handleResize = () => {
      // Recalculate positions on window resize
      const newWindowWidth = window.innerWidth;
      const newWindowHeight = window.innerHeight;
      
      const newBaseY = newWindowHeight - 60;
      const newIdealWidth = Math.min(maxTabWidth, 
        (newWindowWidth * 0.8) / orderedTables.length);
      const newTabWidth = Math.max(newIdealWidth, minTabWidth);
      const newTotalWidth = (newTabWidth * orderedTables.length) + (spacing * (orderedTables.length - 1));
      const newStartX = (newWindowWidth - newTotalWidth) / 2;
      
      const updatedPositions = orderedTables.map((_, index) => {
        const x = newStartX + (index * (newTabWidth + spacing));
        return { x, y: newBaseY };
      });
      
      setPositions(updatedPositions);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [orderedTables, mounted]);
  
  // Only render if mounted and has tables
  if (!mounted || !orderedTables.length) return null;
  
  return (
    <div className={styles.tabsContainer}>
      {orderedTables.map((table, index) => {
        // Determine if this tab is loading
        const isLoading = loadingTableId === table.key;
        
        return (
          <motion.div
            key={`tab-${table.key}-${index}`}
            className={
              `${styles.tab} 
               ${activeTableId === table.key ? styles.activeTab : ''} 
               ${table.key === 'create_new' ? styles.createNewTab : ''}
               ${isLoading ? styles.loadingTab : ''}`
            }
            style={{
              position: 'fixed',
              left: positions[index]?.x || 0,
              top: positions[index]?.y || 0,
              width: '200px',
              height: '40px',
            }}
            onClick={() => {
              if (!isLoading) { // Disable click if loading
                onTableExpand(table.key);
                onTableSelect(table);
              }
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={isLoading ? {} : { y: -5 }} // Disable hover effect if loading
          >
            <div className={styles.tabContent}>
              <span className={styles.tabIcon}>
                {isLoading 
                  ? <span className={styles.loadingSpinner} /> 
                  : table.key === 'create_new'
                    ? getIcon('analytics')
                    : table.rows.length > 0
                      ? getIcon(table.rows[0].icon)
                      : getIcon('file')}
              </span>
              <span className={styles.tabTitle}>{table.title}</span>
            </div>
            <button className={styles.expandButton} disabled={isLoading}>
              {isLoading ? (
                <span className={styles.loadingDot} />
              ) : (
                <Expand size={16} />
              )}
            </button>
          </motion.div>
        );
      })}
    </div>
  );
} 