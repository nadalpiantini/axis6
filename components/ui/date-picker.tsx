"use client"

import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import * as React from "react"

import { cn } from "@/lib/utils"

export interface DatePickerProps {
  label?: string
  error?: string
  helperText?: string
  value?: Date | string
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  required?: boolean
  name?: string
  className?: string
}

const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  ({
    className,
    label,
    error,
    helperText,
    value,
    onChange,
    placeholder = "Select date",
    disabled,
    required,
    name,
    ...props
  }, ref) => {
    const datePickerId = React.useId()

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const dateValue = e.target.value
      if (dateValue && onChange) {
        onChange(new Date(dateValue))
      } else if (!dateValue && onChange) {
        onChange(undefined)
      }
    }

    const formatDateForInput = (date: Date | string | undefined): string => {
      if (!date) return ""
      try {
        const dateObj = typeof date === 'string' ? new Date(date) : date
        if (isNaN(dateObj.getTime())) return ""
        return format(dateObj, 'yyyy-MM-dd')
      } catch {
        return ""
      }
    }

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={datePickerId}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white"
          >
            {label}
            {required && <span className="text-red-400 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <input
            id={datePickerId}
            name={name}
            type="date"
            value={formatDateForInput(value)}
            onChange={handleDateChange}
            disabled={disabled}
            required={required}
            className={cn(
              "flex h-10 w-full rounded-md border bg-white/10 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-white [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:hover:opacity-100",
              error
                ? "border-red-500/50 focus-visible:ring-red-500"
                : "border-white/20 focus-visible:ring-purple-500",
              className
            )}
            ref={ref}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? `${datePickerId}-error` : helperText ? `${datePickerId}-helper` : undefined}
            {...props}
          />
          <CalendarIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
        </div>
        {error && (
          <p id={`${datePickerId}-error`} className="text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${datePickerId}-helper`} className="text-sm text-gray-400">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)
DatePicker.displayName = "DatePicker"

export { DatePicker }
