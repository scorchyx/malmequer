import { Metadata } from 'next'
import Link from 'next/link'
import Footer from '../components/layout/Footer'
import Header from '../components/layout/Header'

export const metadata: Metadata = {
  title: 'Política de Cookies | Malmequer',
  description: 'Política de Cookies da Malmequer. Saiba como utilizamos cookies no nosso website.',
}

export default function CookiesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-white">
        <div className="container-malmequer py-12">
          <div className="max-w-4xl mx-auto">
            <h1 className="font-display text-4xl text-ink mb-8">Política de Cookies</h1>

            <div className="prose prose-stone max-w-none space-y-8">
              <p className="text-stone text-lg">
                Última atualização: Janeiro de 2025
              </p>

              <section>
                <h2 className="font-display text-2xl text-ink mb-4">1. O que são Cookies?</h2>
                <p className="text-stone leading-relaxed">
                  Cookies são pequenos ficheiros de texto que são armazenados no seu dispositivo (computador,
                  tablet ou smartphone) quando visita um website. Os cookies permitem que o website reconheça
                  o seu dispositivo e memorize informações sobre a sua visita.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl text-ink mb-4">2. Como Utilizamos Cookies</h2>
                <p className="text-stone leading-relaxed">
                  Utilizamos cookies para diversos fins, incluindo:
                </p>
                <ul className="list-disc pl-6 text-stone mt-2 space-y-1">
                  <li>Garantir o funcionamento correto do website</li>
                  <li>Manter a sua sessão iniciada</li>
                  <li>Memorizar os produtos no seu carrinho de compras</li>
                  <li>Compreender como utiliza o nosso website</li>
                  <li>Melhorar a sua experiência de navegação</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-2xl text-ink mb-4">3. Tipos de Cookies que Utilizamos</h2>

                <div className="bg-gray-50 rounded-lg p-6 mt-4">
                  <h3 className="font-semibold text-ink mb-3">3.1. Cookies Estritamente Necessários</h3>
                  <p className="text-stone text-sm leading-relaxed">
                    Estes cookies são essenciais para o funcionamento do website. Incluem cookies que permitem
                    iniciar sessão, adicionar produtos ao carrinho e efetuar pagamentos. Sem estes cookies,
                    o website não funciona corretamente.
                  </p>
                  <table className="w-full mt-3 text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 text-ink">Cookie</th>
                        <th className="text-left py-2 text-ink">Finalidade</th>
                        <th className="text-left py-2 text-ink">Duração</th>
                      </tr>
                    </thead>
                    <tbody className="text-stone">
                      <tr className="border-b">
                        <td className="py-2">next-auth.session-token</td>
                        <td className="py-2">Autenticação do utilizador</td>
                        <td className="py-2">Sessão</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">next-auth.csrf-token</td>
                        <td className="py-2">Segurança (proteção CSRF)</td>
                        <td className="py-2">Sessão</td>
                      </tr>
                      <tr>
                        <td className="py-2">cart-session</td>
                        <td className="py-2">Carrinho de compras</td>
                        <td className="py-2">30 dias</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="bg-gray-50 rounded-lg p-6 mt-4">
                  <h3 className="font-semibold text-ink mb-3">3.2. Cookies de Desempenho e Análise</h3>
                  <p className="text-stone text-sm leading-relaxed">
                    Estes cookies recolhem informações sobre como os visitantes utilizam o website, como as
                    páginas mais visitadas. Utilizamos estas informações para melhorar o funcionamento do website.
                  </p>
                  <table className="w-full mt-3 text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 text-ink">Cookie</th>
                        <th className="text-left py-2 text-ink">Finalidade</th>
                        <th className="text-left py-2 text-ink">Duração</th>
                      </tr>
                    </thead>
                    <tbody className="text-stone">
                      <tr>
                        <td className="py-2">_analytics</td>
                        <td className="py-2">Análise de utilização</td>
                        <td className="py-2">2 anos</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="bg-gray-50 rounded-lg p-6 mt-4">
                  <h3 className="font-semibold text-ink mb-3">3.3. Cookies de Funcionalidade</h3>
                  <p className="text-stone text-sm leading-relaxed">
                    Estes cookies permitem que o website memorize escolhas que faz (como o idioma ou região)
                    e forneça funcionalidades melhoradas e personalizadas.
                  </p>
                  <table className="w-full mt-3 text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 text-ink">Cookie</th>
                        <th className="text-left py-2 text-ink">Finalidade</th>
                        <th className="text-left py-2 text-ink">Duração</th>
                      </tr>
                    </thead>
                    <tbody className="text-stone">
                      <tr>
                        <td className="py-2">preferences</td>
                        <td className="py-2">Preferências do utilizador</td>
                        <td className="py-2">1 ano</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section>
                <h2 className="font-display text-2xl text-ink mb-4">4. Cookies de Terceiros</h2>
                <p className="text-stone leading-relaxed">
                  Alguns cookies são colocados por serviços de terceiros que aparecem nas nossas páginas:
                </p>

                <div className="bg-gray-50 rounded-lg p-6 mt-4">
                  <h3 className="font-semibold text-ink mb-3">Stripe (Processamento de Pagamentos)</h3>
                  <p className="text-stone text-sm leading-relaxed">
                    O Stripe utiliza cookies para processar pagamentos de forma segura e prevenir fraudes.
                  </p>
                  <p className="text-stone text-sm mt-2">
                    Política de Privacidade: <a href="https://stripe.com/privacy" className="text-malmequer-gold hover:underline" target="_blank" rel="noopener noreferrer">stripe.com/privacy</a>
                  </p>
                </div>
              </section>

              <section>
                <h2 className="font-display text-2xl text-ink mb-4">5. Gerir os Seus Cookies</h2>
                <p className="text-stone leading-relaxed">
                  Pode controlar e/ou eliminar cookies conforme desejar. Pode eliminar todos os cookies que
                  já estão no seu computador e pode configurar a maioria dos navegadores para impedir que
                  sejam colocados.
                </p>

                <h3 className="font-semibold text-ink mt-4 mb-2">Como desativar cookies no seu navegador:</h3>
                <ul className="list-disc pl-6 text-stone space-y-2">
                  <li>
                    <strong>Chrome:</strong> Definições → Privacidade e segurança → Cookies e outros dados do site
                  </li>
                  <li>
                    <strong>Firefox:</strong> Definições → Privacidade e segurança → Cookies e dados do site
                  </li>
                  <li>
                    <strong>Safari:</strong> Preferências → Privacidade → Cookies e dados do website
                  </li>
                  <li>
                    <strong>Edge:</strong> Definições → Privacidade, pesquisa e serviços → Cookies
                  </li>
                </ul>

                <p className="text-stone leading-relaxed mt-4">
                  <strong>Nota:</strong> Se desativar os cookies estritamente necessários, algumas funcionalidades
                  do website podem não funcionar corretamente (como o carrinho de compras ou o login).
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl text-ink mb-4">6. Mais Informações</h2>
                <p className="text-stone leading-relaxed">
                  Para mais informações sobre cookies, visite:
                </p>
                <ul className="list-disc pl-6 text-stone mt-2 space-y-1">
                  <li>
                    <a href="https://www.allaboutcookies.org" className="text-malmequer-gold hover:underline" target="_blank" rel="noopener noreferrer">
                      www.allaboutcookies.org
                    </a>
                  </li>
                  <li>
                    <a href="https://www.youronlinechoices.eu" className="text-malmequer-gold hover:underline" target="_blank" rel="noopener noreferrer">
                      www.youronlinechoices.eu
                    </a>
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-2xl text-ink mb-4">7. Alterações a esta Política</h2>
                <p className="text-stone leading-relaxed">
                  Podemos atualizar esta Política de Cookies periodicamente. Quaisquer alterações serão
                  publicadas nesta página com a data de atualização.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl text-ink mb-4">8. Contacto</h2>
                <p className="text-stone leading-relaxed">
                  Se tiver questões sobre a nossa utilização de cookies, contacte-nos:
                </p>
                <ul className="list-none text-stone mt-2">
                  <li>Email: privacidade@malmequer.pt</li>
                  <li>Telefone: +351 123 456 789</li>
                </ul>
                <p className="text-stone leading-relaxed mt-4">
                  Consulte também a nossa <Link href="/privacidade" className="text-malmequer-gold hover:underline">Política de Privacidade</Link>.
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
