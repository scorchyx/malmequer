import { Truck, Package, Clock, MapPin } from 'lucide-react'
import { Metadata } from 'next'
import Link from 'next/link'
import Footer from '../components/layout/Footer'
import Header from '../components/layout/Header'

export const metadata: Metadata = {
  title: 'Informação de Envios | Malmequer',
  description: 'Informação sobre envios da Malmequer. Prazos de entrega, custos e zonas de entrega.',
}

export default function EnviosPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-white">
        {/* Hero Section */}
        <section className="bg-cream py-12 md:py-16">
          <div className="container-malmequer">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="font-display text-4xl md:text-5xl text-ink mb-4">Informação de Envios</h1>
              <p className="text-stone text-lg">
                Tudo o que precisa de saber sobre a entrega das suas encomendas.
              </p>
            </div>
          </div>
        </section>

        {/* Shipping Info Cards */}
        <section className="py-12">
          <div className="container-malmequer">
            <div className="grid md:grid-cols-4 gap-6 mb-12">
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <div className="w-12 h-12 bg-cream rounded-full flex items-center justify-center mx-auto mb-4">
                  <Truck className="w-6 h-6 text-malmequer-gold" />
                </div>
                <h3 className="font-semibold text-ink mb-2">Envio Rápido</h3>
                <p className="text-stone text-sm">Entregas em 24-48h para Portugal Continental</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <div className="w-12 h-12 bg-cream rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-6 h-6 text-malmequer-gold" />
                </div>
                <h3 className="font-semibold text-ink mb-2">Embalagem Cuidada</h3>
                <p className="text-stone text-sm">Produtos bem protegidos e apresentados</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <div className="w-12 h-12 bg-cream rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-6 h-6 text-malmequer-gold" />
                </div>
                <h3 className="font-semibold text-ink mb-2">Rastreamento</h3>
                <p className="text-stone text-sm">Acompanhe a sua encomenda em tempo real</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <div className="w-12 h-12 bg-cream rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-6 h-6 text-malmequer-gold" />
                </div>
                <h3 className="font-semibold text-ink mb-2">Todo o País</h3>
                <p className="text-stone text-sm">Entregas em Portugal Continental e Ilhas</p>
              </div>
            </div>
          </div>
        </section>

        {/* Detailed Info */}
        <section className="pb-16">
          <div className="container-malmequer">
            <div className="max-w-4xl mx-auto space-y-12">
              {/* Shipping Costs */}
              <div>
                <h2 className="font-display text-2xl text-ink mb-6">Custos de Envio</h2>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left py-4 px-6 font-semibold text-ink border-b">Destino</th>
                        <th className="text-left py-4 px-6 font-semibold text-ink border-b">Custo</th>
                        <th className="text-left py-4 px-6 font-semibold text-ink border-b">Prazo Estimado</th>
                      </tr>
                    </thead>
                    <tbody className="text-stone">
                      <tr className="border-b">
                        <td className="py-4 px-6">Portugal Continental</td>
                        <td className="py-4 px-6">4,50€</td>
                        <td className="py-4 px-6">1-2 dias úteis</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-4 px-6">Açores</td>
                        <td className="py-4 px-6">7,50€</td>
                        <td className="py-4 px-6">3-5 dias úteis</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-4 px-6">Madeira</td>
                        <td className="py-4 px-6">7,50€</td>
                        <td className="py-4 px-6">3-5 dias úteis</td>
                      </tr>
                      <tr className="bg-cream">
                        <td className="py-4 px-6 font-semibold text-ink">Encomendas acima de 50€</td>
                        <td className="py-4 px-6 font-semibold text-malmequer-gold">GRÁTIS</td>
                        <td className="py-4 px-6">Portugal Continental</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Processing Time */}
              <div>
                <h2 className="font-display text-2xl text-ink mb-6">Tempo de Processamento</h2>
                <div className="bg-gray-50 rounded-lg p-6">
                  <p className="text-stone leading-relaxed mb-4">
                    As encomendas são processadas em <strong>1-2 dias úteis</strong> após a confirmação do pagamento.
                  </p>
                  <ul className="list-disc pl-6 text-stone space-y-2">
                    <li>Encomendas feitas antes das 14h em dias úteis são normalmente processadas no mesmo dia</li>
                    <li>Encomendas feitas após as 14h ou em fins de semana serão processadas no próximo dia útil</li>
                    <li>Em períodos de maior procura (saldos, Natal), os prazos podem ser ligeiramente superiores</li>
                  </ul>
                </div>
              </div>

              {/* Delivery */}
              <div>
                <h2 className="font-display text-2xl text-ink mb-6">Entrega</h2>
                <div className="space-y-4">
                  <div className="border rounded-lg p-6">
                    <h3 className="font-semibold text-ink mb-3">Entrega ao Domicílio</h3>
                    <p className="text-stone leading-relaxed">
                      As encomendas são entregues na morada indicada. Se não estiver em casa no momento da entrega,
                      a transportadora deixará um aviso e tentará nova entrega ou contactá-lo para reagendar.
                    </p>
                  </div>

                  <div className="border rounded-lg p-6">
                    <h3 className="font-semibold text-ink mb-3">Ponto de Recolha</h3>
                    <p className="text-stone leading-relaxed">
                      Pode optar por receber a sua encomenda num ponto de recolha perto de si. Esta opção
                      estará disponível durante o checkout quando aplicável.
                    </p>
                  </div>
                </div>
              </div>

              {/* Tracking */}
              <div>
                <h2 className="font-display text-2xl text-ink mb-6">Rastreamento</h2>
                <p className="text-stone leading-relaxed mb-4">
                  Assim que a sua encomenda for expedida, receberá um email com:
                </p>
                <ul className="list-disc pl-6 text-stone space-y-2 mb-4">
                  <li>Número de rastreamento</li>
                  <li>Link para acompanhar a entrega</li>
                  <li>Prazo estimado de entrega</li>
                </ul>
                <p className="text-stone leading-relaxed">
                  Pode também acompanhar o estado da sua encomenda na sua área de cliente em{' '}
                  <Link href="/encomendas" className="text-malmequer-gold hover:underline">
                    Minhas Encomendas
                  </Link>.
                </p>
              </div>

              {/* Important Notes */}
              <div>
                <h2 className="font-display text-2xl text-ink mb-6">Notas Importantes</h2>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                  <ul className="space-y-3 text-stone">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600">•</span>
                      <span>Os prazos indicados são estimativas e podem variar devido a fatores externos (condições meteorológicas, greves, etc.)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600">•</span>
                      <span>Verifique sempre se os dados de entrega estão corretos antes de finalizar a encomenda</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600">•</span>
                      <span>Encomendas para apartamentos: indique o andar e se existe código de acesso ao prédio</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600">•</span>
                      <span>Para moradas empresariais: indique o nome da empresa e departamento se aplicável</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Contact */}
              <div className="text-center py-8 border-t">
                <h2 className="font-display text-2xl text-ink mb-4">Tem Dúvidas?</h2>
                <p className="text-stone mb-6">
                  Se tiver questões sobre a entrega da sua encomenda, não hesite em contactar-nos.
                </p>
                <Link
                  href="/contacto"
                  className="inline-block px-8 py-3 bg-ink text-white font-medium rounded-lg hover:bg-gray-800 transition"
                >
                  Contactar Apoio ao Cliente
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
