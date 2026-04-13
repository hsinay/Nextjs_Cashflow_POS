'use client';

import { ChevronDown } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils'; // Assuming cn is in lib/utils

type SelectContextType = {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  labelMap: Map<string, string>;
  registerLabel: (value: string, label: string) => void;
};

const SelectContext = React.createContext<SelectContextType | undefined>(
  undefined
);

const useSelectContext = () => {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error('Select components must be used within a <Select> component');
  }
  return context;
};

interface SelectProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  onValueChange: (value: string) => void;
  defaultValue?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
}

const Select = ({
  children,
  value,
  onValueChange,
  defaultValue,
  open: openProp,
  onOpenChange,
  disabled,
  ...props
}: SelectProps) => {
  const [openState, setOpenState] = React.useState(false);
  const [labelMap, setLabelMap] = React.useState<Map<string, string>>(new Map());
  const open = openProp !== undefined ? openProp : openState;

  const registerLabel = React.useCallback((value: string, label: string) => {
    setLabelMap((prevMap) => {
      const newMap = new Map(prevMap);
      newMap.set(value, label);
      return newMap;
    });
  }, []);

  const handleOnOpenChange = React.useCallback(
    (newOpen: boolean) => {
      if (disabled) return;
      setOpenState(newOpen);
      onOpenChange?.(newOpen);
    },
    [disabled, onOpenChange]
  );

  const contextValue = React.useMemo(
    () => ({
      value,
      onValueChange,
      open,
      setOpen: handleOnOpenChange,
      labelMap,
      registerLabel,
    }),
    [value, onValueChange, open, handleOnOpenChange, labelMap, registerLabel]
  );

  return (
    <SelectContext.Provider value={contextValue}>
      <div className={cn('relative w-full', props.className)} {...props}>
        {children}
      </div>
    </SelectContext.Provider>
  );
};
Select.displayName = 'Select';

interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  placeholder?: string;
}

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, placeholder, ...props }, ref) => {
    const { setOpen, open } = useSelectContext();

    const handleClick = React.useCallback((e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setOpen(!open);
    }, [setOpen, open]);

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          'flex h-auto w-full items-center justify-between rounded-lg border border-gray-border bg-white px-4 py-3 text-body focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-gradient-light disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        onClick={handleClick}
        {...props}
      >
        {children ? children : <SelectValue placeholder={placeholder} />}
        <ChevronDown
          className={cn('h-4 w-4 opacity-50 transition-transform duration-200', open && 'rotate-180')}
        />
      </button>
    );
  }
);
SelectTrigger.displayName = 'SelectTrigger';

interface SelectValueProps extends React.HTMLAttributes<HTMLSpanElement> {
  placeholder?: string;
}

const SelectValue = React.forwardRef<HTMLSpanElement, SelectValueProps>(
  ({ className, placeholder, children, ...props }, ref) => {
    const { value, labelMap } = useSelectContext();
    const displayValue = labelMap.get(value);
    
    return (
      <span ref={ref} className={cn(className, !value && 'text-gray-500')} {...props}>
        {displayValue || placeholder}
      </span>
    );
  }
);
SelectValue.displayName = 'SelectValue';

const SelectContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    const { open, setOpen } = useSelectContext();

    React.useEffect(() => {
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setOpen(false);
        }
      };
      if (open) {
        document.addEventListener('keydown', handleEscape);
      }
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }, [setOpen, open]);

    if (!open) return null;

    return (
      <div
        ref={ref}
        className={cn(
          'absolute top-full left-0 z-[9999] w-full mt-1 max-h-60 overflow-y-auto rounded-md border border-gray-200 bg-white p-1 text-base shadow-lg ring-1 ring-black ring-opacity-5',
          className
        )}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        role="listbox"
        {...props}
      >
        {children}
      </div>
    );
  }
);
SelectContent.displayName = 'SelectContent';

interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  disabled?: boolean;
}

const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ className, value: itemValue, children, disabled, ...props }, ref) => {
    const { value: contextValue, onValueChange, setOpen, registerLabel } = useSelectContext();
    const isSelected = contextValue === itemValue;

    // Register label when children change
    React.useEffect(() => {
      if (typeof children === 'string') {
        registerLabel(itemValue, children);
      }
    }, [itemValue, children, registerLabel]);

    const handleClick = React.useCallback((e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled) return;
      onValueChange(itemValue);
      setOpen(false);
    }, [onValueChange, itemValue, setOpen, disabled]);

    return (
      <div
        ref={ref}
        className={cn(
          'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-gray-100 focus:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
          isSelected && 'bg-gray-100 font-medium',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        onClick={handleClick}
        role="option"
        aria-selected={isSelected}
        data-disabled={disabled}
        {...props}
      >
        {children}
      </div>
    );
  }
);
SelectItem.displayName = 'SelectItem';

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue };
