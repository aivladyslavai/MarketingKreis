import type { ReactNode } from "react"

export type ModalVariant = "info" | "confirm" | "form" | "custom"

export interface ModalProps {
  type: ModalVariant
  title?: string
  description?: string

  // visual variants / icon support (optional)
  variant?: "default" | "success" | "warning" | "error" | "info"
  icon?: ReactNode | string

  // confirm
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void

  // form
  fields?: Array<{ name: string; label?: string; type: string; placeholder?: string; required?: boolean }>
  submitText?: string
  onSubmit?: (values: Record<string, any>) => void

  // info
  okText?: string
  onOk?: () => void

  // custom content
  content?: ReactNode
}



