"use client"

import * as React from "react"

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className = "text-sm font-medium", ...props }, ref) => (
    <label ref={ref} className={className} {...props} />
  )
)
Label.displayName = "Label"

export default Label





