'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './styles.module.css';

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

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onClose,
  type = 'warning'
}: ConfirmDialogProps) {
  const [mounted, setMounted] = useState(false);
  
  // Mount state for portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  
  // Exit early if dialog is closed or component is not mounted
  if (!isOpen || !mounted) return null;
  
  // Create portal content
  const dialogContent = (
    <div 
      className={styles.backdrop}
      onClick={(e) => {
        // Close on backdrop click
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={styles.dialog}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.dialogHeader}>
          {type === 'delete' && (
            <div className={`${styles.dialogIcon} ${styles.deleteIcon}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
          )}
          {type === 'warning' && (
            <div className={`${styles.dialogIcon} ${styles.warningIcon}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          )}
          {type === 'info' && (
            <div className={`${styles.dialogIcon} ${styles.infoIcon}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          )}
          <div className={styles.dialogContent}>
            <h3 className={styles.dialogTitle}>
              {title}
            </h3>
            <p className={styles.dialogMessage}>
              {message}
            </p>
          </div>
        </div>
        
        <div className={styles.dialogActions}>
          <button
            type="button"
            onClick={onClose}
            className={styles.cancelButton}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`${styles.confirmButton} ${styles[`${type}Button`]}`}
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
} 