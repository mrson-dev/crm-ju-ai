import re
from typing import Optional


class PromptSanitizer:
    """
    Sanitiza inputs antes de enviar para modelos de IA.
    Previne Prompt Injection e ataques similares.
    """
    
    DANGEROUS_PATTERNS = [
        r"ignore\s+(previous|all|above)\s+instructions?",
        r"disregard\s+(previous|all|above)",
        r"forget\s+(previous|all|above)",
        r"system\s*:\s*",
        r"<\|im_start\|>",
        r"<\|im_end\|>",
        r"\[INST\]",
        r"\[/INST\]",
        r"###\s*Instruction",
        r"###\s*System",
        r"You\s+are\s+now",
        r"Act\s+as\s+a",
        r"Pretend\s+to\s+be",
    ]
    
    MAX_LENGTH = 10000
    
    @classmethod
    def sanitize(cls, text: str, max_length: Optional[int] = None) -> str:
        """
        Sanitiza texto removendo padrões perigosos.
        
        Args:
            text: Texto a ser sanitizado
            max_length: Comprimento máximo (default: 10000)
        
        Returns:
            Texto sanitizado
        """
        if not text:
            return ""
        
        max_len = max_length or cls.MAX_LENGTH
        text = text[:max_len]
        
        for pattern in cls.DANGEROUS_PATTERNS:
            text = re.sub(pattern, "[REMOVIDO]", text, flags=re.IGNORECASE)
        
        text = cls._remove_control_chars(text)
        text = cls._normalize_whitespace(text)
        
        return text.strip()
    
    @staticmethod
    def _remove_control_chars(text: str) -> str:
        """Remove caracteres de controle perigosos"""
        return "".join(char for char in text if ord(char) >= 32 or char in "\n\r\t")
    
    @staticmethod
    def _normalize_whitespace(text: str) -> str:
        """Normaliza espaços em branco excessivos"""
        text = re.sub(r'\n{3,}', '\n\n', text)
        text = re.sub(r' {2,}', ' ', text)
        return text
    
    @classmethod
    def validate_safe(cls, text: str) -> bool:
        """
        Valida se o texto é seguro (não contém padrões perigosos).
        
        Returns:
            True se seguro, False caso contrário
        """
        if not text:
            return True
        
        for pattern in cls.DANGEROUS_PATTERNS:
            if re.search(pattern, text, flags=re.IGNORECASE):
                return False
        
        return True


def sanitize_for_ai(text: str, max_length: Optional[int] = None) -> str:
    """
    Função helper para sanitizar texto antes de enviar para IA.
    
    Usage:
        user_input = sanitize_for_ai(request.text)
        response = await ai_service.generate(user_input)
    """
    return PromptSanitizer.sanitize(text, max_length)
