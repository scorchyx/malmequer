'use client'

import { useState, useEffect } from 'react'
import Input from '../ui/Input'
import Button from '../ui/Button'
import { useToast } from '../ui/Toast'
import { MapPin, Plus, Pencil, Trash2, Star, X } from 'lucide-react'

// Portuguese districts for dropdown
const PORTUGUESE_DISTRICTS = [
  'Aveiro', 'Beja', 'Braga', 'Bragança', 'Castelo Branco', 'Coimbra',
  'Évora', 'Faro', 'Guarda', 'Leiria', 'Lisboa', 'Portalegre',
  'Porto', 'Santarém', 'Setúbal', 'Viana do Castelo', 'Vila Real',
  'Viseu', 'Ilha da Madeira', 'Ilha de Porto Santo',
  'Ilha de Santa Maria', 'Ilha de São Miguel', 'Ilha Terceira',
  'Ilha da Graciosa', 'Ilha de São Jorge', 'Ilha do Pico',
  'Ilha do Faial', 'Ilha das Flores', 'Ilha do Corvo',
]

interface Address {
  id: string
  firstName: string
  lastName: string
  phone: string | null
  addressLine1: string
  addressLine2: string | null
  city: string
  state: string
  postalCode: string
  country: string
  isDefault: boolean
}

interface AddressFormData {
  fullName: string
  phone: string
  addressLine1: string
  addressLine2: string
  locality: string
  city: string
  state: string
  postalCode: string
  country: string
  isDefault: boolean
}

const emptyFormData: AddressFormData = {
  fullName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  locality: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'Portugal',
  isDefault: false,
}

