import { useState, useRef, useCallback } from 'react'
import { Upload, FileText, Loader, CheckCircle, AlertCircle } from 'lucide-react'
import api from '@/services/api'
import Modal from './common/Modal'
import { useToast } from './common/Toast'

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export default function AIDocumentUpload({ onDataExtracted, onClose }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)
  const { showToast } = useToast()

  const validateFile = useCallback((selectedFile) => {
    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setError('Tipo de arquivo não suportado. Use PNG, JPG ou PDF.')
      return false
    }
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError('Arquivo muito grande. Máximo: 10MB')
      return false
    }
    return true
  }, [])

  const processFile = useCallback((selectedFile) => {
    if (!validateFile(selectedFile)) return

    setFile(selectedFile)
    setError(null)
    setResult(null)

    // Preview para imagens
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => setPreview(reader.result)
      reader.readAsDataURL(selectedFile)
    } else {
      setPreview(null)
    }
  }, [validateFile])

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) processFile(selectedFile)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) processFile(droppedFile)
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const { data } = await api.post('/clients/extract-from-document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000, // 60s para upload/processamento
      })

      setResult(data)

      // Se confiança >= 60%, notifica e pode auto-preencher
      if (data.confidence_score >= 0.6) {
        showToast('Dados extraídos com alta confiança!', 'success')
        setTimeout(() => {
          onDataExtracted(data.extracted_data)
        }, 1500)
      }
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Erro ao processar documento'
      setError(errorMsg)
      showToast(errorMsg, 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleUseData = () => {
    if (result?.extracted_data) {
      onDataExtracted(result.extracted_data)
      showToast('Dados aplicados ao formulário', 'success')
    }
  }

  const resetState = () => {
    setFile(null)
    setPreview(null)
    setResult(null)
    setError(null)
  }

  const getConfidenceColor = (score) => {
    if (score >= 0.8) return 'text-green-600 bg-green-50'
    if (score >= 0.5) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const getConfidenceLabel = (score) => {
    if (score >= 0.8) return 'Alta Confiança'
    if (score >= 0.5) return 'Média Confiança'
    return 'Baixa Confiança'
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <Upload size={24} className="text-primary-600" />
          Extração Inteligente de Dados
        </span>
      }
      size="lg"
    >
      <p className="text-sm text-gray-600 mb-6">
        Upload de documento (PNG, JPG, PDF) para preenchimento automático
      </p>

      {/* Upload Area */}
      {!file && (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
            isDragging 
              ? 'border-primary-500 bg-primary-50' 
              : 'border-gray-300 hover:border-primary-500'
          }`}
        >
          <Upload size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-lg font-medium mb-2">
            Clique para selecionar ou arraste um arquivo
          </p>
          <p className="text-sm text-gray-500">
            Formatos: PNG, JPG, JPEG, PDF (máx. 10MB)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.pdf"
            onChange={handleFileSelect}
            className="hidden"
            aria-label="Selecionar arquivo"
          />
        </div>
      )}

      {/* File Preview */}
      {file && !result && (
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <div className="flex items-start gap-4">
              {preview ? (
                <img src={preview} alt="Preview" className="w-32 h-32 object-cover rounded" />
              ) : (
                <div className="w-32 h-32 bg-gray-100 rounded flex items-center justify-center">
                  <FileText size={48} className="text-gray-400" />
                </div>
              )}
              
              <div className="flex-1">
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="btn btn-primary flex items-center gap-2"
                    aria-label={uploading ? 'Processando documento' : 'Extrair dados com IA'}
                  >
                    {uploading ? (
                      <>
                        <Loader size={18} className="animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <Upload size={18} />
                        Extrair Dados com IA
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={resetState}
                    className="btn btn-secondary"
                    disabled={uploading}
                  >
                    Trocar Arquivo
                  </button>
                </div>
              </div>
            </div>
          </div>

          {uploading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Loader size={20} className="animate-spin text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">Processando documento...</p>
                  <p className="text-sm text-blue-700">
                    A IA está analisando o documento e extraindo informações
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3" role="alert">
          <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">Erro ao processar</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Confidence Score */}
          <div className={`rounded-lg p-4 ${getConfidenceColor(result.confidence_score)}`}>
            <div className="flex items-center gap-3">
              <CheckCircle size={24} />
              <div className="flex-1">
                <p className="font-bold text-lg">
                  {getConfidenceLabel(result.confidence_score)}
                </p>
                <p className="text-sm">
                  Score: {(result.confidence_score * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          </div>

          {/* Extracted Data */}
          <div className="border rounded-lg p-4">
            <h3 className="font-bold mb-3">Dados Extraídos:</h3>
            <div className="space-y-2 text-sm">
              {Object.entries(result.extracted_data).map(([key, value]) => {
                if (!value || key === 'notes') return null
                const labels = {
                  name: 'Nome',
                  email: 'Email',
                  phone: 'Telefone',
                  cpf_cnpj: 'CPF/CNPJ',
                  client_type: 'Tipo',
                  address: 'Endereço',
                }
                return (
                  <div key={key} className="flex gap-2">
                    <span className="font-medium text-gray-600 w-24">
                      {labels[key] || key}:
                    </span>
                    <span className="text-gray-900">{value}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Message */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              {result.message || 'Revise os dados extraídos e confirme antes de salvar.'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button onClick={onClose} className="btn btn-secondary">
              Cancelar
            </button>
            <button
              onClick={resetState}
              className="btn btn-secondary"
            >
              Processar Outro
            </button>
            <button onClick={handleUseData} className="btn btn-primary">
              Usar Estes Dados
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
