/**
 * DocumentFields - Campos de documentação
 */

import { FileText } from 'lucide-react'
import InputGroup from './InputGroup'
import SelectGroup from './SelectGroup'
import MaskedInput from './MaskedInput'
import SectionHeader from './SectionHeader'
import { FormGrid, FormDivider } from './FormCard'
import { UF_LIST, TIPOS_DOCUMENTO } from './constants'

export default function DocumentFields({
  values,
  onChange,
  onBlur,
  errors = {},
  prefix = '',
  showHeader = true,
  showCTPS = true,
  showPIS = true
}) {
  const getFieldName = (field) => prefix ? `${prefix}${field}` : field
  const getValue = (field) => values[getFieldName(field)] || ''
  const getError = (field) => errors[getFieldName(field)]

  return (
    <>
      {showHeader && (
        <SectionHeader
          icon={FileText}
          title="Documentação"
          subtitle="Números de registro e documentos oficiais"
        />
      )}

      <FormGrid>
        <MaskedInput
          mask="cpfCnpj"
          label="CPF"
          name={getFieldName('cpf')}
          value={getValue('cpf')}
          onChange={onChange}
          onBlur={onBlur}
          placeholder="000.000.000-00"
          colSpan="col-span-12 md:col-span-4"
          required
          error={getError('cpf')}
        />

        {showCTPS && (
          <MaskedInput
            mask="ctps"
            label="CTPS (Nº-Série)"
            name={getFieldName('ctps')}
            value={getValue('ctps')}
            onChange={onChange}
            placeholder="0000000-0000"
            colSpan="col-span-12 md:col-span-4"
            error={getError('ctps')}
          />
        )}

        {showPIS && (
          <MaskedInput
            mask="pis"
            label="PIS/PASEP"
            name={getFieldName('pis_pasep')}
            value={getValue('pis_pasep')}
            onChange={onChange}
            placeholder="000.00000.00-0"
            colSpan="col-span-12 md:col-span-4"
            error={getError('pis_pasep')}
          />
        )}

        <FormDivider />

        <SelectGroup
          label="Tipo Documento"
          name={getFieldName('tipo_documento')}
          value={getValue('tipo_documento')}
          onChange={onChange}
          options={TIPOS_DOCUMENTO}
          colSpan="col-span-12 md:col-span-3"
          required
          error={getError('tipo_documento')}
        />

        <InputGroup
          label="Número Documento"
          name={getFieldName('numero_documento')}
          value={getValue('numero_documento')}
          onChange={onChange}
          placeholder="Ex: 1098765432"
          colSpan="col-span-12 md:col-span-3"
          required
          error={getError('numero_documento')}
        />

        <InputGroup
          label="Órgão Emissor"
          name={getFieldName('orgao_emissor')}
          value={getValue('orgao_emissor')}
          onChange={onChange}
          placeholder="Ex: SSP"
          colSpan="col-span-12 md:col-span-2"
          required
          error={getError('orgao_emissor')}
        />

        <SelectGroup
          label="UF Emissor"
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
          colSpan="col-span-6 md:col-span-2"
          required
          error={getError('data_emissao')}
        />
      </FormGrid>
    </>
  )
}
