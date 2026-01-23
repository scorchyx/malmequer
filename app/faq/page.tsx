import { Metadata } from 'next'
import Link from 'next/link'
import Footer from '../components/layout/Footer'
import Header from '../components/layout/Header'
import { ChevronDown } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Perguntas Frequentes | Malmequer',
  description: 'Encontre respostas às perguntas mais frequentes sobre encomendas, envios, devoluções e pagamentos na Malmequer.',
}

interface FAQItem {
  question: string
  answer: string
}

interface FAQCategory {
  title: string
  items: FAQItem[]
}

const faqCategories: FAQCategory[] = [
  {
    title: 'Encomendas e Pagamentos',
    items: [
      {
        question: 'Que métodos de pagamento aceitam?',
        answer: 'Aceitamos pagamentos por cartão de crédito/débito (Visa, Mastercard, American Express) através do Stripe, uma plataforma de pagamentos segura e encriptada.',
      },
      {
        question: 'É seguro fazer compras no vosso site?',
        answer: 'Sim, absolutamente. Utilizamos encriptação SSL em todo o site e os pagamentos são processados através do Stripe, que cumpre os mais elevados padrões de segurança (PCI DSS Level 1).',
      },
      {
        question: 'Como sei que a minha encomenda foi confirmada?',
        answer: 'Após a conclusão do pagamento, receberá um email de confirmação com os detalhes da sua encomenda e um número de referência. Pode também consultar o estado das suas encomendas na sua área de cliente.',
      },
      {
        question: 'Posso alterar ou cancelar a minha encomenda?',
        answer: 'Se precisar de alterar ou cancelar a sua encomenda, contacte-nos o mais rapidamente possível através da página de contacto. Se a encomenda ainda não tiver sido expedida, faremos o possível para ajudar.',
      },
      {
        question: 'Emitem fatura?',
        answer: 'Sim, todas as encomendas incluem fatura. A fatura é enviada por email após a confirmação do pagamento e também está disponível na sua área de cliente.',
      },
    ],
  },
  {
    title: 'Envios e Entregas',
    items: [
      {
        question: 'Qual é o custo de envio?',
        answer: 'O envio para Portugal Continental custa 4,50€ e para as Ilhas (Açores e Madeira) custa 7,50€. Encomendas acima de 50€ têm envio grátis para Portugal Continental.',
      },
      {
        question: 'Quanto tempo demora a entrega?',
        answer: 'As encomendas são processadas em 1-2 dias úteis. A entrega demora 1-2 dias úteis para Portugal Continental e 3-5 dias úteis para as Ilhas após expedição.',
      },
      {
        question: 'Como posso rastrear a minha encomenda?',
        answer: 'Assim que a sua encomenda for expedida, receberá um email com o número de rastreamento e um link para acompanhar a entrega. Pode também verificar o estado na sua área de cliente.',
      },
      {
        question: 'O que acontece se não estiver em casa?',
        answer: 'A transportadora deixará um aviso e tentará nova entrega ou contactá-lo para reagendar. Também pode optar por entrega num ponto de recolha durante o checkout.',
      },
      {
        question: 'Fazem entregas internacionais?',
        answer: 'De momento, fazemos entregas apenas para Portugal (Continental e Ilhas). Estamos a trabalhar para expandir as nossas entregas para outros países em breve.',
      },
    ],
  },
  {
    title: 'Devoluções e Trocas',
    items: [
      {
        question: 'Posso devolver um produto?',
        answer: 'Sim, tem 14 dias após a receção para devolver produtos que não tenham sido usados e estejam nas condições originais, com etiquetas e embalagem.',
      },
      {
        question: 'Como faço uma devolução?',
        answer: 'Contacte-nos através da página de contacto indicando o número da encomenda e o motivo da devolução. Enviaremos instruções detalhadas para proceder à devolução.',
      },
      {
        question: 'Quem paga os portes de devolução?',
        answer: 'Se a devolução for por defeito ou erro nosso, assumimos os custos. Para devoluções por arrependimento, os portes são da responsabilidade do cliente.',
      },
      {
        question: 'Quanto tempo demora o reembolso?',
        answer: 'Após recebermos e verificarmos o produto devolvido, o reembolso é processado em até 14 dias úteis para o método de pagamento original.',
      },
      {
        question: 'Posso trocar por outro tamanho ou cor?',
        answer: 'Sim, se o produto estiver disponível. Contacte-nos para verificar disponibilidade e organizar a troca. Os portes de envio da nova peça podem ser aplicados.',
      },
    ],
  },
  {
    title: 'Produtos e Stock',
    items: [
      {
        question: 'Os produtos são originais?',
        answer: 'Sim, todos os produtos vendidos na Malmequer são originais e de qualidade garantida. Trabalhamos diretamente com fornecedores de confiança.',
      },
      {
        question: 'O que faço se o meu tamanho estiver esgotado?',
        answer: 'Pode contactar-nos para saber se teremos reposição. Alguns produtos podem ser repostos em breve, outros são edições limitadas.',
      },
      {
        question: 'Como sei qual tamanho escolher?',
        answer: 'Cada produto tem um guia de tamanhos disponível na página do produto. Se tiver dúvidas, contacte-nos com as suas medidas e ajudamos a escolher.',
      },
      {
        question: 'Os produtos podem variar das fotos?',
        answer: 'As cores podem variar ligeiramente devido às configurações do ecrã. Fazemos o possível para que as fotos representem fielmente os produtos.',
      },
    ],
  },
  {
    title: 'Conta e Privacidade',
    items: [
      {
        question: 'Preciso de criar conta para comprar?',
        answer: 'Sim, é necessário criar uma conta para fazer encomendas. Isto permite-nos gerir melhor as suas encomendas e oferecer um serviço mais personalizado.',
      },
      {
        question: 'Como altero os meus dados pessoais?',
        answer: 'Pode alterar os seus dados na área de cliente, em "Perfil" ou "Definições". Se precisar de ajuda, contacte-nos.',
      },
      {
        question: 'Os meus dados estão seguros?',
        answer: 'Sim, levamos a proteção de dados muito a sério. Cumprimos o RGPD e utilizamos encriptação SSL. Consulte a nossa Política de Privacidade para mais detalhes.',
      },
      {
        question: 'Posso eliminar a minha conta?',
        answer: 'Sim, pode solicitar a eliminação da sua conta contactando-nos. Note que isto pode afetar o acesso ao histórico de encomendas.',
      },
    ],
  },
]

