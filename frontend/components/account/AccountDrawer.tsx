"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { AccountPanel } from "./AccountPanel"

interface AccountDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function AccountDrawer({ isOpen, onClose }: AccountDrawerProps) {
  const [mounted, setMounted] = React.useState(false)
  const [visible, setVisible] = React.useState(false)
  const [animating, setAnimating] = React.useState(false)

  // Mount check for portal
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Handle open/close animation
  React.useEffect(() => {
    if (isOpen) {
      setVisible(true)
      // Small delay to trigger CSS transition
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimating(true)
        })
      })
    } else {
      setAnimating(false)
      // Wait for animation to complete before hiding
      const timer = setTimeout(() => {
        setVisible(false)
      }, 300) // Match CSS transition duration
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Close on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  // Prevent body scroll when open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  if (!mounted || !visible) return null

  const drawer = (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          animating ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        className={`absolute top-0 right-0 h-full w-full max-w-lg transform transition-transform duration-300 ease-out ${
          animating ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="relative h-full overflow-hidden">
          {/* Background with gradient - respects light/dark theme */}
          <div className="absolute inset-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl" />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5" />
          
          {/* Decorative glow */}
          <div className="pointer-events-none absolute -top-32 -right-32 h-64 w-64 rounded-full bg-gradient-to-tr from-kaboom-red/20 to-purple-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-gradient-to-tr from-cyan-500/20 to-emerald-500/20 blur-3xl" />

          {/* Content container */}
          <div className="relative h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-kaboom-red to-red-600 flex items-center justify-center shadow-lg">
                  <span className="text-white text-lg font-bold">K</span>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Mein Konto</h2>
                  <p className="text-xs text-slate-400">Profil & Einstellungen</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="h-10 w-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 transition-colors group"
                aria-label="Schließen"
              >
                <X className="h-5 w-5 text-slate-400 group-hover:text-white transition-colors" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
              <AccountPanel onClose={onClose} />
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/10 bg-white/80 dark:bg-slate-950/60">
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>KABOOM Marketing Platform</span>
                <span>v1.0.0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(drawer, document.body)
}

