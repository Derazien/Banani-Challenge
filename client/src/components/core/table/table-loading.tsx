'use client';

import React from 'react';
import AtomicSpinner from 'atomic-spinner';
import styles from './styles.module.css';

/**
 * @component
 * @param {object} props - Component properties (none required)
 * Loading state for the table component
 */
export function TableLoadingContent() {
  return (
    <div className={styles.loadingContainer}>
      <AtomicSpinner 
        atomSize={220} 
        electronPathCount={4}
        electronsPerPath={6}
        electronPathColor={'rgba(126, 148, 223, 0.4)'} 
        electronColorPalette={['#7e94df', '#a3b3ed', '#c9d2f8']} 
        nucleusParticleFillColor={'#5568b8'} 
        nucleusParticleBorderColor={'#3e4e8c'} 
        nucleusLayerCount={3}
        nucleusParticlesPerLayer={4}
        electronSpeed={0.3}
        nucleusSpeed={0.5}
      />
    </div>
  );
} 