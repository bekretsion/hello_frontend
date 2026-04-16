import { useState, useCallback } from 'react';

interface UseFixedLengthNumericOptions {
  length: number;
  initialValue?: string;
  onValueChange?: (value: string) => void;
}

export function useFixedLengthNumeric({
  length,
  initialValue = '',
  onValueChange
}: UseFixedLengthNumericOptions) {
  // Initialize with padded zeros or provided value
  const getInitialValue = () => {
    if (initialValue) {
      return initialValue.padStart(length, '0').slice(-length);
    }
    return '0'.repeat(length);
  };

  const [value, setValue] = useState(getInitialValue());

  const handleChange = useCallback((inputValue: string) => {
    // Remove all non-numeric characters
    const numericOnly = inputValue.replace(/\D/g, '');
    
    if (numericOnly === '') {
      // If empty, reset to all zeros
      const newValue = '0'.repeat(length);
      setValue(newValue);
      onValueChange?.(newValue);
      return;
    }

    // Handle the case where user is typing new digits
    let newValue: string;
    
    if (numericOnly.length <= length) {
      // Pad with leading zeros to maintain fixed length
      newValue = numericOnly.padStart(length, '0');
    } else {
      // If input exceeds length, take the rightmost digits
      newValue = numericOnly.slice(-length);
    }

    setValue(newValue);
    onValueChange?.(newValue);
  }, [length, onValueChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const key = e.key;
    
    // Handle backspace to shift zeros from right
    if (key === 'Backspace') {
      e.preventDefault();
      const currentValue = input.value;
      const cursorPosition = input.selectionStart || 0;
      
      if (cursorPosition > 0) {
        // Remove digit at cursor position and shift zeros from right
        const beforeCursor = currentValue.slice(0, cursorPosition - 1);
        const afterCursor = currentValue.slice(cursorPosition);
        const newValue = (beforeCursor + afterCursor + '0').slice(0, length);
        
        setValue(newValue);
        onValueChange?.(newValue);
        
        // Set cursor position after state update
        setTimeout(() => {
          input.setSelectionRange(cursorPosition - 1, cursorPosition - 1);
        }, 0);
      }
      return;
    }

    // Handle delete key
    if (key === 'Delete') {
      e.preventDefault();
      const currentValue = input.value;
      const cursorPosition = input.selectionStart || 0;
      
      if (cursorPosition < length) {
        // Remove digit at cursor position and shift zeros from right
        const beforeCursor = currentValue.slice(0, cursorPosition);
        const afterCursor = currentValue.slice(cursorPosition + 1);
        const newValue = (beforeCursor + afterCursor + '0').slice(0, length);
        
        setValue(newValue);
        onValueChange?.(newValue);
        
        // Keep cursor at same position
        setTimeout(() => {
          input.setSelectionRange(cursorPosition, cursorPosition);
        }, 0);
      }
      return;
    }

    // Handle numeric input
    if (/^\d$/.test(key)) {
      e.preventDefault();
      const currentValue = input.value;
      const cursorPosition = input.selectionStart || 0;
      
      // Replace digit at cursor position
      const beforeCursor = currentValue.slice(0, cursorPosition);
      const afterCursor = currentValue.slice(cursorPosition + 1);
      const newValue = (beforeCursor + key + afterCursor).slice(0, length);
      
      setValue(newValue);
      onValueChange?.(newValue);
      
      // Move cursor to next position
      setTimeout(() => {
        const nextPosition = Math.min(cursorPosition + 1, length);
        input.setSelectionRange(nextPosition, nextPosition);
      }, 0);
      return;
    }

    // Allow navigation keys
    if (['ArrowLeft', 'ArrowRight', 'Home', 'End', 'Tab'].includes(key)) {
      return;
    }

    // Block all other keys
    e.preventDefault();
  }, [length, onValueChange]);

  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    // Select all on focus for easy replacement
    e.target.select();
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLInputElement>) => {
    // Allow precise cursor positioning on click
    e.stopPropagation();
  }, []);

  return {
    value,
    handleChange,
    handleKeyDown,
    handleFocus,
    handleClick,
    setValue: (newValue: string) => {
      const paddedValue = newValue.padStart(length, '0').slice(-length);
      setValue(paddedValue);
      onValueChange?.(paddedValue);
    }
  };
}
