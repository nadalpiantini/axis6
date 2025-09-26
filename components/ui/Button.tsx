import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700',
        secondary: 'bg-white/10 text-white hover:bg-white/20',
        outline: 'border border-white/20 text-white hover:bg-white/10',
        ghost: 'hover:bg-white/10 text-white',
        destructive: 'bg-red-500/10 text-red-400 hover:bg-red-500/20',
        success: 'bg-green-500/10 text-green-400 hover:bg-green-500/20',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        default: 'h-11 px-6 min-h-[44px]', // Ensures 44px touch target
        lg: 'h-14 px-8 text-lg min-h-[56px]', // Comfortable touch target
        icon: 'h-11 w-11 min-h-[44px] min-w-[44px]', // Square icon button
        'icon-lg': 'h-14 w-14 min-h-[56px] min-w-[56px]',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      fullWidth: false,
    },
  }
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, asChild = false, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }