"use client"

import * as React from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SearchBoxProps extends Omit<React.ComponentProps<"input">, "onChange"> {
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  onClear?: () => void
}

export function SearchBox({
  className,
  value,
  defaultValue,
  onChange,
  onClear,
  placeholder = "Search...",
  ...props
}: SearchBoxProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue || "")
  const isControlled = value !== undefined
  const currentValue = isControlled ? value : internalValue

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    if (!isControlled) {
      setInternalValue(newValue)
    }
    onChange?.(newValue)
  }

  const handleClear = () => {
    if (!isControlled) {
      setInternalValue("")
    }
    onChange?.("")
    onClear?.()
  }

  return (
    <div className={cn("relative flex items-center w-full", className)}>
      <Search className="absolute left-2.5 size-4 text-muted-foreground pointer-events-none" />
      <Input
        type="text"
        value={currentValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        className="pl-9 pr-9"
        {...props}
      />
      {currentValue && (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="absolute right-1.5 h-6 w-6 text-muted-foreground hover:text-foreground"
          onClick={handleClear}
        >
          <X className="size-3" />
          <span className="sr-only">Clear search</span>
        </Button>
      )}
    </div>
  )
}
