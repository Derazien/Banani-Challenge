'use client';

import React from 'react';
import { cn } from '../../lib/utils';

interface ItemDetailViewProps {
  item: Record<string, any>;
}

export function ItemDetailView({ item }: ItemDetailViewProps) {
  // Function to format field names to be more readable
  const formatFieldName = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, str => str.toUpperCase()); // Capitalize first letter
  };

  // Function to format field values for display
  const formatValue = (value: any): React.ReactNode => {
    if (value === null || value === undefined) return <span className="text-gray-400">-</span>;
    
    if (typeof value === 'object') {
      if (value instanceof Date) {
        return value.toLocaleDateString();
      }
      try {
        return <span className="font-mono text-sm">{JSON.stringify(value, null, 2)}</span>;
      } catch {
        return String(value);
      }
    }
    
    if (typeof value === 'boolean') {
      return value ? 
        <span className="text-green-600 font-medium">Yes</span> : 
        <span className="text-red-600 font-medium">No</span>;
    }
    
    return String(value);
  };

  // Filter out internal fields
  const displayableFields = Object.entries(item).filter(
    ([key]) => !key.startsWith('_') && key !== '_id'
  );

  return (
    <div className="space-y-4">
      {item.id && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {item.name || item.title || `Item #${item.id}`}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">ID: {item.id}</p>
        </div>
      )}
      
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {displayableFields.map(([key, value]) => (
          <div key={key} className="py-3 flex flex-col sm:flex-row">
            <div className="w-full sm:w-1/3 text-sm font-medium text-gray-500 dark:text-gray-400">
              {formatFieldName(key)}
            </div>
            <div className="w-full sm:w-2/3 text-gray-900 dark:text-white">
              {formatValue(value)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 