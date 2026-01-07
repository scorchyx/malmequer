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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Criar nova conta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Já tem conta?{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
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
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{errors.general}</p>
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
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-black">
                Aceito os{' '}
                <Link href="/termos" className="text-blue-600 hover:text-blue-500">
                  termos e condições
                </Link>
              </label>
            </div>
            {errors.terms && <p className="text-sm text-red-600 mt-1">{errors.terms}</p>}
          </div>

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Criar conta
          </Button>
        </form>

        <div className="text-center text-sm text-gray-600">
          Ao criar uma conta, irá receber emails sobre as suas encomendas e novidades.
        </div>
      </div>
    </div>
  )
}
