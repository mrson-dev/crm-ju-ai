"""
Formatadores de dados (CPF, CNPJ, telefone, datas, etc).
"""

import re
from datetime import datetime


def format_cpf(cpf: str) -> str:
    """Formata CPF: 12345678901 -> 123.456.789-01"""
    cpf = re.sub(r'\D', '', cpf)
    if len(cpf) != 11:
        return cpf
    return f"{cpf[:3]}.{cpf[3:6]}.{cpf[6:9]}-{cpf[9:]}"


def format_cnpj(cnpj: str) -> str:
    """Formata CNPJ: 12345678000190 -> 12.345.678/0001-90"""
    cnpj = re.sub(r'\D', '', cnpj)
    if len(cnpj) != 14:
        return cnpj
    return f"{cnpj[:2]}.{cnpj[2:5]}.{cnpj[5:8]}/{cnpj[8:12]}-{cnpj[12:]}"


def format_cpf_cnpj(doc: str) -> str:
    """Formata CPF ou CNPJ automaticamente"""
    doc = re.sub(r'\D', '', doc)
    if len(doc) == 11:
        return format_cpf(doc)
    elif len(doc) == 14:
        return format_cnpj(doc)
    return doc


def format_phone(phone: str) -> str:
    """
    Formata telefone brasileiro.
    11987654321 -> (11) 98765-4321
    1134567890 -> (11) 3456-7890
    """
    phone = re.sub(r'\D', '', phone)
    
    if len(phone) == 11:  # Celular
        return f"({phone[:2]}) {phone[2:7]}-{phone[7:]}"
    elif len(phone) == 10:  # Fixo
        return f"({phone[:2]}) {phone[2:6]}-{phone[6:]}"
    
    return phone


def format_cep(cep: str) -> str:
    """Formata CEP: 01310100 -> 01310-100"""
    cep = re.sub(r'\D', '', cep)
    if len(cep) != 8:
        return cep
    return f"{cep[:5]}-{cep[5:]}"


def format_currency(value: float, symbol: str = "R$") -> str:
    """Formata valor monetário: 1234.56 -> R$ 1.234,56"""
    return f"{symbol} {value:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def format_date_br(date: datetime) -> str:
    """Formata data no padrão brasileiro: 05/12/2025"""
    return date.strftime("%d/%m/%Y")


def format_datetime_br(dt: datetime) -> str:
    """Formata data e hora: 05/12/2025 14:30"""
    return dt.strftime("%d/%m/%Y %H:%M")


def truncate_text(text: str, max_length: int = 100, suffix: str = "...") -> str:
    """Trunca texto mantendo palavras completas"""
    if len(text) <= max_length:
        return text
    
    truncated = text[:max_length].rsplit(' ', 1)[0]
    return truncated + suffix


def sanitize_filename(filename: str) -> str:
    """Remove caracteres inválidos de nomes de arquivo"""
    # Remove caracteres perigosos
    filename = re.sub(r'[^\w\s.-]', '', filename)
    # Remove espaços múltiplos
    filename = re.sub(r'\s+', '_', filename)
    return filename.lower()


def format_file_size(bytes_size: int) -> str:
    """Formata tamanho de arquivo: 1024 -> 1 KB"""
    size = float(bytes_size)
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if size < 1024.0:
            return f"{size:.1f} {unit}"
        size /= 1024.0
    return f"{size:.1f} PB"


__all__ = [
    'format_cpf',
    'format_cnpj',
    'format_cpf_cnpj',
    'format_phone',
    'format_cep',
    'format_currency',
    'format_date_br',
    'format_datetime_br',
    'truncate_text',
    'sanitize_filename',
    'format_file_size',
]
