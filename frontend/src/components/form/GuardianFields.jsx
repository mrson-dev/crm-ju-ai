/**
 * GuardianFields - Campos do responsável legal
 */

import { Users } from 'lucide-react'
import InputGroup from './InputGroup'
import SelectGroup from './SelectGroup'
import MaskedInput from './MaskedInput'
import SectionHeader from './SectionHeader'
import FormCard, { FormGrid, FormDivider } from './FormCard'
import { UF_LIST, ESTADOS_CIVIS, TIPOS_DOCUMENTO, NACIONALIDADES } from './constants'

export default function GuardianFields({
  values,
  onChange,
  onBlur,
  errors = {},
  showToggle = true,
  isEnabled,
  onToggle
}) {
  const prefix = 'responsavel_'
  const getFieldName = (field) => `${prefix}${field}`
  const getValue = (field) => values[getFieldName(field)] || ''
  const getError = (field) => errors[getFieldName(field)]

  // Toggle para habilitar/desabilitar
  if (showToggle && !isEnabled) {
    return (
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-primary-100 p-2.5">
            <Users className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Incluir Responsável Legal?</h4>
            <p className="mt-0.5 text-xs font-medium text-slate-500">
              Habilite para casos de representação ou menores de idade.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-200 transition-colors hover:bg-slate-300"
        >
          <span className="ml-1 inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform" />
        </button>
      </div>
    )
  }

  return (
    <FormCard variant="warning" className="animate-in fade-in slide-in-from-top-4">
      <div className="flex items-center justify-between mb-6">
        <SectionHeader
          icon={Users}
          title="Responsável Legal"
          subtitle="Representante legal do titular do cadastro"
          variant="warning"
        />
        {showToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary-500 transition-colors"
          >
            <span className="ml-6 inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform" />
          </button>
        )}
      </div>

      <FormGrid>
        <InputGroup
          label="Nome Completo"
          name={getFieldName('nome_completo')}
          value={getValue('nome_completo')}
          onChange={onChange}
          placeholder="Nome completo do responsável"
          colSpan="col-span-12 md:col-span-8"
          required
          error={getError('nome_completo')}
        />

        <MaskedInput
          mask="date"
          label="Data de Nascimento"
          name={getFieldName('data_nascimento')}
          value={getValue('data_nascimento')}
          onChange={onChange}
          placeholder="DD/MM/AAAA"
          colSpan="col-span-12 md:col-span-4"
          required
          error={getError('data_nascimento')}
        />

        <SelectGroup
          label="Nacionalidade"
          name={getFieldName('nacionalidade')}
          value={getValue('nacionalidade')}
          onChange={onChange}
          options={NACIONALIDADES}
          colSpan="col-span-6 md:col-span-4"
          error={getError('nacionalidade')}
        />

        <InputGroup
          label="Naturalidade"
          name={getFieldName('naturalidade')}
          value={getValue('naturalidade')}
          onChange={onChange}
          placeholder="Cidade de nascimento"
          colSpan="col-span-6 md:col-span-4"
          error={getError('naturalidade')}
        />

        <SelectGroup
          label="UF Nascimento"
          name={getFieldName('uf_nascimento')}
          value={getValue('uf_nascimento')}
          onChange={onChange}
          options={UF_LIST}
          colSpan="col-span-12 md:col-span-4"
          error={getError('uf_nascimento')}
        />

        <SelectGroup
          label="Estado Civil"
          name={getFieldName('estado_civil')}
          value={getValue('estado_civil')}
          onChange={onChange}
          options={ESTADOS_CIVIS}
          colSpan="col-span-12 md:col-span-4"
          required
          error={getError('estado_civil')}
        />

        <InputGroup
          label="Profissão"
          name={getFieldName('profissao')}
          value={getValue('profissao')}
          onChange={onChange}
          placeholder="Ocupação profissional"
          colSpan="col-span-12 md:col-span-8"
          required
          error={getError('profissao')}
        />

        <InputGroup
          label="Nome da Mãe"
          name={getFieldName('nome_mae')}
          value={getValue('nome_mae')}
          onChange={onChange}
          placeholder="Nome completo da mãe"
          colSpan="col-span-12 md:col-span-6"
          required
          error={getError('nome_mae')}
        />

        <InputGroup
          label="Nome do Pai"
          name={getFieldName('nome_pai')}
          value={getValue('nome_pai')}
          onChange={onChange}
          placeholder="Nome completo do pai"
          colSpan="col-span-12 md:col-span-6"
          error={getError('nome_pai')}
        />

        <FormDivider label="Documentos do Responsável" />

        <MaskedInput
          mask="cpf"
          label="CPF"
          name={getFieldName('cpf')}
          value={getValue('cpf')}
          onChange={onChange}
          onBlur={onBlur}
          placeholder="000.000.000-00"
          colSpan="col-span-12 md:col-span-6"
          required
          error={getError('cpf')}
        />

        <SelectGroup
          label="Tipo Documento"
          name={getFieldName('tipo_documento')}
          value={getValue('tipo_documento')}
          onChange={onChange}
          options={[
            { value: 'rg', label: 'RG' },
            { value: 'cnh', label: 'CNH' },
            { value: 'passaporte', label: 'Passaporte' },
          ]}
          colSpan="col-span-12 md:col-span-6"
          required
          error={getError('tipo_documento')}
        />

        <InputGroup
          label="Número"
          name={getFieldName('numero_documento')}
          value={getValue('numero_documento')}
          onChange={onChange}
          placeholder="Número do documento"
          colSpan="col-span-12 md:col-span-4"
          required
          error={getError('numero_documento')}
        />

        <InputGroup
          label="Órgão Emissor"
          name={getFieldName('orgao_emissor')}
          value={getValue('orgao_emissor')}
          onChange={onChange}
          placeholder="Ex: SSP"
          colSpan="col-span-6 md:col-span-2"
          required
          error={getError('orgao_emissor')}
        />

        <SelectGroup
          label="UF"
          name={getFieldName('uf_emissor')}
          value={getValue('uf_emissor')}
          onChange={onChange}
          options={UF_LIST}
          colSpan="col-span-6 md:col-span-2"
          required
          error={getError('uf_emissor')}
        />

        <MaskedInput
          mask="date"
          label="Data Emissão"
          name={getFieldName('data_emissao')}
          value={getValue('data_emissao')}
          onChange={onChange}
          placeholder="DD/MM/AAAA"
          colSpan="col-span-12 md:col-span-4"
          required
          error={getError('data_emissao')}
        />
      </FormGrid>
    </FormCard>
  )
}
