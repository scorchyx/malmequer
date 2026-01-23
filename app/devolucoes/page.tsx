import { RefreshCw, Package, CreditCard, HelpCircle } from 'lucide-react'
import { Metadata } from 'next'
import Link from 'next/link'
import Footer from '../components/layout/Footer'
import Header from '../components/layout/Header'

export const metadata: Metadata = {
  title: 'Política de Devoluções | Malmequer',
  description: 'Política de devoluções e trocas da Malmequer. Saiba como devolver ou trocar os seus produtos.',
}

export default function DevolucoesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-white">
        {/* Hero Section */}
        <section className="bg-cream py-12 md:py-16">
          <div className="container-malmequer">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="font-display text-4xl md:text-5xl text-ink mb-4">Devoluções e Trocas</h1>
              <p className="text-stone text-lg">
                A sua satisfação é a nossa prioridade. Conheça as nossas políticas de devolução e troca.
              </p>
            </div>
          </div>
        </section>

        {/* Quick Info Cards */}
        <section className="py-12">
          <div className="container-malmequer">
            <div className="grid md:grid-cols-4 gap-6 mb-12">
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <div className="w-12 h-12 bg-cream rounded-full flex items-center justify-center mx-auto mb-4">
                  <RefreshCw className="w-6 h-6 text-malmequer-gold" />
                </div>
                <h3 className="font-semibold text-ink mb-2">14 Dias</h3>
                <p className="text-stone text-sm">Para devoluções sem motivo</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <div className="w-12 h-12 bg-cream rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-6 h-6 text-malmequer-gold" />
                </div>
                <h3 className="font-semibold text-ink mb-2">Embalagem Original</h3>
                <p className="text-stone text-sm">Produtos em perfeitas condições</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <div className="w-12 h-12 bg-cream rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-6 h-6 text-malmequer-gold" />
                </div>
                <h3 className="font-semibold text-ink mb-2">Reembolso Rápido</h3>
                <p className="text-stone text-sm">Em até 14 dias após receção</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <div className="w-12 h-12 bg-cream rounded-full flex items-center justify-center mx-auto mb-4">
                  <HelpCircle className="w-6 h-6 text-malmequer-gold" />
                </div>
                <h3 className="font-semibold text-ink mb-2">Apoio Dedicado</h3>
                <p className="text-stone text-sm">Estamos aqui para ajudar</p>
              </div>
            </div>
          </div>
        </section>

        {/* Detailed Policy */}
        <section className="pb-16">
          <div className="container-malmequer">
            <div className="max-w-4xl mx-auto space-y-12">
              {/* Right of Withdrawal */}
              <div>
                <h2 className="font-display text-2xl text-ink mb-6">Direito de Livre Resolução</h2>
                <div className="prose prose-stone max-w-none">
                  <p className="text-stone leading-relaxed mb-4">
                    Nos termos do Decreto-Lei n.º 24/2014, tem o direito de resolver o contrato de compra no prazo de
                    <strong> 14 dias</strong> a contar da data em que recebeu o produto, sem necessidade de indicar qualquer motivo.
                  </p>
                  <p className="text-stone leading-relaxed">
                    Para exercer este direito, deve comunicar a sua decisão de forma clara e inequívoca através de uma
                    declaração por escrito (email ou carta).
                  </p>
                </div>
              </div>

              {/* Conditions */}
              <div>
                <h2 className="font-display text-2xl text-ink mb-6">Condições para Devolução</h2>
                <div className="space-y-4">
                  <div className="border-l-4 border-green-500 pl-4">
                    <h3 className="font-semibold text-ink mb-2">Aceitamos devoluções quando:</h3>
                    <ul className="list-disc pl-6 text-stone space-y-2">
                      <li>O produto não foi usado, lavado ou danificado</li>
                      <li>Mantém todas as etiquetas originais</li>
                      <li>Está na embalagem original (quando aplicável)</li>
                      <li>Está dentro do prazo de 14 dias após receção</li>
                      <li>Acompanhado de comprovativo de compra</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-red-500 pl-4">
                    <h3 className="font-semibold text-ink mb-2">Não aceitamos devoluções de:</h3>
                    <ul className="list-disc pl-6 text-stone space-y-2">
                      <li>Produtos personalizados ou feitos por medida</li>
                      <li>Artigos de higiene pessoal abertos (por motivos de higiene)</li>
                      <li>Produtos danificados pelo cliente</li>
                      <li>Artigos em saldos ou promoções (exceto defeito)</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* How to Return */}
              <div>
                <h2 className="font-display text-2xl text-ink mb-6">Como Fazer uma Devolução</h2>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-malmequer-gold text-white rounded-full flex items-center justify-center flex-shrink-0 font-semibold">
                      1
                    </div>
                    <div>
                      <h3 className="font-semibold text-ink mb-1">Contacte-nos</h3>
                      <p className="text-stone">
                        Envie um email para <a href="mailto:devolucoes@malmequer.pt" className="text-malmequer-gold hover:underline">devolucoes@malmequer.pt</a> com:
                      </p>
                      <ul className="list-disc pl-6 text-stone mt-2 text-sm">
                        <li>Número da encomenda</li>
                        <li>Produtos que pretende devolver</li>
                        <li>Motivo da devolução (opcional)</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-malmequer-gold text-white rounded-full flex items-center justify-center flex-shrink-0 font-semibold">
                      2
                    </div>
                    <div>
                      <h3 className="font-semibold text-ink mb-1">Receba as instruções</h3>
                      <p className="text-stone">
                        Enviaremos um email com a etiqueta de devolução e instruções detalhadas para
                        o envio do produto.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-malmequer-gold text-white rounded-full flex items-center justify-center flex-shrink-0 font-semibold">
                      3
                    </div>
                    <div>
                      <h3 className="font-semibold text-ink mb-1">Prepare o pacote</h3>
                      <p className="text-stone">
                        Embale o produto de forma segura, preferencialmente na embalagem original.
                        Inclua uma cópia da fatura ou número da encomenda.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-malmequer-gold text-white rounded-full flex items-center justify-center flex-shrink-0 font-semibold">
                      4
                    </div>
                    <div>
                      <h3 className="font-semibold text-ink mb-1">Envie o pacote</h3>
                      <p className="text-stone">
                        Entregue o pacote num ponto de recolha CTT ou agende uma recolha. Guarde o
                        comprovativo de envio.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-malmequer-gold text-white rounded-full flex items-center justify-center flex-shrink-0 font-semibold">
                      5
                    </div>
                    <div>
                      <h3 className="font-semibold text-ink mb-1">Receba o reembolso</h3>
                      <p className="text-stone">
                        Após recebermos e verificarmos o produto, processaremos o reembolso em até
                        14 dias para o método de pagamento original.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping Costs */}
              <div>
                <h2 className="font-display text-2xl text-ink mb-6">Custos de Devolução</h2>
                <div className="bg-gray-50 rounded-lg p-6">
                  <ul className="space-y-3 text-stone">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600">✓</span>
                      <span><strong>Defeito ou erro nosso:</strong> Custos de devolução por nossa conta</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600">•</span>
                      <span><strong>Arrependimento:</strong> Custos de devolução por conta do cliente (aproximadamente 4,50€)</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Exchanges */}
              <div>
                <h2 className="font-display text-2xl text-ink mb-6">Trocas</h2>
                <p className="text-stone leading-relaxed mb-4">
                  Se pretende trocar um produto por outro tamanho ou cor, o processo é semelhante à devolução:
                </p>
                <ol className="list-decimal pl-6 text-stone space-y-2">
                  <li>Contacte-nos indicando o produto que deseja em troca</li>
                  <li>Verificamos a disponibilidade do novo produto</li>
                  <li>Enviamos instruções para devolução</li>
                  <li>Após recebermos o produto original, enviamos o novo</li>
                </ol>
                <p className="text-stone leading-relaxed mt-4">
                  <strong>Nota:</strong> Se o novo produto tiver preço diferente, será feito o ajuste no valor
                  (reembolso ou pagamento adicional).
                </p>
              </div>

              {/* Defective Products */}
              <div>
                <h2 className="font-display text-2xl text-ink mb-6">Produtos com Defeito</h2>
                <p className="text-stone leading-relaxed mb-4">
                  Se recebeu um produto com defeito ou danificado:
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                  <ul className="space-y-2 text-stone">
                    <li>• Contacte-nos imediatamente com fotos do defeito</li>
                    <li>• Todos os produtos têm garantia legal de 3 anos</li>
                    <li>• Pode optar por reparação, substituição ou reembolso</li>
                    <li>• Os custos de envio são sempre por nossa conta</li>
                  </ul>
                </div>
              </div>

              {/* Refund */}
              <div>
                <h2 className="font-display text-2xl text-ink mb-6">Reembolso</h2>
                <p className="text-stone leading-relaxed mb-4">
                  O reembolso será processado após verificação do estado do produto:
                </p>
                <ul className="list-disc pl-6 text-stone space-y-2">
                  <li>Prazo máximo de 14 dias após receção do produto</li>
                  <li>Reembolso no mesmo método de pagamento utilizado na compra</li>
                  <li>Cartão de crédito/débito: 5-10 dias úteis para aparecer na conta</li>
                  <li>Inclui o valor do produto e custos de envio originais (se aplicável)</li>
                </ul>
              </div>

              {/* Contact */}
              <div className="text-center py-8 border-t">
                <h2 className="font-display text-2xl text-ink mb-4">Precisa de Ajuda?</h2>
                <p className="text-stone mb-6">
                  A nossa equipa está disponível para ajudar com qualquer questão sobre devoluções.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href="mailto:devolucoes@malmequer.pt"
                    className="inline-block px-8 py-3 bg-ink text-white font-medium rounded-lg hover:bg-gray-800 transition"
                  >
                    Email: devolucoes@malmequer.pt
                  </a>
                  <Link
                    href="/contacto"
                    className="inline-block px-8 py-3 border border-ink text-ink font-medium rounded-lg hover:bg-gray-50 transition"
                  >
                    Formulário de Contacto
                  </Link>
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