function FAQAccordion({ category }: { category: FAQCategory }) {
  return (
    <div className="mb-10">
      <h2 className="font-display text-2xl text-ink mb-6">{category.title}</h2>
      <div className="space-y-3">
        {category.items.map((item, index) => (
          <details
            key={index}
            className="group bg-white border border-cloud rounded-lg overflow-hidden"
          >
            <summary className="flex items-center justify-between p-5 cursor-pointer list-none hover:bg-gray-50 transition-colors">
              <span className="font-medium text-ink pr-4">{item.question}</span>
              <ChevronDown className="w-5 h-5 text-stone flex-shrink-0 transition-transform group-open:rotate-180" />
            </summary>
            <div className="px-5 pb-5 pt-0">
              <p className="text-stone leading-relaxed">{item.answer}</p>
            </div>
          </details>
        ))}
      </div>
    </div>
  )
}

export default function FAQPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-white">
        {/* Hero Section */}
        <section className="bg-cream py-12 md:py-16">
          <div className="container-malmequer">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="font-display text-4xl md:text-5xl text-ink mb-4">Perguntas Frequentes</h1>
              <p className="text-stone text-lg">
                Encontre respostas às dúvidas mais comuns sobre a Malmequer.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Content */}
        <section className="py-12">
          <div className="container-malmequer">
            <div className="max-w-3xl mx-auto">
              {faqCategories.map((category, index) => (
                <FAQAccordion key={index} category={category} />
              ))}

              {/* Contact CTA */}
              <div className="text-center py-10 border-t border-cloud mt-10">
                <h2 className="font-display text-2xl text-ink mb-4">Não encontrou o que procurava?</h2>
                <p className="text-stone mb-6">
                  A nossa equipa está disponível para ajudar com qualquer questão.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/contacto"
                    className="inline-block px-8 py-3 bg-ink text-white font-medium rounded-lg hover:bg-gray-800 transition"
                  >
                    Contactar-nos
                  </Link>
                  <Link
                    href="/envios"
                    className="inline-block px-8 py-3 border border-ink text-ink font-medium rounded-lg hover:bg-gray-50 transition"
                  >
                    Ver Info de Envios
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
