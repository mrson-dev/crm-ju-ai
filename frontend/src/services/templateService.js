import api from './api'

export const templateService = {
  // Templates
  getAll: async (category = null, includePublic = true) => {
    const { data } = await api.get('/templates', {
      params: { category, include_public: includePublic }
    })
    return data
  },

  getById: async (id) => {
    const { data } = await api.get(`/templates/${id}`)
    return data
  },

  create: async (templateData) => {
    const { data } = await api.post('/templates', templateData)
    return data
  },

  update: async (id, templateData) => {
    const { data } = await api.put(`/templates/${id}`, templateData)
    return data
  },

  delete: async (id) => {
    await api.delete(`/templates/${id}`)
  },

  getPlaceholders: async () => {
    const { data } = await api.get('/templates/placeholders')
    return data
  },

  // Generate Document
  generateDocument: async (templateId, placeholdersData, clientId = null, caseId = null) => {
    const { data } = await api.post(`/templates/${templateId}/generate`, {
      placeholders_data: placeholdersData,
      client_id: clientId,
      case_id: caseId
    })
    return data
  },

  // Generated Documents
  getGeneratedDocuments: async (clientId = null, caseId = null) => {
    const { data } = await api.get('/templates/documents/generated', {
      params: { client_id: clientId, case_id: caseId }
    })
    return data
  },

  getGeneratedDocumentById: async (id) => {
    const { data } = await api.get(`/templates/documents/generated/${id}`)
    return data
  },

  deleteGeneratedDocument: async (id) => {
    await api.delete(`/templates/documents/generated/${id}`)
  },
}
