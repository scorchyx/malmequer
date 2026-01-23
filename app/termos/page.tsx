import { Metadata } from 'next'
import Footer from '../components/layout/Footer'
import Header from '../components/layout/Header'

export const metadata: Metadata = {
  title: 'Termos e Condições | Malmequer',
  description: 'Termos e Condições de utilização da loja online Malmequer. Conheça os seus direitos e obrigações.',
}

export default function TermosPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-white">
        <div className="container-malmequer py-12">
          <div className="max-w-4xl mx-auto">
            <h1 className="font-display text-4xl text-ink mb-8">Termos e Condições</h1>

            <div className="prose prose-stone max-w-none space-y-8">
              <p className="text-stone text-lg">
                Última atualização: Janeiro de 2025
              </p>

              <section>
                <h2 className="font-display text-2xl text-ink mb-4">1. Disposições Gerais</h2>
                <p className="text-stone leading-relaxed">
                  Os presentes Termos e Condições regulam a utilização do website malmequer.pt e a compra de
                  produtos através da nossa loja online. Ao utilizar este website ou efetuar uma compra,
                  aceita estes termos na íntegra.
                </p>
                <p className="text-stone leading-relaxed mt-2">
                  A Malmequer reserva-se o direito de modificar estes termos a qualquer momento. As alterações
                  entram em vigor após publicação no website.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl text-ink mb-4">2. Identificação do Vendedor</h2>
                <p className="text-stone leading-relaxed">
                  Malmequer<br />
                  Sede: Portugal<br />
                  Email: info@malmequer.pt<br />
                  Telefone: +351 123 456 789
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl text-ink mb-4">3. Produtos e Preços</h2>

                <h3 className="font-semibold text-ink mt-4 mb-2">3.1. Informação dos Produtos</h3>
                <p className="text-stone leading-relaxed">
                  Fazemos todos os esforços para garantir que as descrições e imagens dos produtos são precisas.
                  Contudo, as cores podem variar ligeiramente devido às configurações do monitor.
                </p>

                <h3 className="font-semibold text-ink mt-4 mb-2">3.2. Preços</h3>
                <p className="text-stone leading-relaxed">
                  Todos os preços apresentados incluem IVA à taxa legal em vigor. Os custos de envio são
                  apresentados separadamente durante o processo de checkout.
                </p>
                <p className="text-stone leading-relaxed mt-2">
                  Reservamo-nos o direito de alterar os preços a qualquer momento, sem aviso prévio.
                  O preço aplicável é o vigente no momento da encomenda.
                </p>

                <h3 className="font-semibold text-ink mt-4 mb-2">3.3. Disponibilidade</h3>
                <p className="text-stone leading-relaxed">
                  Os produtos estão sujeitos a disponibilidade de stock. Em caso de indisponibilidade após
                  a encomenda, será contactado para reembolso ou proposta de alternativa.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl text-ink mb-4">4. Processo de Compra</h2>

                <h3 className="font-semibold text-ink mt-4 mb-2">4.1. Encomenda</h3>
                <p className="text-stone leading-relaxed">
                  Para efetuar uma compra, deve adicionar os produtos ao carrinho e seguir o processo de checkout.
                  A encomenda só é considerada confirmada após receção do pagamento.
                </p>

                <h3 className="font-semibold text-ink mt-4 mb-2">4.2. Confirmação</h3>
                <p className="text-stone leading-relaxed">
                  Após a conclusão da encomenda, receberá um email de confirmação com os detalhes da compra
                  e número de encomenda. Guarde este email para referência.
                </p>

                <h3 className="font-semibold text-ink mt-4 mb-2">4.3. Conta de Utilizador</h3>
                <p className="text-stone leading-relaxed">
                  Pode criar uma conta para facilitar compras futuras e acompanhar as suas encomendas.
                  É responsável por manter a confidencialidade dos seus dados de acesso.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl text-ink mb-4">5. Pagamento</h2>
                <p className="text-stone leading-relaxed">
                  Aceitamos os seguintes métodos de pagamento:
                </p>
                <ul className="list-disc pl-6 text-stone mt-2 space-y-1">
                  <li>Cartão de crédito/débito (Visa, Mastercard)</li>
                  <li>Outros métodos disponíveis no checkout</li>
                </ul>
                <p className="text-stone leading-relaxed mt-2">
                  Os pagamentos são processados de forma segura através do Stripe. Não armazenamos
                  dados completos do cartão nos nossos sistemas.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl text-ink mb-4">6. Entrega</h2>

                <h3 className="font-semibold text-ink mt-4 mb-2">6.1. Zonas de Entrega</h3>
                <p className="text-stone leading-relaxed">
                  Efetuamos entregas em Portugal Continental e Ilhas. Para informações detalhadas sobre
                  prazos e custos, consulte a nossa página de Informação de Envios.
                </p>

                <h3 className="font-semibold text-ink mt-4 mb-2">6.2. Prazos</h3>
                <p className="text-stone leading-relaxed">
                  Os prazos de entrega indicados são estimativas e podem variar. Não nos responsabilizamos
                  por atrasos causados por transportadoras ou fatores externos.
                </p>

                <h3 className="font-semibold text-ink mt-4 mb-2">6.3. Receção</h3>
                <p className="text-stone leading-relaxed">
                  Verifique a encomenda no momento da entrega. Em caso de danos visíveis na embalagem,
                  recuse a entrega ou anote a ocorrência.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl text-ink mb-4">7. Direito de Livre Resolução</h2>
                <p className="text-stone leading-relaxed">
                  Nos termos do Decreto-Lei n.º 24/2014, tem o direito de resolver o contrato no prazo de
                  14 dias a contar da receção do produto, sem necessidade de indicar motivo.
                </p>
                <p className="text-stone leading-relaxed mt-2">
                  Para exercer este direito, deve comunicar a sua decisão através de declaração inequívoca
                  (por email ou carta). Consulte a nossa Política de Devoluções para mais informações.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl text-ink mb-4">8. Garantias</h2>
                <p className="text-stone leading-relaxed">
                  Todos os produtos têm garantia legal de 3 anos para defeitos de conformidade, nos termos
                  do Decreto-Lei n.º 84/2021. Para acionar a garantia, deve apresentar comprovativo de compra.
                </p>
                <p className="text-stone leading-relaxed mt-2">
                  A garantia não cobre danos causados por uso indevido, desgaste normal ou alterações não autorizadas.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl text-ink mb-4">9. Propriedade Intelectual</h2>
                <p className="text-stone leading-relaxed">
                  Todo o conteúdo deste website (textos, imagens, logótipos, design) é propriedade da
                  Malmequer ou dos seus licenciantes e está protegido por direitos de autor.
                </p>
                <p className="text-stone leading-relaxed mt-2">
                  É proibida a reprodução, distribuição ou utilização comercial do conteúdo sem autorização prévia.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl text-ink mb-4">10. Limitação de Responsabilidade</h2>
                <p className="text-stone leading-relaxed">
                  Na máxima extensão permitida por lei, a Malmequer não será responsável por danos
                  indiretos, incidentais ou consequenciais decorrentes da utilização do website ou
                  dos produtos adquiridos.
                </p>
                <p className="text-stone leading-relaxed mt-2">
                  Não garantimos que o website esteja sempre disponível ou livre de erros.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl text-ink mb-4">11. Resolução de Litígios</h2>
                <p className="text-stone leading-relaxed">
                  Em caso de litígio, pode recorrer à Plataforma Europeia de Resolução de Litígios Online:
                  <a href="https://ec.europa.eu/consumers/odr" className="text-malmequer-gold hover:underline ml-1" target="_blank" rel="noopener noreferrer">
                    ec.europa.eu/consumers/odr
                  </a>
                </p>
                <p className="text-stone leading-relaxed mt-2">
                  Pode também recorrer a entidades de resolução alternativa de litígios de consumo.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl text-ink mb-4">12. Lei Aplicável</h2>
                <p className="text-stone leading-relaxed">
                  Os presentes Termos e Condições são regidos pela lei portuguesa. Para resolução de
                  quaisquer litígios, será competente o foro da comarca da sede do consumidor.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl text-ink mb-4">13. Contacto</h2>
                <p className="text-stone leading-relaxed">
                  Para questões sobre estes Termos e Condições, contacte-nos:
                </p>
                <ul className="list-none text-stone mt-2">
                  <li>Email: info@malmequer.pt</li>
                  <li>Telefone: +351 123 456 789</li>
                </ul>
              </section>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
