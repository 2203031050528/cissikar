"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ModalProps {
  isOpen: boolean
  onClose: (open: boolean) => void
  title?: React.ReactNode
  description?: React.ReactNode
  children?: React.ReactNode
  footer?: React.ReactNode
  className?: string
  showCloseButton?: boolean
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  className,
  showCloseButton = true,
}: ModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={className} showCloseButton={showCloseButton}>
        {(title || description) && (
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}
        <div className="py-2">{children}</div>
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  )
}
