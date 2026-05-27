'use client'

import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Search, ShoppingCart, LogOut, Shield, User } from 'lucide-react'

export default function Navbar({ onSearch, cartCount, onCartClick, onLoginClick, onAdminClick, onProfileClick, extraRight }) {
  const { user, isAdmin, logout } = useAuth()
  const [searchValue, setSearchValue] = useState('')

  const handleSearch = (e) => {
    setSearchValue(e.target.value)
    onSearch?.(e.target.value)
  }

  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '1.25rem 2.5rem',
      borderBottom: '0.5px solid var(--border)',
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(12px)',
      gap: '1.5rem',
    }}>
      {/* Logo */}
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', letterSpacing: '-0.02em', flexShrink: 0 }}>
        Staff<span style={{ color: 'var(--gold)' }}>ly</span>
      </div>

      {/* Búsqueda */}
      <div style={{ flex: 1, maxWidth: '480px', position: 'relative' }}>
        <Search size={15} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
        <input
          type="text" placeholder="Buscar por nombre, compositor, #etiqueta..."
          value={searchValue} onChange={handleSearch}
          style={{
            width: '100%', padding: '0.6rem 1rem 0.6rem 2.5rem',
            background: 'rgba(255,255,255,0.04)', border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius-pill)', fontSize: '0.85rem', color: 'var(--text)', outline: 'none',
          }}
          onFocus={e => e.target.style.borderColor = 'rgba(201,168,76,0.4)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
      </div>

      {/* Acciones */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>

        {/* Selector de moneda */}
        {extraRight}

        {/* Carrito */}
        <button onClick={onCartClick} style={{
          position: 'relative', background: 'rgba(255,255,255,0.04)',
          border: '0.5px solid var(--border)', borderRadius: '50%',
          width: '38px', height: '38px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text)', cursor: 'pointer', transition: 'all 0.2s',
        }}>
          <ShoppingCart size={16} />
          {cartCount > 0 && (
            <span style={{
              position: 'absolute', top: '-4px', right: '-4px',
              background: 'var(--gold)', color: '#0a0a0f',
              fontSize: '0.6rem', fontWeight: '600',
              width: '16px', height: '16px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{cartCount}</span>
          )}
        </button>

        {/* Admin */}
        {isAdmin && (
          <button onClick={onAdminClick} style={{
            background: 'rgba(201,168,76,0.1)', border: '0.5px solid rgba(201,168,76,0.3)',
            borderRadius: 'var(--radius-pill)', padding: '0.4rem 1rem',
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            color: 'var(--gold)', fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s',
          }}>
            <Shield size={14} /> Admin
          </button>
        )}

        {/* Usuario / Login */}
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button onClick={onProfileClick} style={{
              width: '34px', height: '34px', borderRadius: '50%',
              background: 'var(--gold)', overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#0a0a0f', fontSize: '0.8rem', fontWeight: '600',
              border: '2px solid rgba(201,168,76,0.4)', cursor: 'pointer',
              transition: 'all 0.2s',
            }}>
              {user.photoURL
                ? <img src={user.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : (user.displayName?.[0] || user.email?.[0])?.toUpperCase()
              }
            </button>
            <button onClick={logout} style={{
              background: 'transparent', border: 'none',
              color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
              padding: '0.25rem', cursor: 'pointer', transition: 'color 0.2s',
            }}>
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <button onClick={onLoginClick} style={{
            background: 'var(--gold)', border: 'none',
            borderRadius: 'var(--radius-pill)', padding: '0.5rem 1.25rem',
            color: '#0a0a0f', fontSize: '0.85rem', fontWeight: '500',
            cursor: 'pointer', transition: 'opacity 0.2s',
          }}>
            Iniciar sesión
          </button>
        )}
      </div>
    </nav>
  )
}