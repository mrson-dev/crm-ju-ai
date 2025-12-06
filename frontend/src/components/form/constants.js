/**
 * Constantes para formulários
 */

export const UF_LIST = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]

export const ESTADOS_CIVIS = [
  { value: 'solteiro', label: 'Solteiro(a)' },
  { value: 'casado', label: 'Casado(a)' },
  { value: 'divorciado', label: 'Divorciado(a)' },
  { value: 'viuvo', label: 'Viúvo(a)' },
  { value: 'uniao_estavel', label: 'União Estável' },
  { value: 'separado', label: 'Separado(a)' },
]

export const TIPOS_DOCUMENTO = [
  { value: 'rg', label: 'RG' },
  { value: 'cnh', label: 'CNH' },
  { value: 'passaporte', label: 'Passaporte' },
  { value: 'certidao_nascimento', label: 'Certidão de Nascimento' },
  { value: 'ctps', label: 'Carteira de Trabalho' },
  { value: 'outros', label: 'Outros' },
]

export const NACIONALIDADES = [
  { value: 'brasileiro', label: 'Brasileiro(a)' },
  { value: 'estrangeiro', label: 'Estrangeiro(a)' },
  { value: 'naturalizado', label: 'Naturalizado(a)' },
]

export const GENEROS = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'feminino', label: 'Feminino' },
  { value: 'outro', label: 'Outro' },
  { value: 'nao_informado', label: 'Prefiro não informar' },
]

// Máscaras
export const MASKS = {
  cpf: '###.###.###-##',
  cnpj: '##.###.###/####-##',
  cep: '#####-###',
  phone: '(##) #####-####',
  phoneFixed: '(##) ####-####',
  date: '##/##/####',
  pis: '###.#####.##-#',
  ctps: '#######-####',
}

// Regex para validações
export const REGEX = {
  cpf: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
  cnpj: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
  cep: /^\d{5}-\d{3}$/,
  phone: /^\(\d{2}\) \d{4,5}-\d{4}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  date: /^\d{2}\/\d{2}\/\d{4}$/,
}
