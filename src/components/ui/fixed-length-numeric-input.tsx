import React from 'react';
import { Input } from '@/components/ui/input';
import { useFixedLengthNumeric } from '@/hooks/use-fixed-length-numeric';
import { cn } from '@/lib/utils';

interface FixedLengthNumericInputProps {
  length: number;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  'aria-label'?: string;
}

export const FixedLengthNumericInput = React.forwardRef<
  HTMLInputElement,
  FixedLengthNumericInputProps
>(({ 
  length, 
  value, 
  onChange, 
  className, 
  placeholder,
  disabled,
  id,
  name,
  'aria-label': ariaLabel,
  ...props 
}, ref) => {
  const {
    value: internalValue,
    handleChange,
    handleKeyDown,
    handleFocus,
    handleClick,
    setValue
  } = useFixedLengthNumeric({
    length,
    initialValue: value,
    onValueChange: onChange
  });

  // Update internal value when external value changes
  React.useEffect(() => {
    if (value !== undefined && value !== internalValue) {
      setValue(value);
    }
  }, [value, internalValue, setValue]);

  return (
    <Input
      ref={ref}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={internalValue}
      onChange={(e) => handleChange(e.target.value)}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onClick={handleClick}
      className={cn(
        'font-mono text-center tracking-wider',
        className
      )}
      placeholder={placeholder || '0'.repeat(length)}
      disabled={disabled}
      id={id}
      name={name}
      aria-label={ariaLabel}
      maxLength={length}
      {...props}
    />
  );
});

FixedLengthNumericInput.displayName = 'FixedLengthNumericInput';

export default FixedLengthNumericInput;
