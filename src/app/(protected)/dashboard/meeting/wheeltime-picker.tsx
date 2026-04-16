'use client';

import { useEffect, useRef, type WheelEvent } from 'react';
import { cn } from '@/lib/utils';

interface WheelTimePickerProps {
  value: string; // 24h format "HH:mm"
  onChange: (val: string) => void;
}

// Generate all time slots in 15-minute increments (Google Calendar style)
function generateTimeSlots(): { label: string; value: string }[] {
  const slots: { label: string; value: string }[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const hour24 = h.toString().padStart(2, '0');
      const min = m.toString().padStart(2, '0');
      const value = `${hour24}:${min}`;

      // Display label in 12-hour format (e.g. "9:00 AM", "12:30 PM")
      const period = h < 12 ? 'AM' : 'PM';
      const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      const label = `${hour12}:${min} ${period}`;

      slots.push({ label, value });
    }
  }
  return slots;
}

const TIME_SLOTS = generateTimeSlots();

export default function WheelTimePicker({ value, onChange }: WheelTimePickerProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  // Scroll selected item into view when the picker opens or value changes
  useEffect(() => {
    if (selectedRef.current && listRef.current) {
      selectedRef.current.scrollIntoView({ block: 'center', behavior: 'auto' });
    }
  }, [value]);

  // Ensure mouse wheel always scrolls this dropdown (even inside popovers/dialogs)
  const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
    const el = listRef.current;
    if (!el) return;
    e.preventDefault();
    el.scrollTop += e.deltaY;
  };

  return (
    <div
      ref={listRef}
      onWheel={handleWheel}
      className='flex max-h-64 flex-col overflow-y-auto py-1 focus:outline-none'
      style={{ scrollbarWidth: 'thin' }}
    >
      {TIME_SLOTS.map((slot) => {
        const isSelected = slot.value === value;
        return (
          <button
            key={slot.value}
            ref={isSelected ? selectedRef : undefined}
            type='button'
            onClick={() => onChange(slot.value)}
            className={cn(
              'flex w-full items-center px-4 py-2 text-sm transition-colors text-left',
              isSelected
                ? 'bg-primary text-primary-foreground font-medium'
                : 'hover:bg-muted text-foreground'
            )}
          >
            {slot.label}
          </button>
        );
      })}
    </div>
  );
}
