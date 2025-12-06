"""
Testes para funções utilitárias helpers.
"""
from datetime import datetime, timezone
from app.utils.helpers import (
    generate_id, now_utc, calculate_percentage,
    dict_remove_none, chunk_list, extract_initials, pluralize
)


def test_generate_id():
    """Testa geração de IDs únicos."""
    id1 = generate_id()
    id2 = generate_id()
    
    assert len(id1) > 0
    assert id1 != id2


def test_now_utc():
    """Testa geração de datetime UTC."""
    now = now_utc()
    
    assert isinstance(now, datetime)
    assert now.tzinfo == timezone.utc


def test_calculate_percentage():
    """Testa cálculo de porcentagem."""
    assert calculate_percentage(50, 200) == 25.0
    assert calculate_percentage(100, 200) == 50.0
    assert calculate_percentage(50, 0) == 0.0  # Divisão por zero


def test_dict_remove_none():
    """Testa remoção de valores None de dicionário."""
    data = {"a": 1, "b": None, "c": "test", "d": None}
    result = dict_remove_none(data)
    
    assert result == {"a": 1, "c": "test"}


def test_chunk_list():
    """Testa divisão de lista em chunks."""
    items = [1, 2, 3, 4, 5, 6, 7]
    chunks = list(chunk_list(items, 3))
    
    assert len(chunks) == 3
    assert chunks[0] == [1, 2, 3]
    assert chunks[1] == [4, 5, 6]
    assert chunks[2] == [7]


def test_extract_initials():
    """Testa extração de iniciais."""
    assert extract_initials("João Silva") == "JS"
    # Por padrão extrai apenas 2 primeiras palavras
    assert extract_initials("Maria da Silva Santos") == "MD"
    assert extract_initials("Pedro") == "PE"  # Nome único retorna primeiras 2 letras


def test_pluralize():
    """Testa pluralização."""
    # Função requer 3 argumentos: count, singular, plural
    assert pluralize(1, "caso", "casos") == "caso"
    assert pluralize(2, "caso", "casos") == "casos"
    assert pluralize(0, "item", "itens") == "itens"
