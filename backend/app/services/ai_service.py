from typing import Dict, Optional, List
from google.cloud import vision
import re
from datetime import datetime
from app.core.config import settings
from app.models.schemas import ClientType
import asyncio
from functools import partial

class AIService:
    """Serviço de IA para extração automática de dados de documentos"""
    
    def __init__(self):
        self.vision_client = vision.ImageAnnotatorClient()
    
    async def extract_client_data_from_document(self, file_content: bytes, file_type: str) -> Dict:
        """
        Extrai dados de cliente de imagem ou PDF usando Cloud Vision API
        
        Args:
            file_content: Conteúdo binário do arquivo
            file_type: Tipo MIME do arquivo
            
        Returns:
            Dict com dados extraídos do cliente
        """
        # Validação de conteúdo vazio
        if not file_content or len(file_content) == 0:
            raise ValueError("Arquivo vazio")
        
        # Extrai texto do documento (executa de forma síncrona em thread separada)
        text = await self._extract_text(file_content, file_type)
        
        # Processa e extrai informações estruturadas
        extracted_data = self._parse_client_data(text)
        
        return extracted_data
    
    async def _extract_text(self, file_content: bytes, file_type: str) -> str:
        """Extrai texto de imagem ou PDF usando Cloud Vision OCR"""
        
        try:
            # Executa chamada síncrona da API em thread separada com timeout
            loop = asyncio.get_event_loop()
            text = await asyncio.wait_for(
                loop.run_in_executor(
                    None,
                    partial(self._extract_text_sync, file_content, file_type)
                ),
                timeout=30.0  # Timeout de 30 segundos
            )
            return text
            
        except asyncio.TimeoutError:
            raise Exception("Timeout ao processar documento. Tente novamente com uma imagem menor ou de melhor qualidade.")
        except Exception as e:
            # Captura erros específicos da API do Google
            error_msg = str(e)
            
            if "PERMISSION_DENIED" in error_msg:
                raise Exception("Credenciais do Google Cloud inválidas ou sem permissão")
            elif "INVALID_ARGUMENT" in error_msg:
                raise Exception("Formato de arquivo inválido ou corrompido")
            elif "QUOTA_EXCEEDED" in error_msg:
                raise Exception("Limite de uso da API Google Vision excedido")
            elif "UNAVAILABLE" in error_msg:
                raise Exception("Serviço Google Vision temporariamente indisponível")
            else:
                raise Exception(f"Erro ao processar imagem: {error_msg}")
    
    def _extract_text_sync(self, file_content: bytes, file_type: str) -> str:
        """Execução síncrona da extração de texto"""
        image = vision.Image(content=file_content)
        
        # Usa document_text_detection para melhor OCR de documentos
        response = self.vision_client.document_text_detection(image=image)
        
        if response.error.message:
            raise Exception(f"Erro na API Vision: {response.error.message}")
        
        # Verifica se há texto extraído
        if not response.full_text_annotation or not response.full_text_annotation.text:
            raise Exception("Nenhum texto foi detectado no documento. Verifique a qualidade da imagem.")
        
        # Extrai texto completo
        return response.full_text_annotation.text.strip()
    
    def _parse_client_data(self, text: str) -> Dict:
        """
        Analisa texto extraído e identifica dados do cliente
        Usa regex e heurísticas para extrair informações
        """
        data = {
            "name": None,
            "email": None,
            "phone": None,
            "cpf_cnpj": None,
            "client_type": None,
            "address": None,
            "notes": f"Dados extraídos automaticamente via IA em {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}"
        }
        
        # Extrai Nome
        name = self._extract_name(text)
        if name:
            data["name"] = name
        
        # Extrai Email
        email = self._extract_email(text)
        if email:
            data["email"] = email
        
        # Extrai Telefone
        phone = self._extract_phone(text)
        if phone:
            data["phone"] = phone
        
        # Extrai CPF/CNPJ
        cpf_cnpj = self._extract_cpf_cnpj(text)
        if cpf_cnpj:
            data["cpf_cnpj"] = cpf_cnpj
            # Determina tipo de cliente baseado no documento
            data["client_type"] = ClientType.PESSOA_JURIDICA if len(cpf_cnpj.replace(".", "").replace("-", "").replace("/", "")) == 14 else ClientType.PESSOA_FISICA
        
        # Extrai Endereço
        address = self._extract_address(text)
        if address:
            data["address"] = address
        
        return data
    
    def _extract_name(self, text: str) -> Optional[str]:
        """Extrai nome do texto"""
        # Procura por padrões comuns (suporta acentuação completa)
        patterns = [
            r"(?:Nome|NOME|Name|NOME COMPLETO)[\s:]+([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑa-záàâãéèêíïóôõöúçñ\s]{3,100}?)(?:\n|$|\s{2,})",
            r"(?:Razão Social|RAZÃO SOCIAL|Razao Social)[\s:]+([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑa-záàâãéèêíïóôõöúçñ\s&\.]{3,100}?)(?:\n|$)",
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                name = match.group(1).strip()
                # Valida que tem pelo menos 2 palavras
                if len(name.split()) >= 2:
                    return name
        
        # Fallback: busca sequência de 2+ palavras capitalizadas (evita headers)
        lines = text.split('\n')
        for i, line in enumerate(lines[:15]):  # Verifica primeiras 15 linhas
            line_clean = line.strip()
            # Ignora linhas muito curtas, muito longas, ou com muitos números
            if not (5 <= len(line_clean) <= 100) or line_clean.count(' ') < 1:
                continue
            
            # Conta quantos dígitos tem na linha
            digit_count = sum(c.isdigit() for c in line_clean)
            if digit_count > len(line_clean) * 0.3:  # Mais de 30% dígitos, provavelmente não é nome
                continue
            
            words = line_clean.split()
            # Verifica se tem 2+ palavras, maioria começa com maiúscula
            uppercase_words = sum(1 for w in words if w and w[0].isupper())
            if len(words) >= 2 and uppercase_words >= len(words) * 0.6:
                return line_clean
        
        return None
    
    def _extract_email(self, text: str) -> Optional[str]:
        """Extrai email do texto"""
        pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        match = re.search(pattern, text)
        return match.group(0) if match else None
    
    def _extract_phone(self, text: str) -> Optional[str]:
        """Extrai telefone do texto com validação de DDD válido"""
        # DDDs válidos do Brasil
        valid_ddds = {'11','12','13','14','15','16','17','18','19','21','22','24','27','28',
                      '31','32','33','34','35','37','38','41','42','43','44','45','46','47',
                      '48','49','51','53','54','55','61','62','63','64','65','66','67','68',
                      '69','71','73','74','75','77','79','81','82','83','84','85','86','87',
                      '88','89','91','92','93','94','95','96','97','98','99'}
        
        patterns = [
            r'\+?55\s*\(?([0-9]{2})\)?\s*([9][0-9]{4}[-\s]?[0-9]{4})',  # +55 (11) 98765-4321
            r'\(?([0-9]{2})\)?\s*([9][0-9]{4}[-\s]?[0-9]{4})',  # (11) 98765-4321
            r'\(?([0-9]{2})\)?\s*([2-5][0-9]{3}[-\s]?[0-9]{4})',  # (11) 3456-7890 fixo
        ]
        
        for pattern in patterns:
            for match in re.finditer(pattern, text):
                ddd = match.group(1)
                # Valida DDD
                if ddd not in valid_ddds:
                    continue
                    
                phone = match.group(0)
                digits = re.sub(r'\D', '', phone)
                
                # Remove +55 se presente
                if digits.startswith('55') and len(digits) > 11:
                    digits = digits[2:]
                
                # Formata telefone
                if len(digits) == 11:  # Celular
                    return f"({digits[:2]}) {digits[2:7]}-{digits[7:]}"
                elif len(digits) == 10:  # Fixo
                    return f"({digits[:2]}) {digits[2:6]}-{digits[6:]}"
        
        return None
    
    def _extract_cpf_cnpj(self, text: str) -> Optional[str]:
        """Extrai CPF ou CNPJ do texto com validação de dígitos verificadores"""
        # CNPJ: 12.345.678/9012-34
        cnpj_pattern = r'\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}'
        for match in re.finditer(cnpj_pattern, text):
            cnpj = match.group(0)
            digits = re.sub(r'\D', '', cnpj)
            if len(digits) == 14 and self._validate_cnpj(digits):
                return f"{digits[:2]}.{digits[2:5]}.{digits[5:8]}/{digits[8:12]}-{digits[12:]}"
        
        # CPF: 123.456.789-01
        cpf_pattern = r'\d{3}\.?\d{3}\.?\d{3}-?\d{2}'
        for match in re.finditer(cpf_pattern, text):
            cpf = match.group(0)
            digits = re.sub(r'\D', '', cpf)
            if len(digits) == 11 and self._validate_cpf(digits):
                return f"{digits[:3]}.{digits[3:6]}.{digits[6:9]}-{digits[9:]}"
        
        return None
    
    def _validate_cpf(self, cpf: str) -> bool:
        """Valida CPF usando dígitos verificadores"""
        if len(cpf) != 11 or cpf == cpf[0] * 11:
            return False
        
        # Calcula primeiro dígito
        soma = sum(int(cpf[i]) * (10 - i) for i in range(9))
        digito1 = 11 - (soma % 11)
        if digito1 >= 10:
            digito1 = 0
        
        # Calcula segundo dígito
        soma = sum(int(cpf[i]) * (11 - i) for i in range(10))
        digito2 = 11 - (soma % 11)
        if digito2 >= 10:
            digito2 = 0
        
        return int(cpf[9]) == digito1 and int(cpf[10]) == digito2
    
    def _validate_cnpj(self, cnpj: str) -> bool:
        """Valida CNPJ usando dígitos verificadores"""
        if len(cnpj) != 14 or cnpj == cnpj[0] * 14:
            return False
        
        # Calcula primeiro dígito
        peso = [5,4,3,2,9,8,7,6,5,4,3,2]
        soma = sum(int(cnpj[i]) * peso[i] for i in range(12))
        digito1 = 11 - (soma % 11)
        if digito1 >= 10:
            digito1 = 0
        
        # Calcula segundo dígito
        peso = [6,5,4,3,2,9,8,7,6,5,4,3,2]
        soma = sum(int(cnpj[i]) * peso[i] for i in range(13))
        digito2 = 11 - (soma % 11)
        if digito2 >= 10:
            digito2 = 0
        
        return int(cnpj[12]) == digito1 and int(cnpj[13]) == digito2
    
    def _extract_address(self, text: str) -> Optional[str]:
        """Extrai endereço do texto"""
        patterns = [
            r"(?:Endereço|ENDEREÇO|Endereco|Address)[\s:]*([^\n]{10,200})",
            r"(?:Rua|Av\.|Avenida|Travessa|Praça)[\s]+[^\n]{10,150}",
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                address = match.group(1) if match.lastindex else match.group(0)
                # Limpa endereço
                address = address.strip()
                if 10 <= len(address) <= 200:
                    return address
        
        return None
    
    def get_confidence_score(self, extracted_data: Dict) -> int:
        """
        Calcula score de confiança baseado na quantidade de dados extraídos
        
        Returns:
            Int entre 0 e 100 (percentual)
        """
        fields = ["name", "email", "phone", "cpf_cnpj", "address"]
        
        # Peso maior para campos obrigatórios
        weights = {
            "name": 30,      # 30%
            "email": 25,     # 25%
            "phone": 20,     # 20%
            "cpf_cnpj": 20,  # 20%
            "address": 5     # 5%
        }
        
        score = sum(weights[field] for field in fields if extracted_data.get(field))
        
        return int(score)  # Retorna percentual 0-100

ai_service = AIService()
