'use client'

import { Mail, Phone, MapPin, Clock } from 'lucide-react'
import { useState } from 'react'
import Footer from '../components/layout/Footer'
import Header from '../components/layout/Header'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { useToast } from '../components/ui/Toast'

export default function ContactoPage() {
  const { showToast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    assunto: '',
    mensagem: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simular envio do formulário
    await new Promise(resolve => setTimeout(resolve, 1000))

    showToast('Mensagem enviada com sucesso! Responderemos em breve.', 'success')
    setFormData({ nome: '', email: '', assunto: '', mensagem: '' })
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-white">
        {/* Hero Section */}
        <section className="bg-cream py-12 md:py-16">
          <div className="container-malmequer">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="font-display text-4xl md:text-5xl text-ink mb-4">Contacte-nos</h1>
              <p className="text-stone text-lg">
                Estamos aqui para ajudar. Envie-nos uma mensagem e responderemos o mais brevemente possível.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-12 md:py-16">
          <div className="container-malmequer">
            <div className="grid md:grid-cols-2 gap-12">
              {/* Contact Form */}
              <div>
                <h2 className="font-display text-2xl text-ink mb-6">Envie-nos uma mensagem</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input
                      label="Nome"
                      name="nome"
                      type="text"
                      required
                      value={formData.nome}
                      onChange={handleChange}
                      placeholder="O seu nome"
                    />
                    <Input
                      label="Email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="seu@email.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="assunto" className="block text-sm font-medium text-ink mb-2">
                      Assunto
                    </label>
                    <select
                      id="assunto"
                      name="assunto"
                      required
                      value={formData.assunto}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-malmequer-gold focus:border-transparent transition bg-white"
                    >
                      <option value="">Selecione um assunto</option>
                      <option value="encomenda">Questão sobre encomenda</option>
                      <option value="produto">Informação sobre produto</option>
                      <option value="devolucao">Devolução ou troca</option>
                      <option value="pagamento">Problema com pagamento</option>
                      <option value="outro">Outro assunto</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="mensagem" className="block text-sm font-medium text-ink mb-2">
                      Mensagem
                    </label>
                    <textarea
                      id="mensagem"
                      name="mensagem"
                      required
                      rows={5}
                      value={formData.mensagem}
                      onChange={handleChange}
                      placeholder="Escreva a sua mensagem aqui..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-malmequer-gold focus:border-transparent transition resize-none"
                    />
                  </div>

                  <Button type="submit" className="w-full" isLoading={isLoading}>
                    Enviar Mensagem
                  </Button>
                </form>
              </div>

              {/* Contact Info */}
              <div>
                <h2 className="font-display text-2xl text-ink mb-6">Informações de Contacto</h2>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-cream rounded-full flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-malmequer-gold" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-ink mb-1">Email</h3>
                      <a href="mailto:info@malmequer.pt" className="text-stone hover:text-malmequer-gold transition">
                        info@malmequer.pt
                      </a>
                      <p className="text-stone text-sm mt-1">
                        Respondemos em até 24 horas úteis
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-cream rounded-full flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-malmequer-gold" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-ink mb-1">Telefone</h3>
                      <a href="tel:+351123456789" className="text-stone hover:text-malmequer-gold transition">
                        +351 123 456 789
                      </a>
                      <p className="text-stone text-sm mt-1">
                        Segunda a Sexta, 9h - 18h
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-cream rounded-full flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-malmequer-gold" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-ink mb-1">Horário de Apoio</h3>
                      <p className="text-stone">Segunda a Sexta: 9h - 18h</p>
                      <p className="text-stone">Sábado: 10h - 14h</p>
                      <p className="text-stone text-sm mt-1">
                        Domingo e feriados: encerrado
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-cream rounded-full flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-malmequer-gold" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-ink mb-1">Morada</h3>
                      <p className="text-stone">
                        Malmequer<br />
                        Portugal
                      </p>
                    </div>
                  </div>
                </div>

                {/* FAQ Link */}
                <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-ink mb-2">Questões Frequentes</h3>
                  <p className="text-stone text-sm mb-4">
                    Antes de nos contactar, verifique se a sua questão não está respondida nas nossas páginas de informação:
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li>
                      <a href="/envios" className="text-malmequer-gold hover:underline">
                        → Informação sobre Envios
                      </a>
                    </li>
                    <li>
                      <a href="/devolucoes" className="text-malmequer-gold hover:underline">
                        → Política de Devoluções
                      </a>
                    </li>
                    <li>
                      <a href="/termos" className="text-malmequer-gold hover:underline">
                        → Termos e Condições
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