export default function AddressManager() {
  const { showToast } = useToast()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<AddressFormData>(emptyFormData)
  const [postalCodeError, setPostalCodeError] = useState('')
  const [phoneError, setPhoneError] = useState('')

  // Load addresses
  useEffect(() => {
    fetchAddresses()
  }, [])

  const fetchAddresses = async () => {
    try {
      const response = await fetch('/api/user/addresses')
      if (response.ok) {
        const data = await response.json()
        setAddresses(data.addresses)
      }
    } catch (error) {
      showToast('Erro ao carregar moradas', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  // Validate Portuguese postal code
  const validatePostalCode = (code: string): boolean => {
    return /^\d{4}-\d{3}$/.test(code)
  }

  // Format postal code as user types
  const handlePostalCodeChange = (value: string) => {
    let digits = value.replace(/\D/g, '')
    if (digits.length > 7) digits = digits.slice(0, 7)

    let formatted = digits
    if (digits.length > 4) {
      formatted = `${digits.slice(0, 4)}-${digits.slice(4)}`
    }

    setFormData({ ...formData, postalCode: formatted })

    if (formatted.length === 8) {
      setPostalCodeError(validatePostalCode(formatted) ? '' : 'Formato inválido')
    } else {
      setPostalCodeError('')
    }
  }

  // Validate Portuguese phone
  const validatePhone = (phone: string): boolean => {
    const cleaned = phone.replace(/\s/g, '').replace(/^\+351/, '')
    return /^[29]\d{8}$/.test(cleaned)
  }

  // Format phone number
  const handlePhoneChange = (value: string) => {
    let cleaned = value.replace(/[^\d+]/g, '')

    if (cleaned.startsWith('+351')) {
      const digits = cleaned.slice(4)
      if (digits.length <= 9) {
        cleaned = `+351 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`.trim()
      }
    } else if (!cleaned.startsWith('+')) {
      if (cleaned.length > 9) cleaned = cleaned.slice(0, 9)
      if (cleaned.length > 6) {
        cleaned = `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`
      } else if (cleaned.length > 3) {
        cleaned = `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`
      }
    }

    setFormData({ ...formData, phone: cleaned })

    const digitsOnly = cleaned.replace(/\D/g, '')
    if (digitsOnly.length >= 9) {
      setPhoneError(validatePhone(cleaned) ? '' : 'Número inválido')
    } else {
      setPhoneError('')
    }
  }

  const handleEdit = (address: Address) => {
    setEditingId(address.id)
    setFormData({
      fullName: `${address.firstName} ${address.lastName}`.trim(),
      phone: address.phone || '',
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || '',
      locality: address.city,
      city: '',
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      isDefault: address.isDefault,
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem a certeza que deseja eliminar esta morada?')) return

    try {
      const response = await fetch(`/api/user/addresses/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        showToast('Morada eliminada', 'success')
        fetchAddresses()
      } else {
        throw new Error()
      }
    } catch (error) {
      showToast('Erro ao eliminar morada', 'error')
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      const response = await fetch(`/api/user/addresses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      })

      if (response.ok) {
        showToast('Morada principal atualizada', 'success')
        fetchAddresses()
      } else {
        throw new Error()
      }
    } catch (error) {
      showToast('Erro ao definir morada principal', 'error')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validatePostalCode(formData.postalCode)) {
      setPostalCodeError('Código postal inválido')
      return
    }

    if (!validatePhone(formData.phone)) {
      setPhoneError('Número de telefone inválido')
      return
    }

    setIsSaving(true)

    // Split full name into first name and last name
    const nameParts = formData.fullName.trim().split(/\s+/)
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''

    try {
      const url = editingId
        ? `/api/user/addresses/${editingId}`
        : '/api/user/addresses'

      const response = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          phone: formData.phone.replace(/\s/g, ''),
          addressLine1: formData.addressLine1,
          addressLine2: formData.addressLine2,
          locality: formData.locality,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
          country: formData.country,
          isDefault: formData.isDefault,
        }),
      })

      if (response.ok) {
        showToast(editingId ? 'Morada atualizada' : 'Morada adicionada', 'success')
        setShowForm(false)
        setEditingId(null)
        setFormData(emptyFormData)
        fetchAddresses()
      } else {
        const error = await response.json()
        throw new Error(error.error)
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Erro ao guardar morada', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData(emptyFormData)
    setPostalCodeError('')
    setPhoneError('')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ink"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-ink">Moradas de Envio</h2>
        {!showForm && (
          <Button
            onClick={() => setShowForm(true)}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Adicionar morada
          </Button>
        )}
      </div>

      {/* Address Form */}
      {showForm && (
        <div className="bg-snow border border-cloud p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-ink">
              {editingId ? 'Editar morada' : 'Nova morada'}
            </h3>
            <button onClick={handleCancel} className="text-mist hover:text-ink">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nome completo"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Nome completo"
            />

            <div>
              <Input
                label="Telefone"
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="912 345 678"
              />
              {phoneError && <p className="text-red-600 text-sm mt-1">{phoneError}</p>}
            </div>

            <div className="md:col-span-2">
              <Input
                label="Morada"
                required
                value={formData.addressLine1}
                onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                placeholder="Rua, número e andar"
              />
            </div>

            <div className="md:col-span-2">
              <Input
                label="Complemento (opcional)"
                value={formData.addressLine2}
                onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                placeholder="Apartamento, bloco, etc."
              />
            </div>

            <div>
              <Input
                label="Código Postal"
                required
                value={formData.postalCode}
                onChange={(e) => handlePostalCodeChange(e.target.value)}
                placeholder="1234-567"
                maxLength={8}
              />
              {postalCodeError && <p className="text-red-600 text-sm mt-1">{postalCodeError}</p>}
            </div>

            <Input
              label="Localidade"
              required
              value={formData.locality}
              onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
              placeholder="Ex: Amadora"
            />

            <div>
              <label className="block text-sm font-medium text-ink mb-1">
                Distrito <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-4 py-2.5 border border-cloud bg-white text-ink focus:outline-none focus:border-ink transition-colors"
              >
                <option value="">Selecione o distrito</option>
                {PORTUGUESE_DISTRICTS.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="País"
              required
              value={formData.country}
              disabled
            />

            <div className="md:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="w-4 h-4 border-cloud text-ink focus:ring-ink"
                />
                <span className="text-sm text-stone">Definir como morada principal</span>
              </label>
            </div>

            <div className="md:col-span-2 flex gap-3 justify-end mt-2">
              <Button type="button" variant="secondary" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button type="submit" isLoading={isSaving}>
                {editingId ? 'Guardar alterações' : 'Adicionar morada'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Address List */}
      {addresses.length === 0 && !showForm ? (
        <div className="text-center py-12 bg-snow border border-cloud">
          <MapPin className="h-12 w-12 text-mist mx-auto mb-4" />
          <p className="text-stone mb-4">Ainda não tem moradas guardadas</p>
          <Button onClick={() => setShowForm(true)} variant="secondary">
            Adicionar primeira morada
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.map((address) => (
            <div
              key={address.id}
              className={`border p-4 ${address.isDefault ? 'border-ink bg-snow' : 'border-cloud bg-white'}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-ink">
                      {address.firstName} {address.lastName}
                    </span>
                    {address.isDefault && (
                      <span className="inline-flex items-center gap-1 text-xs bg-ink text-white px-2 py-0.5">
                        <Star className="h-3 w-3" />
                        Principal
                      </span>
                    )}
                  </div>
                  <p className="text-stone text-sm">{address.addressLine1}</p>
                  {address.addressLine2 && (
                    <p className="text-stone text-sm">{address.addressLine2}</p>
                  )}
                  <p className="text-stone text-sm">
                    {address.postalCode} {address.city}
                  </p>
                  <p className="text-stone text-sm">{address.state}</p>
                  {address.phone && (
                    <p className="text-stone text-sm mt-1">Tel: {address.phone}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {!address.isDefault && (
                    <button
                      onClick={() => handleSetDefault(address.id)}
                      className="text-mist hover:text-ink p-1"
                      title="Definir como principal"
                    >
                      <Star className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(address)}
                    className="text-mist hover:text-ink p-1"
                    title="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(address.id)}
                    className="text-mist hover:text-red-600 p-1"
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
