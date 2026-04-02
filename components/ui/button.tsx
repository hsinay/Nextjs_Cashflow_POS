import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-all duration-300 ease-in-out disabled:pointer-events-none disabled:opacity-50 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white " +
  "hover:-translate-y-[2px] hover:shadow-custom-lg", // Common base styles with hover effect
  {
    variants: {
      variant: {
        default: "bg-gradient-primary text-white", // Use the custom primary gradient class
        destructive: "bg-danger text-white hover:bg-danger/90", // Using danger color
        outline:
          "border border-gray-border bg-white hover:bg-gray-light text-dark", // Using gray-border
        secondary:
          "bg-gray-border text-gray-darker hover:bg-gray-medium", // Using gray-border and gray-medium
        success: "bg-success text-white hover:bg-success/90", // New success variant
        ghost: "hover:bg-gray-light hover:text-dark", // Using new gray colors
        link: "text-primary underline-offset-4 hover:underline", // Using primary text color
      },
      size: {
        default: "h-auto px-6 py-3", // Adjusted to match 12px 24px padding roughly
        sm: "h-auto px-4 py-2",
        lg: "h-auto px-8 py-4",
        icon: "h-10 w-10", // Keep icon size consistent
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
)
Button.displayName = "Button"

export { Button, buttonVariants }
