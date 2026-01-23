import { Metadata } from 'next'
import Footer from '../components/layout/Footer'
import Header from '../components/layout/Header'

export const metadata: Metadata = {
  title: 'Política de Privacidade | Malmequer',
  description: 'Política de Privacidade da Malmequer. Saiba como recolhemos, utilizamos e protegemos os seus dados pessoais.',
}

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-white">
        <div className="container-malmequer py-12">
          <div className="max-w-4xl mx-auto">
            <h1 className="font-display text-4xl text-ink mb-8">Política de Privacidade</h1>

            <div className="prose prose-stone max-w-none space-y-8">
              <p className="text-stone text-lg">
                Última atualização: Janeiro de 2025
              </p>

              <section>
                <h2 className="font-display text-2xl text-ink mb-4">1. Introdução</h2>
                <p className="text-stone leading-relaxed">
                  A Malmequer está comprometida em proteger a privacidade dos seus clientes e utilizadores do nosso website.
                  Esta Política de Privacidade explica como recolhemos, utilizamos, armazenamos e protegemos os seus dados
                  pessoais em conformidade com o Regulamento Geral sobre a Proteção de Dados (RGPD) e a legislação portuguesa aplicável.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl text-ink mb-4">2. Responsável pelo Tratamento de Dados</h2>
                <p className="text-stone leading-relaxed">
                  O responsável pelo tratamento dos seus dados pessoais é a Malmequer, com sede em Portugal.
                </p>
                <p className="text-stone leading-relaxed mt-2">
                  Para questões relacionadas com privacidade, pode contactar-nos através de:
                </p>
                <ul className="list-disc pl-6 text-stone mt-2 space-y-1">
                  <li>Email: privacidade@malmequer.pt</li>
                  <li>Telefone: +351 123 456 789</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-2xl text-ink mb-4">3. Dados Pessoais que Recolhemos</h2>
                <p className="text-stone leading-relaxed">
                  Recolhemos os seguintes tipos de dados pessoais:
                </p>

                <h3 className="font-semibold text-ink mt-4 mb-2">3.1. Dados fornecidos diretamente por si:</h3>
                <ul className="list-disc pl-6 text-stone space-y-1">
                  <li>Nome completo</li>
                  <li>Endereço de email</li>
                  <li>Número de telefone</li>
                  <li>Morada de entrega e faturação</li>
                  <li>Dados de pagamento (processados de forma segura através do Stripe)</li>
                  <li>Histórico de encomendas</li>
                </ul>

                <h3 className="font-semibold text-ink mt-4 mb-2">3.2. Dados recolhidos automaticamente:</h3>
                <ul className="list-disc pl-6 text-stone space-y-1">
                  <li>Endereço IP</li>
                  <li>Tipo de navegador e dispositivo</li>
                  <li>Páginas visitadas e tempo de navegação</li>
                  <li>Dados de cookies (ver Política de Cookies)</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-2xl text-ink mb-4">4. Finalidades do Tratamento</h2>
                <p className="text-stone leading-relaxed">
                  Utilizamos os seus dados pessoais para as seguintes finalidades:
                </p>
                <ul className="list-disc pl-6 text-stone mt-2 space-y-1">
                  <li>Processar e gerir as suas encomendas</li>
                  <li>Comunicar consigo sobre o estado das encomendas</li>
                  <li>Gerir a sua conta de utilizador</li>
                  <li>Enviar newsletters e comunicações de marketing (com o seu consentimento)</li>
                  <li>Melhorar os nossos serviços e experiência de utilizador</li>
                  <li>Cumprir obrigações legais e fiscais</li>
                  <li>Prevenir fraudes e garantir a segurança</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-2xl text-ink mb-4">5. Base Legal para o Tratamento</h2>
                <p className="text-stone leading-relaxed">
                  O tratamento dos seus dados pessoais baseia-se nas seguintes bases legais:
                </p>
                <ul className="list-disc pl-6 text-stone mt-2 space-y-1">
                  <li><strong>Execução de contrato:</strong> para processar encomendas e fornecer os nossos serviços</li>
                  <li><strong>Consentimento:</strong> para envio de comunicações de marketing</li>
                  <li><strong>Obrigação legal:</strong> para cumprir obrigações fiscais e legais</li>
                  <li><strong>Interesse legítimo:</strong> para melhorar os nossos serviços e prevenir fraudes</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-2xl text-ink mb-4">6. Partilha de Dados</h2>
                <p className="text-stone leading-relaxed">
                  Podemos partilhar os seus dados pessoais com:
                </p>
                <ul className="list-disc pl-6 text-stone mt-2 space-y-1">
                  <li><strong>Transportadoras:</strong> para entrega das encomendas</li>
                  <li><strong>Processadores de pagamento:</strong> Stripe, para processar pagamentos de forma segura</li>
                  <li><strong>Fornecedores de serviços:</strong> para email, alojamento e análise</li>
                  <li><strong>Autoridades:</strong> quando exigido por lei</li>
                </ul>
                <p className="text-stone leading-relaxed mt-2">
                  Não vendemos nem partilhamos os seus dados pessoais com terceiros para fins de marketing.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl text-ink mb-4">7. Retenção de Dados</h2>
                <p className="text-stone leading-relaxed">
                  Conservamos os seus dados pessoais apenas pelo tempo necessário para as finalidades
                  para as quais foram recolhidos:
                </p>
                <ul className="list-disc pl-6 text-stone mt-2 space-y-1">
                  <li>Dados de conta: enquanto a conta estiver ativa</li>
                  <li>Dados de encomendas: 10 anos (obrigação fiscal)</li>
                  <li>Dados de marketing: até retirada do consentimento</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-2xl text-ink mb-4">8. Os Seus Direitos</h2>
                <p className="text-stone leading-relaxed">
                  Ao abrigo do RGPD, tem os seguintes direitos:
                </p>
                <ul className="list-disc pl-6 text-stone mt-2 space-y-1">
                  <li><strong>Direito de acesso:</strong> obter confirmação e acesso aos seus dados</li>
                  <li><strong>Direito de retificação:</strong> corrigir dados inexatos ou incompletos</li>
                  <li><strong>Direito ao apagamento:</strong> solicitar a eliminação dos seus dados</li>
                  <li><strong>Direito à limitação:</strong> restringir o tratamento dos seus dados</li>
                  <li><strong>Direito de portabilidade:</strong> receber os seus dados em formato estruturado</li>
                  <li><strong>Direito de oposição:</strong> opor-se ao tratamento para marketing direto</li>
                  <li><strong>Direito de retirar consentimento:</strong> a qualquer momento</li>
                </ul>
                <p className="text-stone leading-relaxed mt-4">
                  Para exercer os seus direitos, contacte-nos através de privacidade@malmequer.pt
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl text-ink mb-4">9. Segurança dos Dados</h2>
                <p className="text-stone leading-relaxed">
                  Implementamos medidas técnicas e organizacionais adequadas para proteger os seus dados pessoais, incluindo:
                </p>
                <ul className="list-disc pl-6 text-stone mt-2 space-y-1">
                  <li>Encriptação SSL/TLS em todas as comunicações</li>
                  <li>Armazenamento seguro com acesso restrito</li>
                  <li>Monitorização e deteção de ameaças</li>
                  <li>Formação regular da equipa em proteção de dados</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-2xl text-ink mb-4">10. Transferências Internacionais</h2>
                <p className="text-stone leading-relaxed">
                  Alguns dos nossos fornecedores de serviços podem estar localizados fora do Espaço Económico Europeu.
                  Nestes casos, garantimos que existem salvaguardas adequadas, como cláusulas contratuais-tipo aprovadas
                  pela Comissão Europeia.
                </p>
              </section>

              <section>
                <h2 className="font-display text-2xl text-ink mb-4">11. Reclamações</h2>
                <p className="text-stone leading-relaxed">
                  Se considerar que o tratamento dos seus dados viola os seus direitos, pode apresentar uma reclamação
                  junto da Comissão Nacional de Proteção de Dados (CNPD):
                </p>
                <ul className="list-none text-stone mt-2">
                  <li>Website: www.cnpd.pt</li>
                  <li>Email: geral@cnpd.pt</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-2xl text-ink mb-4">12. Alterações a esta Política</h2>
                <p className="text-stone leading-relaxed">
                  Podemos atualizar esta Política de Privacidade periodicamente. Quaisquer alterações significativas
                  serão comunicadas através do nosso website ou por email. Recomendamos que reveja esta política regularmente.
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
