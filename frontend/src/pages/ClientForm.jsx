/**
 * ClientForm - Formulário completo de cadastro de cliente
 * Baseado no design de referência com todas as seções
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clientService } from '@/services/crmService'
import { useToast } from '@/components/common'
import {
  ArrowLeft,
  Save,
  Loader2,
  User,
  Phone,
  Upload,
  CheckCircle2,
  AlertCircle,
  Sparkles
} from 'lucide-react'

import {
  InputGroup,
  SelectGroup,
  MaskedInput,
  SectionHeader,
  AddressFields,
  DocumentFields,
  GuardianFields,
  UF_LIST,
  ESTADOS_CIVIS,
  NACIONALIDADES,
  useAgeCalculation,
  useMasks
} from '@/components/form'
import FormCard, { FormGrid, FormDivider } from '@/components/form/FormCard'
import { isValidCPF, isValidCNPJ } from '@/lib/utils'

// Estado inicial do formulário
const INITIAL_STATE = {
  // Identificação
  nome_completo: '',
  data_nascimento: '',
  genero: '',
  nome_mae: '',
  nome_pai: '',
  nacionalidade: 'brasileiro',
  naturalidade: '',
  uf_nascimento: '',
  estado_civil: '',
  profissao: '',
  
  // Documentos
  cpf: '',
  tipo_documento: 'rg',
  numero_documento: '',
  data_emissao: '',
  orgao_emissor: '',
  uf_emissor: '',
  ctps: '',
  pis_pasep: '',
  
  // Endereço
  cep: '',
  logradouro: '',
  numero: '',
  bairro: '',
  complemento: '',
  cidade: '',
  estado: '',
  
  // Contato
  whatsapp: '',
  telefone: '',
  email: '',
  
  // Responsável Legal (para menores)
  responsavel_nome_completo: '',
  responsavel_data_nascimento: '',
  responsavel_nacionalidade: 'brasileiro',
  responsavel_naturalidade: '',
  responsavel_uf_nascimento: '',
  responsavel_estado_civil: '',
  responsavel_profissao: '',
  responsavel_nome_mae: '',
  responsavel_nome_pai: '',
  responsavel_cpf: '',
  responsavel_tipo_documento: 'rg',
  responsavel_numero_documento: '',
  responsavel_orgao_emissor: '',
  responsavel_uf_emissor: '',
  responsavel_data_emissao: '',
  
  // LGPD
  consentimento_lgpd: false,
  
  // Observações
  observacoes: ''
}

export default function ClientForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const queryClient = useQueryClient()
  const toast = useToast()
  const fileInputRef = useRef(null)
  const { formatDate } = useMasks()

  const isEditing = Boolean(id)

  // Estados
  const [formData, setFormData] = useState(INITIAL_STATE)
  const [errors, setErrors] = useState({})
  const [showGuardian, setShowGuardian] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [uploadedFile, setUploadedFile] = useState(null)

  // Hook de cálculo de idade
  const { isMinor } = useAgeCalculation(formData.data_nascimento)

  // Carrega cliente se editando
  const { data: clientData, isLoading: loadingClient } = useQuery({
    queryKey: ['client', id],
    queryFn: () => clientService.getById(id),
    enabled: isEditing,
  })

  // Preenche formulário com dados do cliente
  useEffect(() => {
    if (clientData) {
      setFormData(prev => ({
        ...prev,
        ...clientData,
        // Formata datas para exibição
        data_nascimento: formatDate(clientData.data_nascimento, 'display'),
        data_emissao: formatDate(clientData.data_emissao, 'display'),
      }))
    }
  }, [clientData, formatDate])

  // Auto-habilita responsável se menor de idade
  useEffect(() => {
    if (isMinor) {
      setShowGuardian(true)
    }
  }, [isMinor])

  // Mutations
  const createMutation = useMutation({
    mutationFn: clientService.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['clients'])
      toast.success('Cliente cadastrado com sucesso!')
      navigate('/clients')
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Erro ao cadastrar cliente')
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => clientService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['clients'])
      queryClient.invalidateQueries(['client', id])
      toast.success('Cliente atualizado com sucesso!')
      navigate('/clients')
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Erro ao atualizar cliente')
    }
  })

  const isSaving = createMutation.isPending || updateMutation.isPending

  // Handlers
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    
    // Limpa erro do campo ao editar
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }, [errors])

  const handleBlur = useCallback((e) => {
    const { name, value } = e.target

    // Validação de CPF
    if (name === 'cpf' || name === 'responsavel_cpf') {
      if (value && value.length >= 14) {
        if (!isValidCPF(value)) {
          setErrors(prev => ({ ...prev, [name]: 'CPF inválido' }))
        }
      }
    }
  }, [])

  const validateForm = useCallback(() => {
    const newErrors = {}

    // Campos obrigatórios
    if (!formData.nome_completo?.trim()) {
      newErrors.nome_completo = 'Nome é obrigatório'
    }
    if (!formData.cpf?.trim()) {
      newErrors.cpf = 'CPF é obrigatório'
    } else if (!isValidCPF(formData.cpf)) {
      newErrors.cpf = 'CPF inválido'
    }
    if (!formData.email?.trim()) {
      newErrors.email = 'E-mail é obrigatório'
    }
    if (!formData.whatsapp?.trim()) {
      newErrors.whatsapp = 'WhatsApp é obrigatório'
    }

    // Validação do responsável (se habilitado e menor)
    if (showGuardian && isMinor) {
      if (!formData.responsavel_nome_completo?.trim()) {
        newErrors.responsavel_nome_completo = 'Nome do responsável é obrigatório'
      }
      if (!formData.responsavel_cpf?.trim()) {
        newErrors.responsavel_cpf = 'CPF do responsável é obrigatório'
      } else if (!isValidCPF(formData.responsavel_cpf)) {
        newErrors.responsavel_cpf = 'CPF do responsável inválido'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData, showGuardian, isMinor])

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Corrija os erros antes de salvar')
      return
    }

    // Prepara dados para API seguindo exatamente o schema ClientCreate
    const apiData = {
      // Campos obrigatórios
      name: formData.nome_completo,
      email: formData.email,
      phone: formData.whatsapp || formData.telefone,
      cpf_cnpj: formData.cpf.replace(/\D/g, ''),
      client_type: formData.cpf.replace(/\D/g, '').length === 11 ? 'pessoa_fisica' : 'pessoa_juridica',
      
      // Dados pessoais
      birth_date: formData.data_nascimento || null,
      nationality: formData.nacionalidade || null,
      birth_place: formData.naturalidade || null,
      marital_status: formData.estado_civil || null,
      profession: formData.profissao || null,
      mothers_name: formData.nome_mae || null,
      fathers_name: formData.nome_pai || null,
      
      // Telefone secundário
      secondary_phone: formData.telefone && formData.telefone !== formData.whatsapp ? formData.telefone : null,
      
      // Documentos (objeto DocumentInfoModel)
      documents: (formData.numero_documento || formData.ctps || formData.pis_pasep) ? {
        rg: formData.tipo_documento === 'rg' ? formData.numero_documento : null,
        rg_issuer: formData.tipo_documento === 'rg' ? formData.orgao_emissor : null,
        rg_uf: formData.tipo_documento === 'rg' ? formData.uf_emissor : null,
        ctps: formData.ctps || null,
        ctps_series: null,
        ctps_uf: null,
        pis_pasep: formData.pis_pasep || null,
      } : null,
      
      // Endereço
      cep: formData.cep?.replace(/\D/g, '') || null,
      logradouro: formData.logradouro || null,
      numero: formData.numero || null,
      bairro: formData.bairro || null,
      complemento: formData.complemento || null,
      cidade: formData.cidade || null,
      estado: formData.estado || null,
      
      // Contato
      whatsapp: formData.whatsapp?.replace(/\D/g, '') || null,
      telefone: formData.telefone?.replace(/\D/g, '') || null,
      
      // Endereço como objeto (formato esperado pelo backend)
      address: (formData.logradouro || formData.cep || formData.cidade) ? {
        cep: formData.cep || null,
        street: formData.logradouro || null,
        number: formData.numero || null,
        complement: formData.complemento || null,
        neighborhood: formData.bairro || null,
        city: formData.cidade || null,
        uf: formData.estado || null,
      } : null,
      
      // Menor de idade
      is_minor: isMinor,
      
      // LGPD
      lgpd_consent: formData.consentimento_lgpd || false,
      lgpd_consent_date: formData.consentimento_lgpd ? new Date().toISOString() : null,
      
      // Observações
      notes: formData.observacoes || null,
    }

    // Adiciona dados do responsável se aplicável (formato GuardianModel)
    if (showGuardian && isMinor && formData.responsavel_nome_completo) {
      apiData.guardian = {
        name: formData.responsavel_nome_completo || null,
        cpf: formData.responsavel_cpf?.replace(/\D/g, '') || null,
        rg: formData.responsavel_numero_documento || null,
        phone: null, // Não temos no form atual
        email: null, // Não temos no form atual
        relationship: null, // Podemos adicionar depois
      }
    }

    if (isEditing) {
      updateMutation.mutate({ id, data: apiData })
    } else {
      createMutation.mutate(apiData)
    }
  }, [formData, validateForm, showGuardian, isMinor, isEditing, id, createMutation, updateMutation, toast])

  // Upload de documento com IA
  const handleFileUpload = useCallback(async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Valida tipo de arquivo
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de arquivo não suportado. Use: PNG, JPG ou PDF')
      return
    }

    // Valida tamanho (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo: 10MB')
      return
    }

    setUploadedFile(file)
    setIsScanning(true)
    setScanProgress(0)

    try {
      // Progresso visual
      const progressInterval = setInterval(() => {
        setScanProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      // Chama API de extração
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await clientService.extractFromDocument(formData)
      
      clearInterval(progressInterval)
      setScanProgress(100)

      // Preenche formulário com dados extraídos
      if (response.extracted_data) {
        const extracted = response.extracted_data
        setFormData(prev => ({
          ...prev,
          nome_completo: extracted.name || prev.nome_completo,
          cpf: extracted.cpf_cnpj || prev.cpf,
          email: extracted.email || prev.email,
          whatsapp: extracted.phone || prev.whatsapp,
          logradouro: extracted.address || prev.logradouro,
        }))

        toast.success(
          `Documento processado! Confiança: ${response.confidence_score}%. Revise os dados.`,
          { duration: 5000 }
        )
      }
      
      setIsScanning(false)
    } catch (error) {
      logger.error('Erro ao processar documento:', error)
      
      // Tratamento detalhado de erros
      let errorMessage = 'Erro ao processar documento'
      
      if (error.response) {
        // Erro da API
        if (error.response.data?.detail) {
          errorMessage = error.response.data.detail
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message
        } else if (error.response.status === 413) {
          errorMessage = 'Arquivo muito grande para processar'
        } else if (error.response.status === 415) {
          errorMessage = 'Formato de arquivo não suportado'
        } else if (error.response.status === 500) {
          errorMessage = 'Erro no servidor ao processar documento'
        } else {
          errorMessage = `Erro HTTP ${error.response.status}: ${error.response.statusText}`
        }
      } else if (error.request) {
        // Erro de rede
        errorMessage = 'Sem resposta do servidor. Verifique sua conexão.'
      } else if (error.message) {
        // Outro tipo de erro
        errorMessage = `Erro: ${error.message}`
      }
      
      toast.error(errorMessage, { duration: 6000 })
      setIsScanning(false)
      setUploadedFile(null)
      setScanProgress(0)
    }
  }, [toast])

  if (loadingClient) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-24 sm:pb-12 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/clients"
          className="rounded-lg border border-transparent bg-white/50 p-2 text-slate-500 shadow-sm transition-all hover:border-slate-200 hover:bg-white active:scale-95"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
            {isEditing ? 'Editar Cliente' : 'Novo Cadastro de Cliente'}
          </h1>
          <p className="mt-0.5 text-xs font-medium text-slate-500">
            {isEditing ? 'Atualize as informações do cliente' : 'Preenchimento manual ou via importação inteligente'}
          </p>
        </div>
      </div>

      {/* AI Upload Section */}
      {!isEditing && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-4 transition-all ${
            isScanning
              ? 'border-primary-500 bg-primary-50'
              : 'border-slate-200 hover:border-primary-500 hover:bg-slate-50 hover:shadow-sm'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*,.pdf"
            onChange={handleFileUpload}
          />
          {isScanning ? (
            <div className="flex w-full max-w-md flex-col items-center py-2">
              <Loader2 className="mb-3 h-8 w-8 animate-spin text-primary-500" />
              <h3 className="mb-1 text-sm font-bold text-slate-900">Analisando documento...</h3>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full bg-primary-500 transition-all duration-300 ease-out"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
            </div>
          ) : uploadedFile ? (
            <div className="flex flex-col items-center py-2">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-success-100 shadow-sm">
                <CheckCircle2 className="h-5 w-5 text-success-600" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Processado com Sucesso!</h3>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setUploadedFile(null)
                }}
                className="mt-2 text-xs font-bold text-danger-500 hover:underline"
              >
                Remover arquivo
              </button>
            </div>
          ) : (
            <div className="flex flex-row items-center gap-4 py-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-slate-100 transition-transform group-hover:scale-105">
                <Upload className="h-5 w-5 text-slate-400 group-hover:text-primary-500" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles size={16} className="text-violet-500" />
                  Importar documento com IA
                </h3>
                <p className="mt-0.5 max-w-[280px] text-xs leading-snug text-slate-500">
                  Arraste ou clique para enviar RG, CNH, CTPS ou Certidões
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Seção: Identificação Civil */}
        <FormCard>
          <SectionHeader
            icon={User}
            title="Identificação Civil"
            subtitle="Dados básicos e filiação do cliente"
          />
          <FormGrid>
            <InputGroup
              label="Nome Completo"
              name="nome_completo"
              value={formData.nome_completo}
              onChange={handleChange}
              placeholder="Ex: João da Silva Santos"
              colSpan="col-span-12 md:col-span-8"
              required
              error={errors.nome_completo}
            />
            <MaskedInput
              mask="date"
              label="Data de Nascimento"
              name="data_nascimento"
              value={formData.data_nascimento}
              onChange={handleChange}
              placeholder="DD/MM/AAAA"
              colSpan="col-span-12 md:col-span-4"
              required
              error={errors.data_nascimento}
            />

            <SelectGroup
              label="Estado Civil"
              name="estado_civil"
              value={formData.estado_civil}
              onChange={handleChange}
              options={ESTADOS_CIVIS}
              colSpan="col-span-12 md:col-span-4"
            />
            <SelectGroup
              label="Gênero"
              name="genero"
              value={formData.genero}
              onChange={handleChange}
              options={[
                { value: '', label: 'Selecione' },
                { value: 'masculino', label: 'Masculino' },
                { value: 'feminino', label: 'Feminino' },
                { value: 'outro', label: 'Outro' }
              ]}
              colSpan="col-span-12 md:col-span-4"
            />
            <InputGroup
              label="Profissão"
              name="profissao"
              value={formData.profissao}
              onChange={handleChange}
              placeholder="Ex: Advogado"
              colSpan="col-span-12 md:col-span-4"
            />

            <SelectGroup
              label="Nacionalidade"
              name="nacionalidade"
              value={formData.nacionalidade}
              onChange={handleChange}
              options={NACIONALIDADES}
              colSpan="col-span-6 md:col-span-4"
            />
            <InputGroup
              label="Naturalidade"
              name="naturalidade"
              value={formData.naturalidade}
              onChange={handleChange}
              placeholder="Cidade de nascimento"
              colSpan="col-span-6 md:col-span-4"
            />
            <SelectGroup
              label="UF Nascimento"
              name="uf_nascimento"
              value={formData.uf_nascimento}
              onChange={handleChange}
              options={UF_LIST}
              colSpan="col-span-12 md:col-span-4"
            />

            <FormDivider label="Filiação" />

            <InputGroup
              label="Nome da Mãe"
              name="nome_mae"
              value={formData.nome_mae}
              onChange={handleChange}
              placeholder="Nome completo da mãe"
              colSpan="col-span-12 md:col-span-6"
              required
              error={errors.nome_mae}
            />
            <InputGroup
              label="Nome do Pai"
              name="nome_pai"
              value={formData.nome_pai}
              onChange={handleChange}
              placeholder="Nome completo do pai"
              colSpan="col-span-12 md:col-span-6"
              error={errors.nome_pai}
            />
          </FormGrid>
        </FormCard>

        {/* Seção: Documentação */}
        <FormCard>
          <DocumentFields
            values={formData}
            onChange={handleChange}
            onBlur={handleBlur}
            errors={errors}
          />
        </FormCard>

        {/* Seção: Responsável Legal */}
        <GuardianFields
          values={formData}
          onChange={handleChange}
          onBlur={handleBlur}
          errors={errors}
          showToggle={!isMinor}
          isEnabled={showGuardian}
          onToggle={() => setShowGuardian(!showGuardian)}
        />

        {/* Seção: Endereço e Contato */}
        <FormCard>
          <AddressFields
            values={formData}
            onChange={handleChange}
            errors={errors}
            required
          />

          <FormDivider label="Canais de Contato" />

          <FormGrid>
            <MaskedInput
              mask="phone"
              label="WhatsApp"
              name="whatsapp"
              value={formData.whatsapp}
              onChange={handleChange}
              placeholder="(00) 00000-0000"
              colSpan="col-span-12 md:col-span-4"
              required
              error={errors.whatsapp}
              icon={Phone}
            />
            <MaskedInput
              mask="phone"
              label="Telefone Fixo"
              name="telefone"
              value={formData.telefone}
              onChange={handleChange}
              placeholder="(00) 0000-0000"
              colSpan="col-span-12 md:col-span-4"
              error={errors.telefone}
            />
            <InputGroup
              label="E-mail Principal"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="exemplo@email.com"
              colSpan="col-span-12 md:col-span-4"
              required
              error={errors.email}
            />

            {/* Observações */}
            <div className="col-span-12 mt-4">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-700">
                Observações
              </label>
              <textarea
                name="observacoes"
                value={formData.observacoes}
                onChange={handleChange}
                placeholder="Informações adicionais sobre o cliente..."
                rows={3}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-500/20 hover:border-slate-300"
              />
            </div>

            {/* LGPD */}
            <div className="col-span-12 mt-2">
              <label className="group flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  name="consentimento_lgpd"
                  checked={formData.consentimento_lgpd}
                  onChange={handleChange}
                  className="h-5 w-5 rounded border-slate-300 text-primary-500 focus:ring-primary-500/20"
                />
                <span className="text-sm text-slate-600 transition-colors group-hover:text-slate-800">
                  Cliente autoriza o uso de seus dados pessoais conforme a LGPD
                </span>
              </label>
            </div>
          </FormGrid>
        </FormCard>

        {/* Footer Sticky */}
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white p-3 shadow-lg sm:static sm:z-auto sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
            <Link
              to="/clients"
              className="rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 active:bg-slate-100 sm:px-6"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-primary-700 hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:px-8"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>{isEditing ? 'Atualizar' : 'Salvar Cadastro'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Spacer para footer sticky no mobile */}
      <div className="h-24 sm:hidden" />
    </div>
  )
}
