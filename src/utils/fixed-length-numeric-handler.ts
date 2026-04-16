/**
 * Utility function to handle fixed-length numeric input behavior
 * Can be used to enhance existing input fields without creating new components
 */

export interface FixedLengthNumericHandler {
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onFocus: (e: React.FocusEvent<HTMLInputElement>) => void;
  onClick: (e: React.MouseEvent<HTMLInputElement>) => void;
}

export function createFixedLengthNumericHandler(
  length: number,
  setValue: (value: string) => void,
  getCurrentValue: () => string
): FixedLengthNumericHandler {
  
  const padValue = (value: string): string => {
    const numericOnly = value.replace(/\D/g, '');
    if (numericOnly === '') {
      return '0'.repeat(length);
    }
    if (numericOnly.length <= length) {
      return numericOnly.padStart(length, '0');
    }
    return numericOnly.slice(-length);
  };

  return {
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = padValue(e.target.value);
      setValue(newValue);
    },

    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
      const input = e.currentTarget;
      const key = e.key;
      const currentValue = getCurrentValue();
      
      // Handle backspace
      if (key === 'Backspace') {
        e.preventDefault();
        const cursorPosition = input.selectionStart || 0;
        
        if (cursorPosition > 0) {
          const beforeCursor = currentValue.slice(0, cursorPosition - 1);
          const afterCursor = currentValue.slice(cursorPosition);
          const newValue = (beforeCursor + afterCursor + '0').slice(0, length);
          
          setValue(newValue);
          
          setTimeout(() => {
            input.setSelectionRange(cursorPosition - 1, cursorPosition - 1);
          }, 0);
        }
        return;
      }

      // Handle delete
      if (key === 'Delete') {
        e.preventDefault();
        const cursorPosition = input.selectionStart || 0;
        
        if (cursorPosition < length) {
          const beforeCursor = currentValue.slice(0, cursorPosition);
          const afterCursor = currentValue.slice(cursorPosition + 1);
          const newValue = (beforeCursor + afterCursor + '0').slice(0, length);
          
          setValue(newValue);
          
          setTimeout(() => {
            input.setSelectionRange(cursorPosition, cursorPosition);
          }, 0);
        }
        return;
      }

      // Handle numeric input
      if (/^\d$/.test(key)) {
        e.preventDefault();
        const cursorPosition = input.selectionStart || 0;
        
        const beforeCursor = currentValue.slice(0, cursorPosition);
        const afterCursor = currentValue.slice(cursorPosition + 1);
        const newValue = (beforeCursor + key + afterCursor).slice(0, length);
        
        setValue(newValue);
        
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
    },

    onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
      e.target.select();
    },

    onClick: (e: React.MouseEvent<HTMLInputElement>) => {
      e.stopPropagation();
    }
  };
}

/**
 * Example usage in a React component:
 * 
 * const [pin, setPin] = useState('0000');
 * const pinHandler = createFixedLengthNumericHandler(4, setPin, () => pin);
 * 
 * return (
 *   <Input
 *     type="text"
 *     value={pin}
 *     {...pinHandler}
 *     className="font-mono text-center"
 *     maxLength={4}
 *   />
 * );
 */
