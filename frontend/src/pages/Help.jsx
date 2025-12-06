import { useState } from 'react'
import PageHeader from '@/components/common/PageHeader'
import { 
  HelpCircle, 
  Search, 
  Book, 
  Video, 
  MessageCircle, 
  Mail,
  Phone,
  FileText,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Lightbulb,
  Zap,
  Shield,
  DollarSign,
  Users,
  Calendar,
  FileCheck,
  Clock
} from 'lucide-react'

export default function Help() {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedFaq, setExpandedFaq] = useState(null)
  const [activeCategory, setActiveCategory] = useState('all')

  const categories = [
    { id: 'all', label: 'Todas', icon: Book },
    { id: 'getting-started', label: 'Começando', icon: Zap },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'cases', label: 'Processos', icon: FileCheck },
    { id: 'documents', label: 'Documentos', icon: FileText },
    { id: 'financial', label: 'Financeiro', icon: DollarSign },
    { id: 'calendar', label: 'Agenda', icon: Calendar },
    { id: 'security', label: 'Segurança', icon: Shield }
  ]

  const faqs = [
    {
      id: 1,
      category: 'getting-started',
      question: 'Como criar meu primeiro cliente?',
      answer: 'Para criar um cliente, acesse o menu "Clientes" no lado esquerdo e clique no botão "Novo Cliente". Preencha os dados necessários como nome, CPF/CNPJ, e-mail e telefone. Você também pode adicionar informações adicionais como endereço e observações.'
    },
    {
      id: 2,
      category: 'getting-started',
      question: 'Como cadastrar um novo processo?',
      answer: 'Vá até a seção "Processos" e clique em "Novo Processo". Selecione o cliente vinculado, adicione o número do processo, defina o status, prioridade e preencha os detalhes. Você pode adicionar tags para melhor organização.'
    },
    {
      id: 3,
      category: 'clients',
      question: 'Como importar múltiplos clientes?',
      answer: 'Atualmente, a importação em massa está em desenvolvimento. Por enquanto, cadastre clientes individualmente através do formulário. Em breve teremos a opção de importar via planilha CSV.'
    },
    {
      id: 4,
      category: 'clients',
      question: 'Como editar dados de um cliente?',
      answer: 'Clique no nome do cliente na lista ou acesse a página de detalhes. Clique no botão "Editar" (ícone de lápis) e faça as alterações necessárias. Não esqueça de salvar.'
    },
    {
      id: 5,
      category: 'cases',
      question: 'Como acompanhar prazos de processos?',
      answer: 'Utilize a página "Agenda" para visualizar todos os prazos e compromissos. Os prazos urgentes são destacados em vermelho. Você também pode ativar notificações nas configurações.'
    },
    {
      id: 6,
      category: 'cases',
      question: 'Como anexar documentos a um processo?',
      answer: 'Na página de detalhes do processo, há uma seção "Documentos". Clique em "Adicionar Documento" e faça o upload do arquivo. Você pode adicionar múltiplos documentos e categorizá-los.'
    },
    {
      id: 7,
      category: 'documents',
      question: 'Como gerar documentos a partir de templates?',
      answer: 'Acesse "Documentos" > "Templates" e selecione o template desejado. Clique em "Gerar Documento", preencha os dados necessários e o sistema criará o documento automaticamente com as informações.'
    },
    {
      id: 8,
      category: 'documents',
      question: 'Como criar meu próprio template?',
      answer: 'Na página "Templates", clique em "Novo Template". Dê um nome, escolha a categoria e utilize o editor para criar seu documento. Você pode usar placeholders como {{cliente.nome}} para auto-preenchimento.'
    },
    {
      id: 9,
      category: 'financial',
      question: 'Como registrar honorários?',
      answer: 'Na seção "Financeiro", clique em "Novo Honorário". Selecione o cliente/caso, tipo de honorário (fixo, por hora, êxito), valor e data de vencimento. O sistema calculará automaticamente os valores devidos.'
    },
    {
      id: 10,
      category: 'financial',
      question: 'Como emitir recibos e notas fiscais?',
      answer: 'Após registrar um honorário pago, você pode gerar o recibo na página de detalhes do honorário. Para notas fiscais, integre com seu sistema de emissão preferido através das configurações.'
    },
    {
      id: 11,
      category: 'calendar',
      question: 'Como adicionar um compromisso na agenda?',
      answer: 'Clique em um dia na página "Agenda" e selecione "Adicionar Evento". Defina o tipo (audiência, reunião, prazo), horário e vincule a um cliente ou processo se aplicável.'
    },
    {
      id: 12,
      category: 'calendar',
      question: 'Posso sincronizar com Google Calendar?',
      answer: 'A integração com calendários externos está em desenvolvimento. Em breve você poderá sincronizar seus compromissos com Google Calendar, Outlook e outros.'
    },
    {
      id: 13,
      category: 'security',
      question: 'Como ativar autenticação de dois fatores?',
      answer: 'Acesse "Configurações" > "Segurança" e ative a opção "Autenticação de Dois Fatores". Siga as instruções para configurar usando um aplicativo autenticador como Google Authenticator.'
    },
    {
      id: 14,
      category: 'security',
      question: 'Meus dados estão seguros?',
      answer: 'Sim! Utilizamos criptografia de ponta a ponta, backups automáticos e conformidade com a LGPD. Todos os dados são armazenados em servidores seguros com certificação SSL.'
    }
  ]

  const quickLinks = [
    { icon: Video, title: 'Vídeos Tutoriais', description: 'Aprenda visualmente', url: '#' },
    { icon: Book, title: 'Documentação', description: 'Guias completos', url: '#' },
    { icon: MessageCircle, title: 'Chat ao Vivo', description: 'Suporte imediato', url: '#' },
    { icon: Mail, title: 'Enviar E-mail', description: 'suporte@crm-ju.com', url: 'mailto:suporte@crm-ju.com' }
  ]

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory
    const matchesSearch = !searchQuery || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="space-y-5 sm:space-y-7">
      <PageHeader
        title="Central de Ajuda"
        description="Encontre respostas rápidas e aprenda a usar todas as funcionalidades"
        icon={HelpCircle}
      />

      {/* Search Bar */}
      <div className="card p-5 sm:p-7">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-base"
            placeholder="Buscar ajuda... (ex: como criar cliente)"
          />
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickLinks.map((link, index) => {
          const Icon = link.icon
          return (
            <a
              key={index}
              href={link.url}
              className="card p-5 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
                  <Icon size={24} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {link.title}
                  </h3>
                  <p className="text-sm text-slate-500">{link.description}</p>
                </div>
              </div>
            </a>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 lg:gap-7">
        {/* Categories Sidebar */}
        <div className="lg:col-span-1">
          <div className="card p-2">
            <h3 className="text-sm font-bold text-slate-900 px-4 py-2 mb-1">Categorias</h3>
            <nav className="space-y-1">
              {categories.map(category => {
                const Icon = category.icon
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      activeCategory === category.id
                        ? 'bg-blue-50 text-blue-600 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon size={18} />
                    <span className="text-sm">{category.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* FAQs */}
        <div className="lg:col-span-3 space-y-3">
          {filteredFaqs.length === 0 ? (
            <div className="card p-12 text-center">
              <Lightbulb className="mx-auto text-slate-300 mb-4" size={48} />
              <h3 className="text-lg font-bold text-slate-900 mb-2">Nenhum resultado encontrado</h3>
              <p className="text-slate-500">Tente usar palavras-chave diferentes ou entre em contato com o suporte</p>
            </div>
          ) : (
            filteredFaqs.map(faq => (
              <div key={faq.id} className="card overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                  className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`p-2 rounded-lg transition-colors ${
                      expandedFaq === faq.id ? 'bg-blue-100' : 'bg-slate-100'
                    }`}>
                      <HelpCircle size={20} className={
                        expandedFaq === faq.id ? 'text-blue-600' : 'text-slate-600'
                      } />
                    </div>
                    <h3 className="font-semibold text-slate-900 flex-1">{faq.question}</h3>
                  </div>
                  {expandedFaq === faq.id ? (
                    <ChevronDown size={20} className="text-slate-400 flex-shrink-0" />
                  ) : (
                    <ChevronRight size={20} className="text-slate-400 flex-shrink-0" />
                  )}
                </button>
                {expandedFaq === faq.id && (
                  <div className="px-5 pb-5 pl-[76px]">
                    <p className="text-slate-600 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Contact Support */}
      <div className="card p-6 sm:p-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="p-4 bg-blue-100 rounded-2xl">
            <MessageCircle size={32} className="text-blue-600" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Não encontrou o que procura?</h3>
            <p className="text-slate-600">Nossa equipe de suporte está pronta para ajudar você</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="mailto:suporte@crm-ju.com"
              className="btn btn-primary"
            >
              <Mail size={18} />
              <span>Enviar E-mail</span>
            </a>
            <a
              href="tel:+551112345678"
              className="btn btn-secondary"
            >
              <Phone size={18} />
              <span>Ligar</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
