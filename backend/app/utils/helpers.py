"""
Funções auxiliares gerais do sistema.
"""

from typing import Any, Dict, List
from datetime import datetime, timezone
import hashlib
import secrets
import string


def generate_id(prefix: str = "", length: int = 8) -> str:
    """Gera ID único curto"""
    random_part = ''.join(secrets.choice(string.ascii_lowercase + string.digits) for _ in range(length))
    return f"{prefix}{random_part}" if prefix else random_part


def hash_string(text: str) -> str:
    """Gera hash SHA256 de uma string"""
    return hashlib.sha256(text.encode()).hexdigest()


def now_utc() -> datetime:
    """Retorna datetime atual em UTC"""
    return datetime.now(timezone.utc)


def calculate_percentage(part: float, total: float) -> float:
    """Calcula porcentagem com segurança contra divisão por zero"""
    if total == 0:
        return 0.0
    return (part / total) * 100


def dict_remove_none(data: Dict[str, Any]) -> Dict[str, Any]:
    """Remove chaves com valores None do dicionário"""
    return {k: v for k, v in data.items() if v is not None}


def merge_dicts(*dicts: Dict) -> Dict:
    """Merge múltiplos dicionários (último sobrescreve)"""
    result = {}
    for d in dicts:
        result.update(d)
    return result


def chunk_list(lst: List[Any], chunk_size: int) -> List[List[Any]]:
    """Divide lista em chunks menores"""
    return [lst[i:i + chunk_size] for i in range(0, len(lst), chunk_size)]


def safe_int(value: Any, default: int = 0) -> int:
    """Converte para int com valor padrão se falhar"""
    try:
        return int(value)
    except (ValueError, TypeError):
        return default


def safe_float(value: Any, default: float = 0.0) -> float:
    """Converte para float com valor padrão se falhar"""
    try:
        return float(value)
    except (ValueError, TypeError):
        return default


def extract_initials(name: str, max_chars: int = 2) -> str:
    """Extrai iniciais de um nome"""
    words = name.strip().split()
    if not words:
        return ""
    
    if len(words) == 1:
        return words[0][:max_chars].upper()
    
    return ''.join(w[0].upper() for w in words[:max_chars])


def pluralize(count: int, singular: str, plural: str) -> str:
    """Retorna forma plural ou singular baseado no count"""
    return singular if count == 1 else plural


def format_list_to_string(items: List[str], separator: str = ", ", last_separator: str = " e ") -> str:
    """Formata lista para string legível: ['a', 'b', 'c'] -> 'a, b e c'"""
    if not items:
        return ""
    if len(items) == 1:
        return items[0]
    if len(items) == 2:
        return f"{items[0]}{last_separator}{items[1]}"
    
    return f"{separator.join(items[:-1])}{last_separator}{items[-1]}"


__all__ = [
    'generate_id',
    'hash_string',
    'now_utc',
    'calculate_percentage',
    'dict_remove_none',
    'merge_dicts',
    'chunk_list',
    'safe_int',
    'safe_float',
    'extract_initials',
    'pluralize',
    'format_list_to_string',
]
