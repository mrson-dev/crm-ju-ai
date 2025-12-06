/**
 * AddressFields - Campos de endereço com busca de CEP
 */

import { useCallback } from 'react'
import { MapPin } from 'lucide-react'
import InputGroup from './InputGroup'
import SelectGroup from './SelectGroup'
import MaskedInput from './MaskedInput'
import SectionHeader from './SectionHeader'
import { FormGrid, FormDivider } from './FormCard'
import { UF_LIST } from './constants'
import { useCepLookup } from './hooks/useCepLookup'

export default function AddressFields({
  values,
  onChange,
  errors = {},
  prefix = '',
  showHeader = true,
  required = false
}) {
  const { lookup, loading: loadingCep, error: cepError } = useCepLookup()

  const getFieldName = (field) => prefix ? `${prefix}${field}` : field
  const getValue = (field) => values[getFieldName(field)] || ''
  const getError = (field) => errors[getFieldName(field)] || (field === 'cep' ? cepError : null)

  const handleChange = useCallback((e) => {
    onChange(e)
  }, [onChange])

  const handleCepBlur = useCallback(async (e) => {
    const cep = e.target.value
    const addressData = await lookup(cep)
    
    if (addressData) {
      // Dispara eventos para atualizar os campos de endereço
      const fields = ['logradouro', 'bairro', 'cidade', 'estado']
      fields.forEach(field => {
        const syntheticEvent = {
          target: {
            name: getFieldName(field),
            value: addressData[field] || ''
          }
        }
        onChange(syntheticEvent)
      })
    }
  }, [lookup, onChange, getFieldName])

  return (
    <>
      {showHeader && (
        <SectionHeader
          icon={MapPin}
          title="Endereço"
          subtitle="Localização residencial ou comercial"
        />
      )}
      
      <FormGrid>
        <MaskedInput
          mask="cep"
          label="CEP"
          name={getFieldName('cep')}
          value={getValue('cep')}
          onChange={handleChange}
          onBlur={handleCepBlur}
          placeholder="00000-000"
          colSpan="col-span-6 md:col-span-2"
          required={required}
          loading={loadingCep}
          error={getError('cep')}
        />

        <InputGroup
          label="Logradouro"
          name={getFieldName('logradouro')}
          value={getValue('logradouro')}
          onChange={handleChange}
          placeholder="Ex: Rua, Avenida, Travessa..."
          colSpan="col-span-12 md:col-span-6"
          required={required}
          error={getError('logradouro')}
        />

        <InputGroup
          label="Número"
          name={getFieldName('numero')}
          value={getValue('numero')}
          onChange={handleChange}
          placeholder="Nº"
          colSpan="col-span-6 md:col-span-2"
          required={required}
          error={getError('numero')}
        />

        <InputGroup
          label="Complemento"
          name={getFieldName('complemento')}
          value={getValue('complemento')}
          onChange={handleChange}
          placeholder="Apto, Sala, Bloco..."
          colSpan="col-span-6 md:col-span-2"
          error={getError('complemento')}
        />

        <InputGroup
          label="Bairro"
          name={getFieldName('bairro')}
          value={getValue('bairro')}
          onChange={handleChange}
          placeholder="Nome do bairro"
          colSpan="col-span-12 md:col-span-4"
          required={required}
          error={getError('bairro')}
        />

        <InputGroup
          label="Cidade"
          name={getFieldName('cidade')}
          value={getValue('cidade')}
          onChange={handleChange}
          placeholder="Nome da cidade"
          colSpan="col-span-12 md:col-span-4"
          required={required}
          error={getError('cidade')}
        />

        <SelectGroup
          label="Estado (UF)"
          name={getFieldName('estado')}
          value={getValue('estado')}
          onChange={handleChange}
          options={UF_LIST}
          colSpan="col-span-12 md:col-span-2"
          required={required}
          error={getError('estado')}
        />
      </FormGrid>
    </>
  )
}
