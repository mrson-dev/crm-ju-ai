"""
Testes para funções utilitárias de formatação.
"""
from app.utils.formatters import (
    format_cpf, format_cnpj, format_phone,
    format_currency, format_file_size, sanitize_filename
)


def test_format_cpf():
    """Testa formatação de CPF."""
    assert format_cpf("12345678901") == "123.456.789-01"
    assert format_cpf("123.456.789-01") == "123.456.789-01"
    # String sem dígitos retorna vazia após re.sub
    assert format_cpf("invalid") == ""


def test_format_cnpj():
    """Testa formatação de CNPJ."""
    assert format_cnpj("12345678000190") == "12.345.678/0001-90"
    assert format_cnpj("12.345.678/0001-90") == "12.345.678/0001-90"


def test_format_phone():
    """Testa formatação de telefone."""
    assert format_phone("11987654321") == "(11) 98765-4321"
    assert format_phone("1133334444") == "(11) 3333-4444"
    # Números inválidos retornam sem formatação (apenas dígitos)
    assert format_phone("invalid") == ""


def test_format_currency():
    """Testa formatação de moeda."""
    assert format_currency(1234.56) == "R$ 1.234,56"
    assert format_currency(0) == "R$ 0,00"
    assert format_currency(1000000) == "R$ 1.000.000,00"

def test_format_file_size():
    """Testa formatação de tamanho de arquivo."""
    assert format_file_size(500) == "500.0 B"
    assert format_file_size(1024) == "1.0 KB"
    assert format_file_size(1048576) == "1.0 MB"
    assert format_file_size(1073741824) == "1.0 GB"


def test_sanitize_filename():
    """Testa sanitização de nome de arquivo."""
    assert sanitize_filename("arquivo teste.pdf") == "arquivo_teste.pdf"
    assert sanitize_filename("relatório#2024.docx") == "relatório2024.docx"
    # Implementação remove caracteres especiais mantendo letras e números
    assert sanitize_filename("contrato/\\:*?<>|.txt") == "contrato.txt"
