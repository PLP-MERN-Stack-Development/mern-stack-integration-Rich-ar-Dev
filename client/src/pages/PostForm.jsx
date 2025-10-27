import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { postService, categoryService } from '../services/apiClient'
import './PostForm.css'

export default function PostForm({ onCreated }) {
  const { id: editingId } = useParams()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('')
  const [categories, setCategories] = useState([])
  const [imageFile, setImageFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const [success, setSuccess] = useState(null)
  const [isEditMode, setIsEditMode] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await categoryService.getAllCategories()
        // DEBUG: print a compact, readable snapshot so we can see the exact shape
        // eslint-disable-next-line no-console
        console.log('categoryService.getAllCategories ->', res)
        // Try several common shapes: { data: [...] }, { data: { data: [...] } }, or raw [...]
        const maybeCategories = (res && (res.data || res.data?.data || res)) || []
        if (mounted) setCategories(Array.isArray(maybeCategories) ? maybeCategories : [])
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed to load categories', e)
      }
    })()
    return () => (mounted = false)
  }, [])

  // If editing, load the post data
  useEffect(() => {
    if (!editingId) return
    let mounted = true
    ;(async () => {
      try {
        const res = await postService.getPost(editingId)
        const p = res && res.data
        if (!p) return
        if (mounted) {
          setTitle(p.title || '')
          setContent(p.content || '')
          setCategory(p.category?._id || p.category || '')
          setIsEditMode(true)
        }
      } catch (e) {
        console.error('Failed to load post for editing', e)
      }
    })()
    return () => (mounted = false)
  }, [editingId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const form = new FormData()
      form.append('title', title)
      form.append('content', content)
      form.append('category', category)
      if (imageFile) form.append('image', imageFile)
      const result = isEditMode && editingId ? await postService.updatePost(editingId, form) : await postService.createPost(form)
      setLoading(false)
      // server returns { success: true, data: post, createdSlug }
      const createdPost = result && (result.data || result)
      const createdSlug = result && (result.createdSlug || (createdPost && createdPost.slug))
      if (onCreated) onCreated(createdPost)
      // Show a small success message with a link to the created post
      setSuccess({ slug: createdSlug, id: createdPost && createdPost._id, title: createdPost && createdPost.title })
      // If we updated, navigate to the post view
      if (isEditMode && createdPost && (createdPost._id || createdSlug)) {
        navigate(createdSlug ? `/posts/${createdSlug}` : `/posts/${createdPost._id}`)
      }
    } catch (err) {
      setLoading(false)
      // log the full error response for easier debugging
      // eslint-disable-next-line no-console
      console.error('createPost error', err.response?.data || err)
      const serverMessage = err.response?.data?.error || err.response?.data || err.message
      setError(typeof serverMessage === 'string' ? serverMessage : JSON.stringify(serverMessage))
    }
  }

  return (
    <div className="post-form-container">
      <div className="post-form-card">
  <h2>{isEditMode ? 'Edit Post' : 'Create Post'}</h2>
        {success && (
          <div className="success">
            <strong>Post created!</strong>
            {success.title && <span> "{success.title}"</span>}
            <div>
              <a href={success.slug ? `/posts/${success.slug}` : success.id ? `/posts/${success.id}` : '/'}>
                View post
              </a>
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div>
            <label>Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div>
            <label>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} required>
              <option value="">Select</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Content</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} required />
          </div>
          <div>
            <label>Featured Image</label>
            <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} />
          </div>
          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={loading}>{loading ? (isEditMode ? 'Updating...' : 'Posting...') : (isEditMode ? 'Update Post' : 'Create Post')}</button>
        </form>
      </div>
    </div>
  )
}
