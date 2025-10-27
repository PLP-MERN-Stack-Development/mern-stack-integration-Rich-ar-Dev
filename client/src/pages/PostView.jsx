import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { postService } from '../services/apiClient'
import { formatRelative } from '../utils/time'

export default function PostView() {
  const { id } = useParams()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await postService.getPost(id)
        if (mounted) setPost(res.data)
      } catch (e) {
        console.error(e)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => (mounted = false)
  }, [id])

  if (loading) return <p>Loading...</p>
  if (!post) return <p>Post not found</p>

  const userRaw = typeof window !== 'undefined' ? localStorage.getItem('user') : null
  const currentUser = userRaw ? JSON.parse(userRaw) : null
  const currentUserId = currentUser && (currentUser._id || currentUser.id)
  const currentUserRole = currentUser && currentUser.role

  return (
    <article className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h1>{post.title}</h1>
        <div style={{ fontSize: 12, color: '#666' }}>{post.createdAt ? formatRelative(post.createdAt) : ''}</div>
      </div>
  <p style={{ color: '#666' }}>{post.excerpt}</p>
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
      <div style={{ marginTop: 12 }}>
        {((post.author && (post.author._id === currentUserId || post.author === currentUserId)) || currentUserRole === 'admin') && (
          <Link to={`/posts/${post._id}/edit`}>Edit post</Link>
        )}
      </div>
    </article>
  )
}
