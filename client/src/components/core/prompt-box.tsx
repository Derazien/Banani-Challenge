import React from 'react';
import { ShareIcon } from '@/components/icons/ShareIcon';
import styles from './prompt-box.module.css';

interface PromptBoxProps {
  prompt: string;
  setPrompt: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
}

export function PromptBox({ 
  prompt, 
  setPrompt, 
  onSubmit, 
  loading 
}: PromptBoxProps) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  }

  const isDisabled = loading || !prompt.trim();

  return (
    <div className={styles.promptBox}>
      <div className={styles.promptBoxContent}>
        <textarea
          className={styles.promptTextarea}
          placeholder="What kind of table do you want to generate?"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <button
          type="button"
          onClick={onSubmit}
          disabled={isDisabled}
          aria-label="Submit"
          className={`${styles.promptButton} ${isDisabled ? styles.promptButtonDisabled : styles.promptButtonEnabled}`}
        >
          <ShareIcon className={styles.promptButtonIcon} />
        </button>
      </div>
    </div>
  );
} 