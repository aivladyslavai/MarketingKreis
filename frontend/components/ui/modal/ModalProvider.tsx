"use client"

import React, { createContext, useContext, useState, useCallback, useRef } from "react"
import { Modal } from "./Modal"
import type { ModalProps } from "./types"

interface ModalContextType {
  openModal: (modal: ModalProps) => void
  closeModal: () => void
}

const ModalContext = createContext<ModalContextType | undefined>(undefined)

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [modalProps, setModalProps] = useState<ModalProps | null>(null)
  const modalPropsRef = useRef<ModalProps | null>(null)

  const openModal = useCallback((modal: ModalProps) => {
    modalPropsRef.current = modal
    setModalProps(modal)
    setIsOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    try {
      modalPropsRef.current?.onDismiss?.()
    } catch {
      /* noop */
    }
    modalPropsRef.current = null
    setIsOpen(false)
    setModalProps(null)
  }, [])

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      {children}
      {isOpen && modalProps && (
        <Modal onClose={closeModal} {...modalProps} />
      )}
    </ModalContext.Provider>
  )
}

export function useModal() {
  const ctx = useContext(ModalContext)
  if (!ctx) throw new Error("useModal must be used within a ModalProvider")
  return ctx
}





