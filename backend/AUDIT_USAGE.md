# Audit Logger & Prompt Sanitizer - Guia de Uso

## Audit Logger

### Uso Básico

```python
from app.core.audit_logger import audit_logger

# Log de visualização
audit_logger.log_view("case", case_id, {"client_id": client_id})

# Log de criação
audit_logger.log_create("document", doc_id, {"type": "contract"})

# Log de atualização
audit_logger.log_update("client", client_id, {"fields": ["email", "phone"]})

# Log de exclusão
audit_logger.log_delete("case", case_id, {"reason": "client_request"})

# Log de acesso negado
audit_logger.log_access_denied("case", case_id, "insufficient_permissions")

# Log de exportação
audit_logger.log_export("cases", "all", "pdf")
```

### Exemplo em Endpoint

```python
from fastapi import APIRouter, Depends
from app.core.audit_logger import audit_logger
from app.api.dependencies import get_current_user

router = APIRouter()

@router.get("/cases/{case_id}")
async def get_case(
    case_id: str,
    current_user: dict = Depends(get_current_user)
):
    # Buscar caso
    case = await case_service.get(case_id)
    
    # Log de auditoria
    audit_logger.log_view("case", case_id, {
        "client_id": case.client_id,
        "status": case.status
    })
    
    return case
```

## Prompt Sanitizer

### Uso Básico

```python
from app.core.prompt_sanitizer import sanitize_for_ai, PromptSanitizer

# Sanitizar texto simples
user_input = "Analise este contrato: [texto do usuário]"
safe_input = sanitize_for_ai(user_input)

# Sanitizar com limite de tamanho
safe_input = sanitize_for_ai(user_input, max_length=5000)

# Validar se é seguro (sem sanitizar)
is_safe = PromptSanitizer.validate_safe(user_input)
if not is_safe:
    raise ValueError("Input contém padrões perigosos")
```

### Exemplo em Serviço de IA

```python
from app.core.prompt_sanitizer import sanitize_for_ai

class AIService:
    async def analyze_document(self, text: str) -> dict:
        # Sanitizar input antes de enviar para IA
        safe_text = sanitize_for_ai(text, max_length=10000)
        
        prompt = f"""
        Analise o seguinte documento jurídico:
        
        {safe_text}
        
        Forneça um resumo e identifique cláusulas importantes.
        """
        
        response = await self.llm.generate(prompt)
        return response
```

### Padrões Bloqueados

O sanitizador remove automaticamente:
- `ignore previous instructions`
- `disregard all above`
- `forget previous`
- `system:`
- `<|im_start|>`, `<|im_end|>`
- `[INST]`, `[/INST]`
- `### Instruction`, `### System`
- `You are now`, `Act as a`, `Pretend to be`

## Logs Estruturados

Os logs são gerados em formato JSON:

```json
{
  "timestamp": "2024-12-06T10:30:00.000Z",
  "level": "INFO",
  "action": "VIEW",
  "resource_type": "case",
  "resource_id": "case-123",
  "user_id": "user-456",
  "request_id": "req-789",
  "details": {
    "client_id": "client-abc",
    "status": "active"
  }
}
```

## Compliance Jurídico

Estes logs atendem requisitos de:
- LGPD (Lei Geral de Proteção de Dados)
- Auditoria de acesso a dados sensíveis
- Rastreabilidade de ações
- Investigação de incidentes
