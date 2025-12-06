"""
Validadores customizados para campos brasileiros.

Inclui validação de CPF, CNPJ, telefone e outros campos específicos.
"""

import re
from typing import Optional
from pydantic import field_validator, model_validator
from pydantic_core.core_schema import ValidationInfo


def validate_cpf(cpf: str) -> bool:
    """
    Valida CPF brasileiro.
    
    Args:
        cpf: String contendo o CPF (pode ter pontuação)
        
    Returns:
        True se válido, False caso contrário
    """
    # Remove caracteres não numéricos
    cpf = re.sub(r'[^0-9]', '', cpf)
    
    # CPF deve ter 11 dígitos
    if len(cpf) != 11:
        return False
    
    # CPFs com todos os dígitos iguais são inválidos
    if cpf == cpf[0] * 11:
        return False
    
    # Validação do primeiro dígito verificador
    soma = sum(int(cpf[i]) * (10 - i) for i in range(9))
    resto = (soma * 10) % 11
    if resto == 10:
        resto = 0
    if resto != int(cpf[9]):
        return False
    
    # Validação do segundo dígito verificador
    soma = sum(int(cpf[i]) * (11 - i) for i in range(10))
    resto = (soma * 10) % 11
    if resto == 10:
        resto = 0
    if resto != int(cpf[10]):
        return False
    
    return True


def validate_cnpj(cnpj: str) -> bool:
    """
    Valida CNPJ brasileiro.
    
    Args:
        cnpj: String contendo o CNPJ (pode ter pontuação)
        
    Returns:
        True se válido, False caso contrário
    """
    # Remove caracteres não numéricos
    cnpj = re.sub(r'[^0-9]', '', cnpj)
    
    # CNPJ deve ter 14 dígitos
    if len(cnpj) != 14:
        return False
    
    # CNPJs com todos os dígitos iguais são inválidos
    if cnpj == cnpj[0] * 14:
        return False
    
    # Validação do primeiro dígito verificador
    multiplicadores1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    soma = sum(int(cnpj[i]) * multiplicadores1[i] for i in range(12))
    resto = soma % 11
    digito1 = 0 if resto < 2 else 11 - resto
    if digito1 != int(cnpj[12]):
        return False
    
    # Validação do segundo dígito verificador
    multiplicadores2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    soma = sum(int(cnpj[i]) * multiplicadores2[i] for i in range(13))
    resto = soma % 11
    digito2 = 0 if resto < 2 else 11 - resto
    if digito2 != int(cnpj[13]):
        return False
    
    return True


def validate_cpf_cnpj(value: str) -> bool:
    """
    Valida CPF ou CNPJ.
    
    Args:
        value: String contendo CPF ou CNPJ
        
    Returns:
        True se for um CPF ou CNPJ válido
    """
    digits = re.sub(r'[^0-9]', '', value)
    
    if len(digits) == 11:
        return validate_cpf(value)
    elif len(digits) == 14:
        return validate_cnpj(value)
    
    return False


def format_cpf(cpf: str) -> str:
    """Formata CPF no padrão XXX.XXX.XXX-XX."""
    digits = re.sub(r'[^0-9]', '', cpf)
    if len(digits) != 11:
        return cpf
    return f"{digits[:3]}.{digits[3:6]}.{digits[6:9]}-{digits[9:]}"


def format_cnpj(cnpj: str) -> str:
    """Formata CNPJ no padrão XX.XXX.XXX/XXXX-XX."""
    digits = re.sub(r'[^0-9]', '', cnpj)
    if len(digits) != 14:
        return cnpj
    return f"{digits[:2]}.{digits[2:5]}.{digits[5:8]}/{digits[8:12]}-{digits[12:]}"


def format_cpf_cnpj(value: str) -> str:
    """Formata CPF ou CNPJ automaticamente."""
    digits = re.sub(r'[^0-9]', '', value)
    if len(digits) == 11:
        return format_cpf(value)
    elif len(digits) == 14:
        return format_cnpj(value)
    return value


def validate_phone(phone: str) -> bool:
    """
    Valida número de telefone brasileiro.
    
    Aceita formatos:
    - (XX) XXXXX-XXXX (celular)
    - (XX) XXXX-XXXX (fixo)
    - Apenas números
    
    Args:
        phone: String contendo o telefone
        
    Returns:
        True se válido
    """
    digits = re.sub(r'[^0-9]', '', phone)
    
    # Telefone deve ter 10 ou 11 dígitos (com DDD)
    if len(digits) not in [10, 11]:
        return False
    
    # DDD válidos (11-99)
    ddd = int(digits[:2])
    if ddd < 11 or ddd > 99:
        return False
    
    # Se 11 dígitos, deve começar com 9 (celular)
    if len(digits) == 11 and digits[2] != '9':
        return False
    
    return True


def format_phone(phone: str) -> str:
    """Formata telefone no padrão (XX) XXXXX-XXXX ou (XX) XXXX-XXXX."""
    digits = re.sub(r'[^0-9]', '', phone)
    
    if len(digits) == 11:
        return f"({digits[:2]}) {digits[2:7]}-{digits[7:]}"
    elif len(digits) == 10:
        return f"({digits[:2]}) {digits[2:6]}-{digits[6:]}"
    
    return phone


def validate_email(email: str) -> bool:
    """
    Valida formato básico de email.
    
    Args:
        email: String contendo o email
        
    Returns:
        True se formato válido
    """
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_oab(oab: str) -> bool:
    """
    Valida formato de número OAB.
    
    Formato esperado: UF + número (ex: SP123456, RJ12345)
    
    Args:
        oab: String contendo número OAB
        
    Returns:
        True se formato válido
    """
    # Remove espaços e converte para maiúsculo
    oab = oab.strip().upper()
    
    # Padrão: 2 letras (UF) + números
    pattern = r'^[A-Z]{2}\d{4,6}$'
    if not re.match(pattern, oab):
        return False
    
    # Verifica se UF é válida
    ufs_validas = [
        'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
        'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
        'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
    ]
    
    uf = oab[:2]
    return uf in ufs_validas


class BrazilianValidatorsMixin:
    """
    Mixin para adicionar validadores brasileiros a modelos Pydantic.
    
    Usage:
        class ClientCreate(BrazilianValidatorsMixin, BaseModel):
            cpf_cnpj: str
            phone: str
    """
    
    @field_validator('cpf_cnpj', mode='before', check_fields=False)
    @classmethod
    def validate_cpf_cnpj_field(cls, v: str) -> str:
        if v and not validate_cpf_cnpj(v):
            raise ValueError('CPF/CNPJ inválido')
        return format_cpf_cnpj(v) if v else v
    
    @field_validator('phone', mode='before', check_fields=False)
    @classmethod
    def validate_phone_field(cls, v: str) -> str:
        if v and not validate_phone(v):
            raise ValueError('Telefone inválido. Use formato (XX) XXXXX-XXXX')
        return format_phone(v) if v else v
    
    @field_validator('oab', mode='before', check_fields=False)
    @classmethod
    def validate_oab_field(cls, v: str) -> str:
        if v and not validate_oab(v):
            raise ValueError('Número OAB inválido. Use formato UF + número (ex: SP123456)')
        return v.strip().upper() if v else v


# Constantes úteis
CPF_REGEX = r'\d{3}\.?\d{3}\.?\d{3}-?\d{2}'
CNPJ_REGEX = r'\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}'
PHONE_REGEX = r'\(?\d{2}\)?\s?\d{4,5}-?\d{4}'
EMAIL_REGEX = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
