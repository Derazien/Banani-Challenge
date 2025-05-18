import React from "react";
import styles from "./prompt-suggestions.module.css";

interface PromptSuggestionsProps {
  onSuggestionClick: (suggestion: string) => void;
  loading: boolean;
}

const suggestions = [
  "Table for CRM with recent sales transactions",
  "Table with 5 rows displaying company documents with dates and actions",
];

export function PromptSuggestions({ onSuggestionClick, loading }: PromptSuggestionsProps) {
  return (
    <div className={styles.suggestionsContainer}>
      <div className={styles.suggestionsContent}>
        <div className={styles.suggestionsTitle}>Example prompts:</div>
        <ul className={styles.suggestionsList}>
          {suggestions.map((s) => (
            <li
              key={s}
              className={`${styles.suggestionItem} ${loading ? styles.suggestionItemDisabled : ""}`}
              onClick={() => !loading && onSuggestionClick(s)}
              aria-disabled={loading}
            >
              {s}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
} 