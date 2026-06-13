import axios from 'axios'

const base = window.location.pathname.startsWith('/issues') ? '/issues/api' : '/api'
const api = axios.create({ baseURL: base })

export const getIssues  = (params) => api.get('/issues', { params })
export const getIssue   = (id) => api.get(`/issues/${id}`)
export const createIssue= (data) => api.post('/issues', data)
export const updateIssue= (id, data) => api.put(`/issues/${id}`, data)
export const deleteIssue= (id) => api.delete(`/issues/${id}`)

export const uploadAttachment = (issueId, file) => {
  const fd = new FormData()
  fd.append('file', file)
  return api.post(`/issues/${issueId}/attachments`, fd)
}
export const deleteAttachment = (id) => api.delete(`/attachments/${id}`)
export const viewAttachment   = (id) => `${base}/attachments/${id}/view`
export const downloadAttachment=(id) => `${base}/attachments/${id}/download`

export const getProjects = () => api.get('/projects')
export const getStats    = () => api.get('/stats')
