import React from 'react'
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom'
import Nav from './components/Nav'
import PostsList from './pages/PostsList'
import PostView from './pages/PostView'
import PostForm from './pages/PostForm'
import Login from './pages/Login'
import Register from './pages/Register'
import './App.css'

function RootLayout() {
  return (
    <>
      <Nav />
      <main style={{ padding: '1rem' }}>
        <Outlet />
      </main>
    </>
  )
}

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <RootLayout />,
      children: [
        { index: true, element: <PostsList /> },
        { path: 'login', element: <Login /> },
        { path: 'register', element: <Register /> },
        { path: 'posts/new', element: <PostForm onCreated={() => (window.location.href = '/')} /> },
        { path: 'posts/:id/edit', element: <PostForm /> },
        { path: 'posts/:id', element: <PostView /> },
      ],
    },
  ],
  {
    // Opt-in to v7 behaviors to silence the future-flag warnings
    future: { v7_startTransition: true, v7_relativeSplatPath: true },
  }
)

export default function App() {
  return <RouterProvider router={router} />
}
