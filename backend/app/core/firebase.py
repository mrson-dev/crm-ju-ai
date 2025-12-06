import firebase_admin
from firebase_admin import credentials, storage
from app.core.config import settings
import os

class FirebaseService:
    """
    Firebase Service apenas para Storage e Auth.
    Banco de dados migrado para Cloud SQL PostgreSQL.
    """
    _instance = None
    _initialized = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if not self._initialized:
            self._init_firebase()
            self._initialized = True
    
    def _init_firebase(self):
        """Inicializa Firebase Admin SDK apenas para Storage"""
        try:
            # Verifica se já existe uma app inicializada
            firebase_admin.get_app()
        except ValueError:
            # Usa credenciais padrão do GCP em produção
            if os.getenv("ENVIRONMENT") == "production":
                cred = credentials.ApplicationDefault()
            else:
                # Em dev, usa service account se disponível
                cred = credentials.ApplicationDefault()
            
            firebase_admin.initialize_app(cred, {
                'projectId': settings.GCP_PROJECT_ID,
                'storageBucket': settings.GCS_BUCKET_NAME
            })
    
    @property
    def bucket(self):
        """Retorna bucket do Cloud Storage"""
        return storage.bucket()

# Singleton instance
firebase_service = FirebaseService()

# Exporta bucket para compatibilidade
bucket = firebase_service.bucket
