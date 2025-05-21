'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import { Check, AlertCircle, Save, X } from 'lucide-react';
import styles from './styles.module.css';

interface EditFormProps {
  item: Record<string, any>;
  onSave: (updatedData: Record<string, any>) => void;
  onCancel: () => void;
}

/**
 * @component
 * @param {EditFormProps} props - Component properties
 * Form component for editing items with dynamic field detection
 */
export function EditForm({ item, onSave, onCancel }: EditFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Initialize form data from item
  useEffect(() => {
    setFormData({ ...item });
    setIsDirty(false);
  }, [item]);

  /**
   * @function
   * @param {React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>} e - Change event
   * @returns {void}
   * Handle input changes with appropriate type conversion
   */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    // Convert values to appropriate types
    let parsedValue: any = value;
    
    // Handle number inputs
    if (type === 'number') {
      parsedValue = value === '' ? '' : Number(value);
    }
    
    // Handle checkbox inputs
    if (type === 'checkbox') {
      parsedValue = (e.target as HTMLInputElement).checked;
    }
    
    // Handle date inputs
    if (type === 'date' || type === 'datetime-local') {
      parsedValue = value === '' ? null : value;
    }
    
    setFormData((prev) => ({
      ...prev,
      [name]: parsedValue,
    }));
    
    setIsDirty(true);

    // Clear error when field is modified
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  /**
   * @function
   * @returns {boolean} Whether the form is valid
   * Validate form fields and set error messages
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Ensure required fields are filled
    Object.entries(formData).forEach(([key, value]) => {
      // Check if field is required (this is a simple example - you'd want to customize this)
      const isRequired = key === 'id' || key === 'name' || key === 'title';
      
      if (isRequired && (value === undefined || value === null || value === '')) {
        newErrors[key] = `${formatFieldName(key)} is required`;
      }
      
      // Validate email fields
      if (key.includes('email') && value && !validateEmail(value as string)) {
        newErrors[key] = 'Please enter a valid email address';
      }
      
      // Validate URL fields
      if ((key.includes('url') || key.includes('website')) && 
          value && !validateUrl(value as string)) {
        newErrors[key] = 'Please enter a valid URL';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  /**
   * @function
   * @param {string} email - Email to validate
   * @returns {boolean} Whether the email is valid
   * Validate email format
   */
  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };
  
  /**
   * @function
   * @param {string} url - URL to validate
   * @returns {boolean} Whether the URL is valid
   * Validate URL format
   */
  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  /**
   * @function
   * @param {string} key - Field key
   * @returns {string} Formatted field name
   * Format field names to be more readable
   */
  const formatFieldName = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/_/g, ' ')         // Replace underscores with spaces
      .replace(/^./, str => str.toUpperCase()); // Capitalize first letter
  };

  /**
   * @function
   * @param {React.FormEvent} e - Form submit event
   * @returns {Promise<void>}
   * Handle form submission with validation
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSubmitting(true);
      try {
        // Preserve the icon and ID fields
        const preservedData = {
          ...formData,
          icon: formData.icon || item.icon, // Keep the icon if it exists
          id: formData.id || item.id,       // Keep the ID if it exists
        };
        
        await onSave(preservedData);
        setIsDirty(false);
      } catch (error) {
        console.error('Error saving data:', error);
        setErrors({ form: 'Failed to save changes. Please try again.' });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  /**
   * @function
   * @param {string} key - Field key
   * @param {any} value - Field value
   * @returns {string} Appropriate input type
   * Determine field type based on key and value
   */
  const getFieldType = (key: string, value: any): string => {
    // Common field types based on field name
    if (key === 'email' || key.includes('email')) return 'email';
    if (key === 'password' || key.includes('password')) return 'password';
    if (key === 'url' || key.includes('url') || key.includes('website')) return 'url';
    if (key === 'phone' || key.includes('phone') || key.includes('tel')) return 'tel';
    
    // Field types based on value type
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'checkbox';
    
    // Date fields
    if (key.includes('date')) return 'date';
    if (key.includes('time')) return 'time';
    if (key.includes('datetime')) return 'datetime-local';
    
    // Default to text for strings and other types
    return 'text';
  };

  /**
   * @function
   * @returns {Object} Grouped form fields
   * Group fields into categories for better organization
   */
  const getFieldGroups = () => {
    // Fields that should appear at the top (important fields)
    const priorityFields = ['name', 'title', 'description', 'summary'];
    
    // Fields related to dates and times
    const dateTimeFields = Object.keys(formData).filter(key => 
      key.includes('date') || key.includes('time') || key.includes('created') || key.includes('updated')
    );
    
    // Fields related to metadata
    const metaFields = Object.keys(formData).filter(key => 
      key.includes('tag') || key.includes('category') || key.includes('type') || key.includes('status')
    );
    
    // Contact information fields
    const contactFields = Object.keys(formData).filter(key => 
      key.includes('email') || key.includes('phone') || key.includes('address') || 
      key.includes('contact') || key.includes('website') || key.includes('url')
    );
    
    // Filter out fields that will be in other groups and system fields
    const excludedFields = [
      'id', 'icon', ...priorityFields, ...dateTimeFields, ...metaFields, ...contactFields
    ];
    
    const otherFields = Object.keys(formData).filter(key => 
      !excludedFields.includes(key) && !key.startsWith('_')
    );
    
    return {
      priority: priorityFields.filter(key => key in formData),
      dateTime: dateTimeFields,
      meta: metaFields,
      contact: contactFields,
      other: otherFields
    };
  };

  // Get the field groups
  const fieldGroups = getFieldGroups();

  return (
    <motion.form 
      onSubmit={handleSubmit} 
      className={styles.editForm}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* ID field (read-only) */}
      {formData.id && (
        <motion.div 
          className={styles.idBadge}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className={styles.idLabel}>ID:</span>
          <span className={styles.idValue}>{formData.id}</span>
        </motion.div>
      )}
      
      {/* Form error message */}
      {errors.form && (
        <motion.div 
          className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md flex items-center space-x-2"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <AlertCircle size={16} />
          <span>{errors.form}</span>
        </motion.div>
      )}
      
      {/* Priority fields */}
      {fieldGroups.priority.length > 0 && (
        <div className="space-y-4">
          {fieldGroups.priority.map((key, index) => (
            <motion.div 
              key={key} 
              className="space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Label htmlFor={key} className={styles.editFieldLabel}>{formatFieldName(key)}</Label>
              {typeof formData[key] === 'string' && formData[key].length > 50 ? (
                <Textarea
                  id={key}
                  name={key}
                  value={formData[key] || ''}
                  onChange={handleChange}
                  rows={3}
                  className={errors[key] ? 'border-red-300' : styles.editField}
                />
              ) : (
                <Input
                  id={key}
                  name={key}
                  type={getFieldType(key, formData[key])}
                  value={formData[key] === null ? '' : formData[key]}
                  onChange={handleChange}
                  className={errors[key] ? 'border-red-300' : styles.editField}
                  placeholder={`Enter ${formatFieldName(key).toLowerCase()}`}
                />
              )}
              {errors[key] && (
                <p className={styles.errorText}>
                  <AlertCircle size={12} className="mr-1" />
                  {errors[key]}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      )}
      
      {/* Contact information fields */}
      {fieldGroups.contact.length > 0 && (
        <motion.div 
          className={styles.fieldGroup}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className={styles.fieldGroupTitle}>Contact Information</h3>
          <div className={styles.fieldsGrid}>
            {fieldGroups.contact.map((key) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key} className={styles.editFieldLabel}>{formatFieldName(key)}</Label>
                <Input
                  id={key}
                  name={key}
                  type={getFieldType(key, formData[key])}
                  value={formData[key] === null ? '' : formData[key]}
                  onChange={handleChange}
                  className={errors[key] ? 'border-red-300' : styles.editField}
                  placeholder={`Enter ${formatFieldName(key).toLowerCase()}`}
                />
                {errors[key] && (
                  <p className={styles.errorText}>{errors[key]}</p>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
      
      {/* Metadata fields */}
      {fieldGroups.meta.length > 0 && (
        <motion.div 
          className={styles.fieldGroup}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <h3 className={styles.fieldGroupTitle}>Metadata</h3>
          <div className={styles.fieldsGrid}>
            {fieldGroups.meta.map((key) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key} className={styles.editFieldLabel}>{formatFieldName(key)}</Label>
                <Input
                  id={key}
                  name={key}
                  type={getFieldType(key, formData[key])}
                  value={formData[key] === null ? '' : formData[key]}
                  onChange={handleChange}
                  className={errors[key] ? 'border-red-300' : styles.editField}
                />
                {errors[key] && (
                  <p className={styles.errorText}>{errors[key]}</p>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
      
      {/* Date and time fields */}
      {fieldGroups.dateTime.length > 0 && (
        <motion.div 
          className={styles.fieldGroup}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className={styles.fieldGroupTitle}>Dates & Times</h3>
          <div className={styles.fieldsGrid}>
            {fieldGroups.dateTime.map((key) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key} className={styles.editFieldLabel}>{formatFieldName(key)}</Label>
                <Input
                  id={key}
                  name={key}
                  type={getFieldType(key, formData[key])}
                  value={formData[key] === null ? '' : formData[key]}
                  onChange={handleChange}
                  className={errors[key] ? 'border-red-300' : styles.editField}
                />
                {errors[key] && (
                  <p className={styles.errorText}>{errors[key]}</p>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
      
      {/* Other fields */}
      {fieldGroups.other.length > 0 && (
        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          <h3 className={styles.fieldGroupTitle}>Additional Information</h3>
          <div className={styles.fieldsGrid}>
            {fieldGroups.other.map((key) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key} className={styles.editFieldLabel}>{formatFieldName(key)}</Label>
                {typeof formData[key] === 'string' && formData[key].length > 50 ? (
                  <Textarea
                    id={key}
                    name={key}
                    value={formData[key] || ''}
                    onChange={handleChange}
                    rows={2}
                    className={errors[key] ? 'border-red-300' : styles.editField}
                  />
                ) : (
                  <Input
                    id={key}
                    name={key}
                    type={getFieldType(key, formData[key])}
                    value={formData[key] === null ? '' : formData[key]}
                    onChange={handleChange}
                    className={errors[key] ? 'border-red-300' : styles.editField}
                  />
                )}
                {errors[key] && (
                  <p className={styles.errorText}>{errors[key]}</p>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Action buttons */}
      <div className={styles.editActions}>
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          className={styles.editCancelButton}
        >
          <X size={16} className="mr-1" />
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={!isDirty || isSubmitting}
          className={styles.editSubmitButton}
        >
          {isSubmitting ? (
            <span className="inline-flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </span>
          ) : (
            <>
              <Save size={16} className="mr-1" />
              Save
            </>
          )}
        </Button>
      </div>
    </motion.form>
  );
} 