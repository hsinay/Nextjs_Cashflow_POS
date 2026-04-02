import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-small font-semibold uppercase focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-gray-medium text-gray-dark hover:bg-gray-dark", // Generic gray badge
        paid: "bg-light-green text-dark-green",
        pending: "bg-light-yellow text-dark-yellow",
        overdue: "bg-light-red text-dark-red",
        destructive: "bg-danger text-white",
        outline: "text-dark border border-gray-border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
