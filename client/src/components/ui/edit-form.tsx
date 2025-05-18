'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Textarea } from './textarea';

interface EditFormProps {
  item: Record<string, any>;
  onSave: (updatedData: Record<string, any>) => void;
  onCancel: () => void;
}

export function EditForm({ item, onSave, onCancel }: EditFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data from item
  useEffect(() => {
    setFormData({ ...item });
  }, [item]);

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when field is modified
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Basic validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Ensure ID is present
    if (!formData.id && item.id) {
      newErrors.id = 'ID is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave(formData);
    }
  };

  // Determine field type based on value
  const getFieldType = (key: string, value: any): string => {
    if (key === 'email') return 'email';
    if (key === 'password') return 'password';
    if (key === 'url') return 'url';
    if (typeof value === 'number') return 'number';
    if (key.includes('date') || key.includes('time')) return 'datetime-local';
    return 'text';
  };

  // Filter out internal fields
  const renderableFields = Object.entries(formData).filter(
    ([key]) => !key.startsWith('_') && key !== 'id'
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* ID field (read-only) */}
      {formData.id && (
        <div className="space-y-2">
          <Label htmlFor="id">ID</Label>
          <Input
            id="id"
            name="id"
            value={formData.id || ''}
            readOnly
            className="bg-gray-50"
          />
        </div>
      )}

      {/* Dynamic fields based on item data */}
      {renderableFields.map(([key, value]) => {
        const fieldType = getFieldType(key, value);
        const fieldLabel = key
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, (str) => str.toUpperCase());

        return (
          <div key={key} className="space-y-2">
            <Label htmlFor={key}>{fieldLabel}</Label>
            {typeof value === 'string' && value.length > 50 ? (
              <Textarea
                id={key}
                name={key}
                value={value}
                onChange={handleChange}
                rows={3}
                className={errors[key] ? 'border-red-500' : ''}
              />
            ) : (
              <Input
                id={key}
                name={key}
                type={fieldType}
                value={value === null ? '' : value}
                onChange={handleChange}
                className={errors[key] ? 'border-red-500' : ''}
              />
            )}
            {errors[key] && (
              <p className="text-xs text-red-500 mt-1">{errors[key]}</p>
            )}
          </div>
        );
      })}

      {/* Action buttons */}
      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button type="submit">Save Changes</Button>
      </div>
    </form>
  );
} 