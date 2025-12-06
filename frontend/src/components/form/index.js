/**
 * Componentes de Formulário Reutilizáveis
 * Baseado em padrões de design atômico
 */

export { default as InputGroup } from './InputGroup'
export { default as SelectGroup } from './SelectGroup'
export { default as SectionHeader } from './SectionHeader'
export { default as FormCard } from './FormCard'
export { default as MaskedInput } from './MaskedInput'
export { default as AddressFields } from './AddressFields'
export { default as DocumentFields } from './DocumentFields'
export { default as GuardianFields } from './GuardianFields'

// Constantes de formulário
export * from './constants'

// Hooks de formulário
export { useCepLookup } from './hooks/useCepLookup'
export { useAgeCalculation } from './hooks/useAgeCalculation'
export { useMasks } from './hooks/useMasks'
