import axios from 'axios'

// Clean single axios client used across the React app
// Normalize base URL so VITE_API_URL may be set with or without the trailing `/api`
const _rawBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const _base = _rawBase.endsWith('/api') ? _rawBase.replace(/\/+$/, '') : _rawBase.replace(/\/+$/, '') + '/api'
const api = axios.create({ baseURL: _base })

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (err) => Promise.reject(err)
)

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err && err.response && err.response.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (typeof window !== 'undefined') window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const postService = {
  getAllPosts: async (page = 1, limit = 10) => {
    const res = await api.get(`/posts?page=${page}&limit=${limit}`)
    // server returns { success: true, data: [...] }
    return { data: res.data?.data }
  },
  getMyPosts: async (page = 1, limit = 10) => {
    const res = await api.get(`/posts/mine?page=${page}&limit=${limit}`)
    return { data: res.data?.data }
  },
  getPost: async (id) => {
    const res = await api.get(`/posts/${id}`)
    return { data: res.data?.data }
  },
  updatePost: async (id, postData) => {
    const isForm = typeof FormData !== 'undefined' && postData instanceof FormData
    const config = isForm ? { headers: { 'Content-Type': 'multipart/form-data' } } : {}
    const res = await api.put(`/posts/${id}`, postData, config)
    return res.data
  },
  createPost: async (postData) => {
    const isForm = typeof FormData !== 'undefined' && postData instanceof FormData
    const config = isForm ? { headers: { 'Content-Type': 'multipart/form-data' } } : {}
    const res = await api.post('/posts', postData, config)
    // return full server payload (may include createdSlug and meta information)
    return res.data
  },
}

export const categoryService = {
  getAllCategories: async () => {
    const res = await api.get('/categories')
    return { data: res.data?.data }
  },
}

export const authService = {
  login: async (credentials) => {
    const res = await api.post('/auth/login', credentials)
    if (res && res.data && res.data.data && res.data.data.token) {
      localStorage.setItem('token', res.data.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.data.user))
    }
    return { data: res.data?.data }
  },
  register: async (userData) => {
    const res = await api.post('/auth/register', userData)
    if (res && res.data && res.data.data && res.data.data.token) {
      localStorage.setItem('token', res.data.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.data.user))
    }
    return { data: res.data?.data }
  },
}

export default api
