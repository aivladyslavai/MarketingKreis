"use client"

import * as React from "react"
import type { ModalProps } from "./types"

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
                <button
                  className="px-4 h-10 rounded-md bg-blue-600 text-white hover:bg-blue-500"
                  onClick={() => {
                    props.onOk?.()
                    onClose()
                  }}
                >
                  {props.okText || "OK"}
                </button>
              </div>
            </div>
          )}

          {type === "confirm" && (
            <div className="space-y-4">
              {props.content}
              <div className="flex justify-end gap-2">
                <button className="px-4 h-10 rounded-md border border-slate-300/30 bg-white/60 dark:bg-neutral-800/60" onClick={onClose}>
                  {props.cancelText || "Abbrechen"}
                </button>
                <button
                  className="px-4 h-10 rounded-md bg-blue-600 text-white hover:bg-blue-500"
                  onClick={() => {
                    props.onConfirm?.()
                    onClose()
                  }}
                >
                  {props.confirmText || "Bestätigen"}
                </button>
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
          {f.label && <label className="text-sm opacity-80">{f.label}</label>}
          {f.type === "textarea" ? (
            <textarea
              className="min-h-[90px] rounded-md bg-slate-100/70 dark:bg-neutral-800/70 border border-slate-300/30 dark:border-neutral-700/50 px-3 py-2"
              placeholder={f.placeholder}
              required={f.required}
              value={values[f.name] || ""}
              onChange={(e) => set(f.name, e.target.value)}
            />
          ) : (
            <input
              className="h-10 rounded-md bg-slate-100/70 dark:bg-neutral-800/70 border border-slate-300/30 dark:border-neutral-700/50 px-3"
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
        <button type="button" className="px-4 h-10 rounded-md border border-slate-300/30 bg-white/60 dark:bg-neutral-800/60" onClick={onClose}>
          {props.cancelText || "Abbrechen"}
        </button>
        <button type="submit" className="px-4 h-10 rounded-md bg-blue-600 text-white hover:bg-blue-500">
          {props.submitText || "Speichern"}
        </button>
      </div>
    </form>
  )
}


