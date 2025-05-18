'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onClose: () => void;
  type?: 'delete' | 'warning' | 'info';
}

const ConfirmDialog = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onClose,
  type = 'warning'
}: ConfirmDialogProps) => {
  const [mounted, setMounted] = useState(false);
  
  // Mount state for portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  
  // Get colors based on type
  const getTypeStyles = () => {
    switch (type) {
      case 'delete':
        return {
          confirmBtn: 'bg-red-600 hover:bg-red-700',
          icon: 'text-red-500'
        };
      case 'warning':
        return {
          confirmBtn: 'bg-yellow-600 hover:bg-yellow-700',
          icon: 'text-yellow-500'
        };
      default:
        return {
          confirmBtn: 'bg-blue-600 hover:bg-blue-700',
          icon: 'text-blue-500'
        };
    }
  };
  
  const typeStyles = getTypeStyles();
  
  // Exit early if dialog is closed or component is not mounted
  if (!isOpen || !mounted) return null;
  
  // Create portal content
  const dialogContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={(e) => {
        // Close on backdrop click
        if (e.target === e.currentTarget) onClose();
      }}
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-5"
        style={{
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          maxWidth: '28rem',
          width: '100%',
          position: 'relative',
          zIndex: 10000
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start mb-4">
          {type === 'delete' && (
            <div className={`mr-3 flex-shrink-0 ${typeStyles.icon}`} style={{ color: type === 'delete' ? '#EF4444' : '#EAB308' }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
          )}
          {type === 'warning' && (
            <div className={`mr-3 flex-shrink-0 ${typeStyles.icon}`} style={{ color: '#EAB308' }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          )}
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {title}
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {message}
            </p>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md ${typeStyles.confirmBtn}`}
            style={{ 
              backgroundColor: type === 'delete' ? '#DC2626' : '#2563EB',
              color: 'white'
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );

  // Use portal to render the dialog
  return createPortal(
    dialogContent,
    document.body
  );
};

export { ConfirmDialog }; 