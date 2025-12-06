import api from './api'

export const clientService = {
  getAll: async (limit = 50, offset = 0) => {
    const { data } = await api.get('/clients', { params: { limit, offset } })
    return data
  },

  getById: async (id) => {
    const { data } = await api.get(`/clients/${id}`)
    return data
  },

  create: async (clientData) => {
    const { data } = await api.post('/clients', clientData)
    return data
  },

  update: async (id, clientData) => {
    const { data } = await api.put(`/clients/${id}`, clientData)
    return data
  },

  delete: async (id) => {
    await api.delete(`/clients/${id}`)
  },

  search: async (query) => {
    const { data } = await api.get('/clients/search', { params: { q: query } })
    return data
  },

  extractFromDocument: async (formData) => {
    const { data } = await api.post('/clients/extract-from-document', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return data
  },
}

export const caseService = {
  getAll: async (status = null, limit = 50, offset = 0) => {
    const { data } = await api.get('/cases', { 
      params: { status, limit, offset } 
    })
    return data
  },

  getById: async (id) => {
    const { data } = await api.get(`/cases/${id}`)
    return data
  },

  getByClient: async (clientId) => {
    const { data } = await api.get(`/cases/client/${clientId}`)
    return data
  },

  create: async (caseData) => {
    const { data } = await api.post('/cases', caseData)
    return data
  },

  update: async (id, caseData) => {
    const { data } = await api.put(`/cases/${id}`, caseData)
    return data
  },

  delete: async (id) => {
    await api.delete(`/cases/${id}`)
  },
}

export const documentService = {
  upload: async (file, caseId, description) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('case_id', caseId)
    if (description) formData.append('description', description)

    const { data } = await api.post('/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  getByCase: async (caseId) => {
    const { data } = await api.get(`/documents/case/${caseId}`)
    return data
  },

  getById: async (id) => {
    const { data } = await api.get(`/documents/${id}`)
    return data
  },

  delete: async (id) => {
    await api.delete(`/documents/${id}`)
  },
}
