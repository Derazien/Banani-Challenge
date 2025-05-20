'use client';

import React from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';
import { getIcon } from '@/components/icon-registry';
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
      return <Calendar className="w-4 h-4" />;
    }
    
    // Check for URL or link fields
    if (k.includes('url') || k.includes('link') || k.includes('website')) {
      return <Link className="w-4 h-4" />;
    }
    
    // Check for description or text fields
    if (k.includes('desc') || k.includes('text') || k.includes('content') || k.includes('note')) {
      return <FileText className="w-4 h-4" />;
    }
    
    // Check for duration or period fields
    if (k.includes('duration') || k.includes('period')) {
      return <Clock className="w-4 h-4" />;
    }
    
    // Check for tag or category fields
    if (k.includes('tag') || k.includes('category') || k.includes('type')) {
      return <Tag className="w-4 h-4" />;
    }
    
    // Check for ID fields
    if (k.includes('id') || k === 'key') {
      return <Hash className="w-4 h-4" />;
    }
    
    // Check for user or person fields
    if (k.includes('user') || k.includes('name') || k.includes('person')) {
      return <User className="w-4 h-4" />;
    }
    
    // Check for email fields
    if (k.includes('email')) {
      return <Mail className="w-4 h-4" />;
    }
    
    // Check for phone fields
    if (k.includes('phone') || k.includes('mobile') || k.includes('tel')) {
      return <Phone className="w-4 h-4" />;
    }
    
    // Check for location fields
    if (k.includes('location') || k.includes('address') || k.includes('city')) {
      return <MapPin className="w-4 h-4" />;
    }
    
    // Check for price or amount fields
    if (k.includes('price') || k.includes('amount') || k.includes('cost')) {
      return <DollarSign className="w-4 h-4" />;
    }
    
    // Check for percentage fields
    if (k.includes('percent') || k.includes('rate') || k.includes('discount')) {
      return <Percent className="w-4 h-4" />;
    }
    
    // Check for statistical fields
    if (k.includes('count') || k.includes('total') || k.includes('sum') || k.includes('avg')) {
      return <BarChart2 className="w-4 h-4" />;
    }
    
    // If it's a known icon name, use that
    if (k === 'icon' && typeof value === 'string') {
      return <span className="w-4 h-4">{getIcon(value)}</span>;
    }
    
    // Default for unknown fields
    return null;
  };

  // Function to format field values for display
  const formatValue = (key: string, value: any): React.ReactNode => {
    if (value === null || value === undefined) return <span className="text-gray-400 italic">Not provided</span>;
    
    // Special formatting for dates
    if (value instanceof Date || (typeof value === 'string' && key.toLowerCase().includes('date'))) {
      try {
        const date = value instanceof Date ? value : new Date(value);
        return <span className="text-indigo-600">{date.toLocaleString()}</span>;
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
          className="text-blue-600 hover:underline break-all"
        >
          {value}
        </a>
      );
    }
    
    // Format objects and arrays
    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        return (
          <div className="space-y-1">
            {value.length === 0 ? (
              <span className="text-gray-400 italic">Empty array</span>
            ) : (
              value.map((item, idx) => (
                <div key={idx} className="pl-2 border-l-2 border-gray-200">
                  {typeof item === 'object' && item !== null
                    ? <pre className="text-xs font-mono bg-gray-50 p-1 rounded overflow-x-auto">{JSON.stringify(item, null, 2)}</pre>
                    : <span>{String(item)}</span>
                  }
                </div>
              ))
            )}
          </div>
        );
      }
      
      return (
        <pre className="text-xs font-mono bg-gray-50 p-2 rounded overflow-x-auto max-h-40">{JSON.stringify(value, null, 2)}</pre>
      );
    }
    
    // Format boolean values
    if (typeof value === 'boolean') {
      return value ? 
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Yes</span> : 
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">No</span>;
    }
    
    // Format numeric values
    if (typeof value === 'number') {
      // Format percentages
      if (key.toLowerCase().includes('percent') || key.toLowerCase().includes('rate')) {
        return <span className="font-medium">{value.toFixed(2)}%</span>;
      }
      
      // Format currency
      if (key.toLowerCase().includes('price') || key.toLowerCase().includes('cost') || key.toLowerCase().includes('amount')) {
        return <span className="font-medium">${value.toFixed(2)}</span>;
      }
      
      // Format other numbers
      return <span className="font-medium">{value.toLocaleString()}</span>;
    }
    
    // Default string formatting
    return <span className="break-words">{String(value)}</span>;
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
    <div className="space-y-6">
      {/* Header with title and icon */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center space-x-3 pb-4 border-b border-gray-200"
      >
        {item.icon && (
          <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
            {getIcon(item.icon)}
          </div>
        )}
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{getTitle()}</h2>
          {item.id && <p className="text-sm text-gray-500">ID: {item.id}</p>}
        </div>
      </motion.div>
      
      {/* Important fields section */}
      {commonFields.length > 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-50 p-4 rounded-lg"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {commonFields.map(key => (
              <div key={key} className="flex items-start">
                <div className="mr-2 pt-1 text-gray-400">
                  {getFieldIcon(key, item[key])}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">{formatFieldName(key)}</div>
                  <div className="text-gray-900 font-medium">{formatValue(key, item[key])}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
      
      {/* Detailed fields section */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="divide-y divide-gray-200"
      >
        {detailFields.map(([key, value], index) => (
          <motion.div 
            key={key} 
            className="py-4 flex items-start"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.05 }}
          >
            <div className="mr-3 pt-1 text-gray-400">
              {getFieldIcon(key, value)}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-500">{formatFieldName(key)}</div>
              <div className="mt-1 text-gray-900">{formatValue(key, value)}</div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
} 