'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import { useToast } from '../components/ui/Toast'

export default function RegisterPage() {
  const router = useRouter()
  const { showToast } = useToast()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name || formData.name.length < 2) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres'
    }

    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido'
    }

    if (!formData.password || formData.password.length < 8) {
      newErrors.password = 'Password deve ter pelo menos 8 caracteres'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'As passwords não coincidem'
    }

    if (!acceptedTerms) {
      newErrors.terms = 'Deve aceitar os termos e condições'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      showToast('Por favor, corrija os erros do formulário', 'error')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Se houver detalhes de validação, mostrar a primeira mensagem
        if (data.details && data.details.length > 0) {
          const firstError = data.details[0]
          throw new Error(firstError.message || data.error || 'Erro ao criar conta')
        }
        throw new Error(data.error || 'Erro ao criar conta')
      }

      showToast('Conta criada com sucesso! Verifique o seu email.', 'success')
      router.push('/login?registered=true')
    } catch (error: any) {
      setErrors({ general: error.message })
      showToast(error.message, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-snow py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center mb-4">
            <Link href="/" className="text-malmequer-gold hover:text-malmequer-amber flex items-center gap-2 transition-colors duration-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Voltar à página inicial
            </Link>
          </div>
          <h2 className="mt-6 text-center font-display text-3xl text-ink">
            Criar nova conta
          </h2>
          <p className="mt-2 text-center text-sm text-stone">
            Já tem conta?{' '}
            <Link href="/login" className="font-medium text-malmequer-gold hover:text-malmequer-amber transition-colors duration-200">
              Entrar
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              label="Nome completo"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={errors.name}
            />

            <Input
              label="Email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={errors.email}
            />

            <Input
              label="Password"
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              error={errors.password}
              helperText="Mínimo 8 caracteres"
            />

            <Input
              label="Confirmar password"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              error={errors.confirmPassword}
            />
          </div>

          {errors.general && (
            <div className="bg-error/10 border border-error p-4">
              <p className="text-sm text-error">{errors.general}</p>
            </div>
          )}

          <div>
            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="h-4 w-4 text-malmequer-gold focus:ring-malmequer-gold border-cloud"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-ink">
                Aceito os{' '}
                <Link href="/termos" className="text-malmequer-gold hover:text-malmequer-amber transition-colors duration-200">
                  termos e condições
                </Link>
              </label>
            </div>
            {errors.terms && <p className="text-xs text-error mt-1">{errors.terms}</p>}
          </div>

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Criar conta
          </Button>
        </form>

        <div className="text-center text-sm text-mist">
          Ao criar uma conta, irá receber emails sobre as suas encomendas e novidades.
        </div>
      </div>
    </div>
  )
}
