import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuantityInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  className?: string;
}

export const QuantityInput: React.FC<QuantityInputProps> = ({
  value,
  onChange,
  min = 1,
  max = 9999,
  className,
}) => {
  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Allow empty input for editing
    if (inputValue === '') {
      return;
    }
    
    const newValue = parseInt(inputValue);
    
    // Validate and constrain the value
    if (isNaN(newValue)) {
      onChange(min);
      return;
    }
    
    // Clamp value between min and max
    const clampedValue = Math.min(Math.max(newValue, min), max);
    onChange(clampedValue);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Ensure value is set to min if empty on blur
    if (e.target.value === '' || isNaN(parseInt(e.target.value))) {
      onChange(min);
    }
  };

  const isAtLimit = value >= max;

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleDecrement}
          disabled={value <= min}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <Input
          type="number"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          className={cn(
            "w-16 text-center",
            isAtLimit && "border-warning text-warning"
          )}
          min={min}
          max={max}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleIncrement}
          disabled={value >= max}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      {isAtLimit && (
        <p className="text-xs text-warning text-center">
          {value}/{max} (Max)
        </p>
      )}
    </div>
  );
};
