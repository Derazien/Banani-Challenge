'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { getIcon } from '@/components/icon-registry';
import styles from './styles.module.css';
import { Calendar, Link, FileText, Clock, Tag, Hash, User, Mail, Phone, MapPin, DollarSign, Percent, BarChart2 } from 'lucide-react';

interface ItemDetailViewProps {
  item: Record<string, any>;
}

export function ItemDetailView({ item }: ItemDetailViewProps) {
  // Function to format field names to be more readable
  const formatFieldName = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/_/g, ' ') // Replace underscores with spaces
      .replace(/^./, str => str.toUpperCase()); // Capitalize first letter
  };

  // Get an appropriate icon for a field based on its name and value
  const getFieldIcon = (key: string, value: any): React.ReactNode => {
    const k = key.toLowerCase();
    
    // Check for date-related fields
    if (k.includes('date') || k.includes('time') || value instanceof Date) {
      return <Calendar className={styles.fieldIcon} />;
    }
    
    // Check for URL or link fields
    if (k.includes('url') || k.includes('link') || k.includes('website')) {
      return <Link className={styles.fieldIcon} />;
    }
    
    // Check for description or text fields
    if (k.includes('desc') || k.includes('text') || k.includes('content') || k.includes('note')) {
      return <FileText className={styles.fieldIcon} />;
    }
    
    // Check for duration or period fields
    if (k.includes('duration') || k.includes('period')) {
      return <Clock className={styles.fieldIcon} />;
    }
    
    // Check for tag or category fields
    if (k.includes('tag') || k.includes('category') || k.includes('type')) {
      return <Tag className={styles.fieldIcon} />;
    }
    
    // Check for ID fields
    if (k.includes('id') || k === 'key') {
      return <Hash className={styles.fieldIcon} />;
    }
    
    // Check for user or person fields
    if (k.includes('user') || k.includes('name') || k.includes('person')) {
      return <User className={styles.fieldIcon} />;
    }
    
    // Check for email fields
    if (k.includes('email')) {
      return <Mail className={styles.fieldIcon} />;
    }
    
    // Check for phone fields
    if (k.includes('phone') || k.includes('mobile') || k.includes('tel')) {
      return <Phone className={styles.fieldIcon} />;
    }
    
    // Check for location fields
    if (k.includes('location') || k.includes('address') || k.includes('city')) {
      return <MapPin className={styles.fieldIcon} />;
    }
    
    // Check for price or amount fields
    if (k.includes('price') || k.includes('amount') || k.includes('cost')) {
      return <DollarSign className={styles.fieldIcon} />;
    }
    
    // Check for percentage fields
    if (k.includes('percent') || k.includes('rate') || k.includes('discount')) {
      return <Percent className={styles.fieldIcon} />;
    }
    
    // Check for statistical fields
    if (k.includes('count') || k.includes('total') || k.includes('sum') || k.includes('avg')) {
      return <BarChart2 className={styles.fieldIcon} />;
    }
    
    // If it's a known icon name, use that
    if (k === 'icon' && typeof value === 'string') {
      return <span className={styles.fieldIcon}>{getIcon(value)}</span>;
    }
    
    // Default for unknown fields
    return null;
  };

  // Function to format field values for display
  const formatValue = (key: string, value: any): React.ReactNode => {
    if (value === null || value === undefined) {
      return <span className={styles.emptyValue}>Not provided</span>;
    }
    
    // Special formatting for dates
    if (value instanceof Date || (typeof value === 'string' && key.toLowerCase().includes('date'))) {
      try {
        const date = value instanceof Date ? value : new Date(value);
        return <span className={styles.dateValue}>{date.toLocaleString()}</span>;
      } catch {
        // If it looks like a date but isn't valid, just return the string value
        return String(value);
      }
    }
    
    // Special formatting for URLs
    if (typeof value === 'string' && 
        (value.startsWith('http') || key.toLowerCase().includes('url') || key.toLowerCase().includes('website'))) {
      return (
        <a 
          href={value} 
          target="_blank" 
          rel="noopener noreferrer" 
          className={styles.linkValue}
        >
          {value}
        </a>
      );
    }
    
    // Format objects and arrays
    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        return (
          <div className={styles.arrayContainer}>
            {value.length === 0 ? (
              <span className={styles.emptyValue}>Empty array</span>
            ) : (
              value.map((item, idx) => (
                <div key={idx} className={styles.arrayItem}>
                  {typeof item === 'object' && item !== null
                    ? <pre className={styles.codeBlock}>{JSON.stringify(item, null, 2)}</pre>
                    : <span>{String(item)}</span>
                  }
                </div>
              ))
            )}
          </div>
        );
      }
      
      return (
        <pre className={styles.codeBlock}>{JSON.stringify(value, null, 2)}</pre>
      );
    }
    
    // Format boolean values
    if (typeof value === 'boolean') {
      return value ? 
        <span className={styles.booleanTrue}>Yes</span> : 
        <span className={styles.booleanFalse}>No</span>;
    }
    
    // Format numeric values
    if (typeof value === 'number') {
      // Format percentages
      if (key.toLowerCase().includes('percent') || key.toLowerCase().includes('rate')) {
        return <span className={styles.percentValue}>{value.toFixed(2)}%</span>;
      }
      
      // Format currency
      if (key.toLowerCase().includes('price') || key.toLowerCase().includes('cost') || key.toLowerCase().includes('amount')) {
        return <span className={styles.currencyValue}>${value.toFixed(2)}</span>;
      }
      
      // Format other numbers
      return <span className={styles.numberValue}>{value.toLocaleString()}</span>;
    }
    
    // Default string formatting
    return <span className={styles.textValue}>{String(value)}</span>;
  };

  // Filter out internal fields and common fields to show at the top
  const importantFields = ['id', 'name', 'title', 'description', 'icon'];
  const commonFields = importantFields.filter(field => field in item);
  const detailFields = Object.entries(item)
    .filter(([key]) => !importantFields.includes(key) && !key.startsWith('_') && key !== 'actions');

  const getTitle = () => {
    // Try to get a meaningful title
    if (item.name) return item.name;
    if (item.title) return item.title;
    if (item.label) return item.label;
    if (item.id) return `Item #${item.id}`;
    return 'Item Details';
  };

  return (
    <div className={styles.detailContainer}>
      {/* Shine effect overlay */}
      <div className={styles.shineEffect}>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 0.2 }}
          className={styles.shineGradient}
        />
      </div>
      
      {/* Header with title and icon */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={styles.detailHeader}
      >
        {item.icon && (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring" }}
            className={styles.iconContainer}
          >
            {getIcon(item.icon)}
          </motion.div>
        )}
        <div>
          <motion.h2 
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className={styles.detailTitle}
          >
            {getTitle()}
          </motion.h2>
          {item.id && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={styles.detailId}
            >
              ID: {item.id}
            </motion.p>
          )}
        </div>
      </motion.div>
      
      {/* Important fields section */}
      {commonFields.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={styles.importantFieldsContainer}
        >
          <div className={styles.importantFieldsGrid}>
            {commonFields.map((key, index) => (
              <motion.div 
                key={key} 
                className={styles.importantField}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + index * 0.05 }}
              >
                <div className={styles.fieldIconContainer}>
                  {getFieldIcon(key, item[key])}
                </div>
                <div>
                  <div className={styles.fieldLabel}>{formatFieldName(key)}</div>
                  <div className={styles.fieldValue}>{formatValue(key, item[key])}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
      
      {/* Detailed fields section */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className={styles.detailFieldsContainer}
      >
        {detailFields.map(([key, value], index) => (
          <motion.div 
            key={key} 
            className={styles.detailField}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.05 }}
          >
            <div className={styles.fieldIconContainer}>
              {getFieldIcon(key, value)}
            </div>
            <div className={styles.fieldContent}>
              <div className={styles.fieldLabel}>{formatFieldName(key)}</div>
              <div className={styles.fieldValue}>{formatValue(key, value)}</div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
} 