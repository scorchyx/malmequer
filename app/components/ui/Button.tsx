import { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  children: ReactNode
}

export default function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = `
    font-body font-medium transition-all duration-200 ease-out
    disabled:opacity-50 disabled:cursor-not-allowed
    inline-flex items-center justify-center gap-2
    uppercase tracking-wider text-sm
  `

  const variants = {
    primary: 'bg-ink text-white hover:bg-stone',
    secondary: 'bg-transparent text-ink border border-ink hover:bg-ink hover:text-white',
    outline: 'bg-transparent text-ink border border-ink hover:bg-ink hover:text-white',
    accent: 'bg-malmequer-gold text-ink hover:bg-malmequer-amber',
    danger: 'bg-error text-white hover:opacity-90',
    ghost: 'text-stone hover:text-ink hover:bg-cloud',
  }

  const sizes = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-sm',
  }

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  )
}
