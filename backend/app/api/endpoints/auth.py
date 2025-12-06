from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

@router.post("/login", response_model=TokenResponse)
async def login(credentials: LoginRequest):
    """
    Login com Firebase Auth
    Nota: A autenticação real deve ser feita no frontend com Firebase SDK
    Este endpoint é apenas um placeholder para documentação
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Use Firebase Authentication no frontend. Envie o ID token do Firebase nas requisições."
    )

@router.post("/register")
async def register(credentials: LoginRequest):
    """
    Registro com Firebase Auth
    Nota: O registro deve ser feito no frontend com Firebase SDK
    Este endpoint é apenas um placeholder para documentação
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Use Firebase Authentication no frontend para criar conta."
    )

@router.get("/me")
async def get_current_user_info():
    """Informações do usuário atual"""
    return {"message": "Use o token Firebase para autenticação"}
