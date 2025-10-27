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
    if (err?.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      // avoid redirect during tests
      if (typeof window !== 'undefined') window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const postService = {
  getAllPosts: async (page = 1, limit = 10) => {
    const res = await api.get(`/posts?page=${page}&limit=${limit}`)
    return res.data
  },
  getPost: async (id) => {
    const res = await api.get(`/posts/${id}`)
    return res.data
  },
  createPost: async (postData) => {
    const isForm = typeof FormData !== 'undefined' && postData instanceof FormData
    const config = isForm ? { headers: { 'Content-Type': 'multipart/form-data' } } : {}
    const res = await api.post('/posts', postData, config)
    return res.data
  },
}

export const categoryService = {
  getAllCategories: async () => {
    const res = await api.get('/categories')
    return res.data
  },
  // Add other category methods as needed
  getCategory: async (id) => {
    const res = await api.get(`/categories/${id}`)
    return res.data
  },
  createCategory: async (categoryData) => {
    const res = await api.post('/categories', categoryData)
    return res.data
  },
}

// Export the axios instance as default and named export
export { api as default }
export { api }