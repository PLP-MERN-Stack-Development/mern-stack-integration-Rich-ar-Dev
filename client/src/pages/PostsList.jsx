import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { postService } from '../services/apiClient'
import { formatRelative } from '../utils/time'

export default function PostsList() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showMine, setShowMine] = useState(false)
  const userRaw = typeof window !== 'undefined' ? localStorage.getItem('user') : null
  const currentUser = userRaw ? JSON.parse(userRaw) : null
  const currentUserId = currentUser && (currentUser._id || currentUser.id)
  const currentUserRole = currentUser && currentUser.role

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = showMine ? await postService.getMyPosts() : await postService.getAllPosts()
        if (mounted) setPosts(res.data || [])
      } catch (e) {
        console.error(e)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => (mounted = false)
  }, [showMine])

  if (loading) return <p>Loading posts...</p>
  if (loading) return <p>Loading posts...</p>
  if (!posts.length)
    return (
      <p>
        No posts yet — {currentUser ? <Link to="/posts/new">create one</Link> : <Link to="/login">login to create one</Link>}.
      </p>
    )

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Posts</h2>
        <div>
          <button onClick={() => setShowMine(false)} style={{ marginRight: 8, padding: '6px 8px' }} disabled={!showMine}>All</button>
          <button
            onClick={() => {
              if (!currentUser) return window.location.href = '/login'
              setShowMine(true)
            }}
            style={{ padding: '6px 8px' }}
            disabled={showMine}
          >
            My Posts
          </button>
        </div>
      </div>
      <ul style={{ listStyle: 'none', padding: 0 }}>
  {posts.map((p) => (
          <li key={p._id} style={{ marginBottom: 12, borderBottom: '1px solid #eee', paddingBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Link to={`/posts/${p._id}`} style={{ fontSize: 18, fontWeight: 600 }}>
                {p.title}
              </Link>
              <div style={{ fontSize: 12, color: '#666' }}>
                {p.createdAt ? formatRelative(p.createdAt) : ''}
              </div>
            </div>
            <div style={{ fontSize: 12, color: '#666' }}>{p.excerpt || (p.content || '').slice(0, 120)}</div>
            <div style={{ marginTop: 6 }}>
              {((p.author && (p.author._id === currentUserId || p.author === currentUserId)) || currentUserRole === 'admin') && (
                <Link to={`/posts/${p._id}/edit`} style={{ marginRight: 12 }}>
                  Edit
                </Link>
              )}
              <Link to={`/posts/${p._id}`}>View</Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
