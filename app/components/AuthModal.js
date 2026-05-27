'use client'

import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { X, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AuthModal({ onClose }) {
  const { login, register } = useAuth()
  const [mode, setMode] = useState('login')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async () => {
    if (!form.email || !form.password) return toast.error('Completa todos los campos')
    if (mode === 'register' && !form.name) return toast.error('Escribe tu nombre')
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(form.email, form.password)
        toast.success('¡Bienvenido de vuelta!')
      } else {
        await register(form.email, form.password, form.name)
        toast.success('¡Cuenta creada exitosamente!')
      }
      onClose()
    } catch (err) {
      const messages = {
        'auth/user-not-found': 'No existe una cuenta con ese correo',
        'auth/wrong-password': 'Contraseña incorrecta',
        'auth/email-already-in-use': 'Ese correo ya está registrado',
        'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
        'auth/invalid-email': 'Correo inválido',
      }
      toast.error(messages[err.code] || 'Ocurrió un error, intenta de nuevo')
    }
    setLoading(false)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
    }} onClick={onClose}>
      <div style={{
        background: '#111118',
        border: '0.5px solid var(--border)',
        borderRadius: '16px',
        padding: '2.5rem',
        width: '100%',
        maxWidth: '420px',
        position: 'relative',
      }} onClick={e => e.stopPropagation()}>

        {/* Cerrar */}
        <button onClick={onClose} style={{
          position: 'absolute', top: '1.25rem', right: '1.25rem',
          background: 'transparent', border: 'none',
          color: 'var(--text-muted)', padding: '0.25rem',
        }}>
          <X size={18} />
        </button>

        {/* Logo */}
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.8rem',
          textAlign: 'center',
          marginBottom: '0.5rem',
        }}>
          Staff<span style={{ color: 'var(--gold)' }}>ly</span>
        </div>

        {/* Título */}
        <p style={{
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.875rem',
          marginBottom: '2rem',
        }}>
          {mode === 'login' ? 'Inicia sesión en tu cuenta' : 'Crea tu cuenta gratis'}
        </p>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.25rem',
          marginBottom: '1.5rem',
        }}>
          {['login', 'register'].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, padding: '0.5rem',
              background: mode === m ? 'var(--gold)' : 'transparent',
              color: mode === m ? '#0a0a0f' : 'var(--text-muted)',
              border: 'none', borderRadius: '6px',
              fontSize: '0.85rem', fontWeight: mode === m ? '500' : '400',
              transition: 'all 0.2s',
            }}>
              {m === 'login' ? 'Iniciar sesión' : 'Registrarse'}
            </button>
          ))}
        </div>

        {/* Campos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {mode === 'register' && (
            <input
              name="name" placeholder="Tu nombre completo"
              value={form.name} onChange={handleChange}
              style={{
                padding: '0.75rem 1rem',
                background: 'rgba(255,255,255,0.04)',
                border: '0.5px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.875rem', color: 'var(--text)',
                outline: 'none',
              }}
            />
          )}
          <input
            name="email" type="email" placeholder="Correo electrónico"
            value={form.email} onChange={handleChange}
            style={{
              padding: '0.75rem 1rem',
              background: 'rgba(255,255,255,0.04)',
              border: '0.5px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.875rem', color: 'var(--text)',
              outline: 'none',
            }}
          />
          <div style={{ position: 'relative' }}>
            <input
              name="password" type={showPass ? 'text' : 'password'}
              placeholder="Contraseña"
              value={form.password} onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.75rem 2.5rem 0.75rem 1rem',
                background: 'rgba(255,255,255,0.04)',
                border: '0.5px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.875rem', color: 'var(--text)',
                outline: 'none',
              }}
            />
            <button onClick={() => setShowPass(!showPass)} style={{
              position: 'absolute', right: '0.75rem', top: '50%',
              transform: 'translateY(-50%)',
              background: 'transparent', border: 'none',
              color: 'var(--text-muted)', padding: '0.25rem',
            }}>
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {/* Botón */}
        <button onClick={handleSubmit} disabled={loading} style={{
          width: '100%', marginTop: '1.5rem',
          padding: '0.875rem',
          background: 'var(--gold)',
          border: 'none', borderRadius: 'var(--radius-pill)',
          color: '#0a0a0f', fontSize: '0.9rem', fontWeight: '500',
          opacity: loading ? 0.7 : 1,
          transition: 'opacity 0.2s',
        }}>
          {loading ? 'Cargando...' : mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
        </button>
      </div>
    </div>
  )
}