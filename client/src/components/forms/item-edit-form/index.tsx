'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import styles from './styles.module.css';

interface ItemEditFormProps {
  item: Record<string, any>;
  onSave: (updatedItem: Record<string, any>) => void;
  onCancel: () => void;
  readOnlyKeys?: string[];
}

export function ItemEditForm({ 
  item, 
  onSave, 
  onCancel, 
  readOnlyKeys = ['id', '_id'] 
}: ItemEditFormProps) {
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  
  useEffect(() => {
    // Initialize form values from item
    setFormValues({ ...item });
  }, [item]);
  
  const handleChange = (key: string, value: any) => {
    setFormValues(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formValues);
  };
  
  // Determine field type based on value type
  const getFieldType = (key: string, value: any): string => {
    // Always treat specific keys as certain types 
    if (/date|time/i.test(key) && typeof value === 'string') return 'datetime-local';
    if (/email/i.test(key)) return 'email';
    if (/phone|tel/i.test(key)) return 'tel';
    if (/url|website/i.test(key)) return 'url';
    if (/color/i.test(key)) return 'color';
    
    // Check value type
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'checkbox';
    
    // Date strings detection (common formats)
    const isDateString = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value);
    if (isDateString) return 'date';
    
    // Default to text
    return 'text';
  };
  
  // Format label from key
  const formatLabel = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
      .replace(/_/g, ' '); // Replace underscores with spaces
  };
  
  // Get sorted entries for the form, placing important fields first
  const getSortedEntries = () => {
    return Object.entries(item)
      .filter(([key]) => !key.startsWith('_')) // Exclude internal fields
      .sort(([keyA], [keyB]) => {
        // Put name and title at the top
        if (['name', 'title'].includes(keyA)) return -1;
        if (['name', 'title'].includes(keyB)) return 1;
        
        // Then put ID fields
        const isIdA = /(^id$|Id$)/.test(keyA);
        const isIdB = /(^id$|Id$)/.test(keyB);
        if (isIdA && !isIdB) return -1;
        if (!isIdA && isIdB) return 1;
        
        return keyA.localeCompare(keyB);
      });
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={styles.formContainer}
    >
      {/* Background effect */}
      <div className={styles.backgroundEffect}>
        <motion.div 
          className={styles.gradientBackground}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
      </div>
      
      <div className={styles.contentContainer}>
        <motion.h3 
          className={styles.formTitle}
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {item.name || item.title || "Edit Item"}
        </motion.h3>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.fieldsGrid}>
            {getSortedEntries().map(([key, value], index) => {
              const isReadOnly = readOnlyKeys.includes(key);
              const fieldType = getFieldType(key, value);
              
              return (
                <motion.div 
                  key={key} 
                  className={styles.fieldContainer}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.03 }}
                >
                  <label 
                    htmlFor={`field-${key}`} 
                    className={styles.fieldLabel}
                  >
                    {formatLabel(key)}
                  </label>
                  
                  {fieldType === 'checkbox' ? (
                    <div className={styles.checkboxContainer}>
                      <input
                        type="checkbox"
                        id={`field-${key}`}
                        checked={!!formValues[key]}
                        onChange={(e) => handleChange(key, e.target.checked)}
                        disabled={isReadOnly}
                        className={styles.checkboxInput}
                      />
                    </div>
                  ) : (
                    <input
                      type={fieldType}
                      id={`field-${key}`}
                      value={formValues[key] || ''}
                      onChange={(e) => handleChange(key, fieldType === 'number' ? 
                        Number(e.target.value) : e.target.value)}
                      readOnly={isReadOnly}
                      disabled={isReadOnly}
                      className={cn(
                        styles.textInput,
                        isReadOnly ? styles.readOnlyInput : ''
                      )}
                    />
                  )}
                </motion.div>
              );
            })}
          </div>
          
          <motion.div 
            className={styles.formActions}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <button 
              type="button" 
              onClick={onCancel}
              className={styles.cancelButton}
            >
              Cancel
            </button>
            <button 
              type="submit"
              className={styles.saveButton}
            >
              Save
            </button>
          </motion.div>
        </form>
      </div>
    </motion.div>
  );
} 