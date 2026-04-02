import { cn } from "@/lib/utils";
import * as React from "react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    // Filter out react-hook-form and other non-standard props
    const { formState, fieldState, ...rest } = props as any;
    return (
      <input
        type={type}
        className={cn(
          "flex w-full rounded-lg border border-gray-border bg-white px-4 py-3 text-body " +
          "placeholder:text-gray-darker focus:outline-none focus:border-primary " +
          "focus:ring-2 focus:ring-primary-gradient-light disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...rest}
      />
    );
  }
)
Input.displayName = "Input"

export { Input };

