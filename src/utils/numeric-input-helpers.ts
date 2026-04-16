/**
 * Utility functions to fix numeric input issues like leading zero appending
 */
import React from 'react';

export interface NumericInputHandlers {
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onInput: (e: React.FormEvent<HTMLInputElement>) => void;
  onFocus: (e: React.FocusEvent<HTMLInputElement>) => void;
}

export interface NumericInputOptions {
  min?: number;
  max?: number;
  defaultValue?: number;
  onValueChange: (value: number) => void;
}

/**
 * Creates event handlers for numeric inputs that prevent leading zero issues
 * 
 * @param options Configuration options for the numeric input
 * @returns Object with onChange, onInput, and onFocus handlers
 * 
 * @example
 * const [amount, setAmount] = useState(0);
 * const handlers = createNumericInputHandlers({
 *   min: 0,
 *   max: 1000,
 *   defaultValue: 0,
 *   onValueChange: setAmount
 * });
 * 
 * return (
 *   <Input
 *     type="number"
 *     value={amount}
 *     {...handlers}
 *   />
 * );
 */
export function createNumericInputHandlers(options: NumericInputOptions): NumericInputHandlers {
  const { min = 0, max = Infinity, defaultValue = 0, onValueChange } = options;

  return {
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      
      // Handle empty input
      if (value === '') {
        onValueChange(defaultValue);
        return;
      }
      
      // Parse as number and remove leading zeros
      const numValue = parseInt(value, 10);
      
      // Only update if it's a valid number within range
      if (!isNaN(numValue) && numValue >= min && numValue <= max) {
        onValueChange(numValue);
      }
    },

    onInput: (e: React.FormEvent<HTMLInputElement>) => {
      // Clean up leading zeros in real-time
      const input = e.target as HTMLInputElement;
      const value = input.value;
      
      // If value starts with "0" and has more digits, remove leading zeros
      if (value.length > 1 && value.startsWith('0') && !value.startsWith('0.')) {
        const cleanValue = parseInt(value, 10).toString();
        if (cleanValue !== 'NaN') {
          input.value = cleanValue;
        }
      }
    },

    onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
      // Select all text when focused for easy replacement
      e.target.select();
    }
  };
}

/**
 * Removes leading zeros from a numeric string
 * 
 * @param value The string value to clean
 * @returns Cleaned string without leading zeros
 * 
 * @example
 * removeLeadingZeros('007') // returns '7'
 * removeLeadingZeros('0') // returns '0'
 * removeLeadingZeros('10') // returns '10'
 */
export function removeLeadingZeros(value: string): string {
  if (!value || value === '0') return value;
  
  const numValue = parseInt(value, 10);
  return isNaN(numValue) ? value : numValue.toString();
}

/**
 * Validates if a numeric input value is within the specified range
 * 
 * @param value The value to validate
 * @param min Minimum allowed value
 * @param max Maximum allowed value
 * @returns True if value is valid, false otherwise
 */
export function isValidNumericInput(value: string, min: number = 0, max: number = Infinity): boolean {
  if (value === '') return true; // Allow empty for clearing
  
  const numValue = parseInt(value, 10);
  return !isNaN(numValue) && numValue >= min && numValue <= max;
}

/**
 * Formats a number for display in an input field
 * Ensures no leading zeros except for the value 0 itself
 * 
 * @param value The number to format
 * @returns Formatted string representation
 */
export function formatNumericInputValue(value: number): string {
  return value.toString();
}

/**
 * Higher-order component that wraps an input with numeric input fixes
 * 
 * @example
 * const EnhancedInput = withNumericInputFix(Input, { min: 0, max: 100 });
 * 
 * function MyComponent() {
 *   const [value, setValue] = useState(0);
 *   return <EnhancedInput value={value} onValueChange={setValue} />;
 * }
 */
export function withNumericInputFix<T extends React.ComponentProps<'input'>>(
  Component: React.ComponentType<T>,
  options: Omit<NumericInputOptions, 'onValueChange'>
) {
  return function NumericInputWrapper(
    props: T & { onValueChange: (value: number) => void }
  ) {
    const { onValueChange, ...restProps } = props;
    const handlers = createNumericInputHandlers({ ...options, onValueChange });
    
    return React.createElement(Component as any, {
      ...restProps,
      type: "number",
      ...handlers
    });
  };
}
