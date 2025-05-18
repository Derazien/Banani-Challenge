import React, { useState, useEffect } from 'react';

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
    <form onSubmit={handleSubmit} className="space-y-4">
      {getSortedEntries().map(([key, value]) => {
        const isReadOnly = readOnlyKeys.includes(key);
        const fieldType = getFieldType(key, value);
        
        return (
          <div key={key} className="space-y-1">
            <label htmlFor={`field-${key}`} className="block text-sm font-medium text-gray-700">
              {formatLabel(key)}
            </label>
            
            {fieldType === 'checkbox' ? (
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  id={`field-${key}`}
                  checked={!!formValues[key]}
                  onChange={(e) => handleChange(key, e.target.checked)}
                  disabled={isReadOnly}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:opacity-50"
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
                className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                  focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm
                  ${isReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              />
            )}
          </div>
        );
      })}
      
      <div className="pt-4 flex justify-end space-x-3 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Save Changes
        </button>
      </div>
    </form>
  );
} 