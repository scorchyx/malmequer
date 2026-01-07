'use client'

import { useEffect, useState } from 'react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastProps {
  message: string
  type?: ToastType
  duration?: number
  onClose?: () => void
}

export default function Toast({ message, type = 'info', duration = 5000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => {
      setIsVisible(false)
      onClose?.()
    }, 300)
  }

  if (!isVisible) return null

  const typeStyles = {
    success: 'bg-green-600 border-green-700',
    error: 'bg-red-600 border-red-700',
    warning: 'bg-yellow-600 border-yellow-700',
    info: 'bg-blue-600 border-blue-700',
  }

  const typeIcons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  }

  return (
    <div
      className={`fixed top-4 right-4 z-50 min-w-80 max-w-md border-l-4 ${typeStyles[type]} text-white shadow-lg rounded-lg p-4 transition-all duration-300 ${
        isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl font-bold">{typeIcons[type]}</span>
        <p className="flex-1 text-sm">{message}</p>
        <button
          onClick={handleClose}
          className="text-white hover:text-gray-200 transition-colors"
          aria-label="Fechar"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

// Toast Provider Context
interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void
}

import { createContext, useContext, ReactNode } from 'react'

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: ToastType; duration: number }>>([])
  const [idCounter, setIdCounter] = useState(0)

  const showToast = (message: string, type: ToastType = 'info', duration = 5000) => {
    const id = idCounter
    setIdCounter(prev => prev + 1)
    setToasts(prev => [...prev, { id, message, type, duration }])
  }

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}
