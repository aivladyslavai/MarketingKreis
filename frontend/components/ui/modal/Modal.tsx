"use client"

import * as React from "react"
import type { ModalProps } from "./types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

type Props = ModalProps & { onClose: () => void }

export function Modal(props: Props) {
  const { onClose, type, title, description } = props

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  const stop = (e: React.MouseEvent) => e.stopPropagation()

  return (
    <div
      className="fixed inset-0 z-[1000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 overscroll-contain"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl rounded-2xl border border-white/15 bg-white/80 dark:bg-neutral-900/70 shadow-2xl backdrop-blur-md text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-hidden flex flex-col"
        onClick={stop}
      >
        {(title || description) && (
          <div className="px-5 pt-5">
            {title && <h3 className="text-lg font-semibold">{title}</h3>}
            {description && <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{description}</p>}
          </div>
        )}

        <div className="px-5 py-4 overflow-y-auto">
          {type === "custom" && props.content}

          {type === "info" && (
            <div className="space-y-4">
              {props.content}
              <div className="flex justify-end gap-2">
                <Button
                  className="h-11 bg-white text-slate-900 hover:bg-white/90 dark:bg-white dark:text-slate-900"
                  onClick={() => {
                    props.onOk?.()
                    onClose()
                  }}
                >
                  {props.okText || "OK"}
                </Button>
              </div>
            </div>
          )}

          {type === "confirm" && (
            <div className="space-y-4">
              {props.content}
              <div className="flex justify-end gap-2">
                <Button variant="outline" className="h-11 border-white/15 bg-white/50 hover:bg-white/70 dark:bg-slate-950/20 dark:hover:bg-slate-950/30" onClick={onClose}>
                  {props.cancelText || "Abbrechen"}
                </Button>
                <Button
                  className="h-11 bg-white text-slate-900 hover:bg-white/90 dark:bg-white dark:text-slate-900"
                  onClick={() => {
                    props.onConfirm?.()
                    onClose()
                  }}
                >
                  {props.confirmText || "Bestätigen"}
                </Button>
              </div>
            </div>
          )}

          {type === "form" && (
            <FormBody {...props} />
          )}
        </div>
      </div>
    </div>
  )
}

function FormBody(props: Props) {
  const [values, setValues] = React.useState<Record<string, any>>({})
  const { onClose } = props

  React.useEffect(() => {
    const init: Record<string, any> = {}
    ;(props.fields || []).forEach(f => { init[f.name] = "" })
    setValues(init)
  }, [props.fields])

  const set = (name: string, v: any) => setValues(prev => ({ ...prev, [name]: v }))

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        props.onSubmit?.(values)
        onClose()
      }}
    >
      {(props.fields || []).map((f) => (
        <div key={f.name} className="grid gap-1">
          {f.label && <Label className="text-slate-600 dark:text-slate-300">{f.label}</Label>}
          {f.type === "textarea" ? (
            <Textarea
              className="min-h-[110px]"
              placeholder={f.placeholder}
              required={f.required}
              value={values[f.name] || ""}
              onChange={(e) => set(f.name, e.target.value)}
            />
          ) : (
            <Input
              type={f.type || "text"}
              placeholder={f.placeholder}
              required={f.required}
              value={values[f.name] || ""}
              onChange={(e) => set(f.name, e.target.value)}
            />
          )}
        </div>
      ))}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" className="h-11 border-white/15 bg-white/50 hover:bg-white/70 dark:bg-slate-950/20 dark:hover:bg-slate-950/30" onClick={onClose}>
          {props.cancelText || "Abbrechen"}
        </Button>
        <Button type="submit" className="h-11 bg-white text-slate-900 hover:bg-white/90 dark:bg-white dark:text-slate-900">
          {props.submitText || "Speichern"}
        </Button>
      </div>
    </form>
  )
}


