import logging
import json
from datetime import datetime
from typing import Optional, Dict, Any
from contextvars import ContextVar
from pythonjsonlogger import jsonlogger

request_id_var: ContextVar[Optional[str]] = ContextVar('request_id', default=None)
user_id_var: ContextVar[Optional[str]] = ContextVar('user_id', default=None)


class AuditLogger:
    """
    Logger estruturado para auditoria de ações críticas.
    Gera logs JSON para compliance jurídico.
    """
    
    def __init__(self):
        self.logger = logging.getLogger('audit')
        self.logger.setLevel(logging.INFO)
        
        if not self.logger.handlers:
            handler = logging.StreamHandler()
            formatter = jsonlogger.JsonFormatter(
                '%(timestamp)s %(level)s %(name)s %(message)s %(request_id)s %(user_id)s'
            )
            handler.setFormatter(formatter)
            self.logger.addHandler(handler)
    
    def _build_log(
        self,
        action: str,
        resource_type: str,
        resource_id: str,
        details: Optional[Dict[str, Any]] = None,
        level: str = "INFO"
    ) -> Dict[str, Any]:
        """Constrói log estruturado"""
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "level": level,
            "action": action,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "user_id": user_id_var.get(),
            "request_id": request_id_var.get(),
            "details": details or {}
        }
    
    def log_view(self, resource_type: str, resource_id: str, details: Optional[Dict] = None):
        """Log de visualização de recurso"""
        log_data = self._build_log("VIEW", resource_type, resource_id, details)
        self.logger.info(json.dumps(log_data))
    
    def log_create(self, resource_type: str, resource_id: str, details: Optional[Dict] = None):
        """Log de criação de recurso"""
        log_data = self._build_log("CREATE", resource_type, resource_id, details)
        self.logger.info(json.dumps(log_data))
    
    def log_update(self, resource_type: str, resource_id: str, details: Optional[Dict] = None):
        """Log de atualização de recurso"""
        log_data = self._build_log("UPDATE", resource_type, resource_id, details)
        self.logger.info(json.dumps(log_data))
    
    def log_delete(self, resource_type: str, resource_id: str, details: Optional[Dict] = None):
        """Log de exclusão de recurso"""
        log_data = self._build_log("DELETE", resource_type, resource_id, details)
        self.logger.warning(json.dumps(log_data))
    
    def log_access_denied(self, resource_type: str, resource_id: str, reason: str):
        """Log de acesso negado"""
        log_data = self._build_log(
            "ACCESS_DENIED",
            resource_type,
            resource_id,
            {"reason": reason},
            "WARNING"
        )
        self.logger.warning(json.dumps(log_data))
    
    def log_export(self, resource_type: str, resource_id: str, format: str):
        """Log de exportação de dados"""
        log_data = self._build_log(
            "EXPORT",
            resource_type,
            resource_id,
            {"format": format}
        )
        self.logger.info(json.dumps(log_data))


audit_logger = AuditLogger()
