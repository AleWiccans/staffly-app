'use client'

import { useState, useEffect } from 'react'
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import { Users, Music, Ban, Trash2, Plus, ArrowLeft, CheckCircle, ShoppingBag } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminPage() {
  const { user, isAdmin } = useAuth()
  const [tab, setTab] = useState('users')
  const [users, setUsers] = useState([])
  const [scores, setScores] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isAdmin) { fetchUsers(); fetchScores(); fetchOrders() }
  }, [isAdmin])

  const fetchUsers = async () => {
    try {
      const snap = await getDocs(collection(db, 'users'))
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  const fetchScores = async () => {
    try {
      const snap = await getDocs(collection(db, 'scores'))
      setScores(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (err) { console.error(err) }
  }

  const fetchOrders = async () => {
    try {
      const snap = await getDocs(collection(db, 'orders'))
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (err) { console.error(err) }
  }

  const handleBan = async (userId, banned) => {
    try {
      await updateDoc(doc(db, 'users', userId), { banned: !banned })
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, banned: !banned } : u))
      toast.success(banned ? 'Usuario desbaneado' : 'Usuario baneado')
    } catch { toast.error('Error al actualizar usuario') }
  }

  const handleDeleteScore = async (scoreId) => {
    if (!confirm('¿Eliminar esta partitura?')) return
    try {
      await deleteDoc(doc(db, 'scores', scoreId))
      setScores(prev => prev.filter(s => s.id !== scoreId))
      toast.success('Partitura eliminada')
    } catch { toast.error('Error al eliminar') }
  }

  const handlePermission = async (scoreId, userId, hasPermission) => {
    try {
      const { arrayUnion, arrayRemove } = await import('firebase/firestore')
      await updateDoc(doc(db, 'scores', scoreId), {
        allowedUsers: hasPermission ? arrayRemove(userId) : arrayUnion(userId)
      })
      setScores(prev => prev.map(s => {
        if (s.id !== scoreId) return s
        const allowed = s.allowedUsers || []
        return { ...s, allowedUsers: hasPermission ? allowed.filter(u => u !== userId) : [...allowed, userId] }
      }))
      toast.success(hasPermission ? 'Permiso revocado' : 'Permiso concedido')
    } catch { toast.error('Error al actualizar permiso') }
  }

  const pendingOrders = orders.filter(o => o.status === 'pending').length

  if (!isAdmin) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
      <div style={{ textAlign: 'center' }}><div style={{ fontSize: '2rem' }}>🔒</div>Acceso restringido</div>
    </div>
  )

  return (
    <main style={{ minHeight: '100vh', maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem' }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={() => window.location.href = '/'} style={{
          background: 'transparent', border: 'none',
          color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer',
        }}>
          <ArrowLeft size={16} /> Volver
        </button>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem' }}>
          Panel de <span style={{ color: 'var(--gold)' }}>Administrador</span>
        </h1>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Usuarios registrados', value: users.length, icon: <Users size={20} /> },
          { label: 'Partituras publicadas', value: scores.length, icon: <Music size={20} /> },
          { label: 'Usuarios baneados', value: users.filter(u => u.banned).length, icon: <Ban size={20} /> },
          { label: 'Pedidos pendientes', value: pendingOrders, icon: <ShoppingBag size={20} />, alert: pendingOrders > 0 },
        ].map(stat => (
          <div key={stat.label} style={{
            background: stat.alert ? 'rgba(201,168,76,0.06)' : 'var(--bg-card)',
            border: `0.5px solid ${stat.alert ? 'rgba(201,168,76,0.3)' : 'var(--border)'}`,
            borderRadius: 'var(--radius)', padding: '1.25rem',
          }}>
            <div style={{ color: stat.alert ? 'var(--gold)' : 'var(--text-muted)', marginBottom: '0.75rem' }}>{stat.icon}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: '0.25rem', color: stat.alert ? 'var(--gold)' : 'var(--text)' }}>{stat.value}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { key: 'users', label: 'Usuarios' },
          { key: 'scores', label: 'Partituras' },
          { key: 'permissions', label: 'Permisos de descarga' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '0.5rem 1.25rem',
            background: tab === t.key ? 'var(--gold)' : 'rgba(255,255,255,0.04)',
            border: `0.5px solid ${tab === t.key ? 'var(--gold)' : 'var(--border)'}`,
            borderRadius: 'var(--radius-pill)',
            color: tab === t.key ? '#0a0a0f' : 'var(--text-muted)',
            fontSize: '0.85rem', fontWeight: tab === t.key ? '500' : '400',
            cursor: 'pointer', transition: 'all 0.2s',
          }}>{t.label}</button>
        ))}
        <button onClick={() => window.location.href = '/admin/orders'} style={{
          padding: '0.5rem 1.25rem',
          background: pendingOrders > 0 ? 'rgba(201,168,76,0.1)' : 'rgba(255,255,255,0.04)',
          border: `0.5px solid ${pendingOrders > 0 ? 'rgba(201,168,76,0.4)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-pill)',
          color: pendingOrders > 0 ? 'var(--gold)' : 'var(--text-muted)',
          fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s',
          display: 'flex', alignItems: 'center', gap: '0.4rem',
        }}>
          <ShoppingBag size={14} /> Pedidos {pendingOrders > 0 && `(${pendingOrders} pendientes)`}
        </button>
      </div>

      {/* Tab Usuarios */}
      {tab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {loading ? <p style={{ color: 'var(--text-muted)' }}>Cargando...</p>
            : users.map(u => (
              <div key={u.id} style={{
                background: 'var(--bg-card)',
                border: `0.5px solid ${u.banned ? 'rgba(255,80,80,0.2)' : 'var(--border)'}`,
                borderRadius: 'var(--radius)', padding: '1rem 1.25rem',
                display: 'flex', alignItems: 'center', gap: '1rem',
              }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#0a0a0f', fontSize: '0.85rem', fontWeight: '600',
                  flexShrink: 0, overflow: 'hidden',
                }}>
                  {u.photoURL
                    ? <img src={u.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : u.displayName?.[0]?.toUpperCase() || u.email?.[0]?.toUpperCase()
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>{u.displayName || 'Sin nombre'}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{u.email}</div>
                </div>
                {u.banned && (
                  <span style={{ background: 'rgba(255,80,80,0.1)', border: '0.5px solid rgba(255,80,80,0.3)', color: '#ff5050', fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-pill)' }}>Baneado</span>
                )}
                <button onClick={() => handleBan(u.id, u.banned)} style={{
                  background: u.banned ? 'rgba(80,255,120,0.1)' : 'rgba(255,80,80,0.1)',
                  border: `0.5px solid ${u.banned ? 'rgba(80,255,120,0.3)' : 'rgba(255,80,80,0.3)'}`,
                  borderRadius: 'var(--radius-pill)', padding: '0.35rem 0.875rem',
                  color: u.banned ? '#50ff78' : '#ff5050', fontSize: '0.78rem',
                  display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer',
                }}>
                  <Ban size={12} /> {u.banned ? 'Desbanear' : 'Banear'}
                </button>
              </div>
            ))}
        </div>
      )}

      {/* Tab Partituras */}
      {tab === 'scores' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button onClick={() => window.location.href = '/admin/upload'} style={{
            background: 'var(--gold)', border: 'none', borderRadius: 'var(--radius-pill)',
            padding: '0.75rem 1.5rem', color: '#0a0a0f', fontWeight: '500',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            alignSelf: 'flex-start', marginBottom: '0.5rem', fontSize: '0.875rem', cursor: 'pointer',
          }}>
            <Plus size={16} /> Subir nueva partitura
          </button>
          {scores.map(s => (
            <div key={s.id} style={{
              background: 'var(--bg-card)', border: '0.5px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '1rem 1.25rem',
              display: 'flex', alignItems: 'center', gap: '1rem',
            }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: 'linear-gradient(135deg,#1a1a2e,#16213e)', overflow: 'hidden', flexShrink: 0 }}>
                {s.coverURL && <img src={s.coverURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>{s.title}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{s.composer} · {s.format}</div>
              </div>
              <div style={{ color: 'var(--gold)', fontSize: '0.875rem', fontWeight: '500' }}>
                {s.price === 0 ? 'Gratis' : `$${s.price?.toFixed(2)} MN`}
              </div>
              <button onClick={() => window.location.href = `/admin/edit/${s.id}`} style={{
                background: 'rgba(201,168,76,0.08)', border: '0.5px solid rgba(201,168,76,0.2)',
                borderRadius: 'var(--radius-pill)', padding: '0.3rem 0.75rem',
                color: 'var(--gold)', fontSize: '0.75rem', cursor: 'pointer',
              }}>Editar</button>
              <button onClick={() => handleDeleteScore(s.id)} style={{
                background: 'rgba(255,80,80,0.1)', border: '0.5px solid rgba(255,80,80,0.3)',
                borderRadius: '50%', width: '32px', height: '32px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#ff5050', cursor: 'pointer',
              }}>
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tab Permisos */}
      {tab === 'permissions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {scores.map(s => (
            <div key={s.id} style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: '1rem' }}>
                {s.title} <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'var(--font-body)' }}>— {s.composer}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {users.filter(u => !u.banned).map(u => {
                  const hasPermission = s.allowedUsers?.includes(u.id)
                  return (
                    <div key={u.id} style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem',
                      background: hasPermission ? 'rgba(201,168,76,0.05)' : 'rgba(255,255,255,0.02)',
                      borderRadius: 'var(--radius-sm)',
                      border: `0.5px solid ${hasPermission ? 'rgba(201,168,76,0.2)' : 'var(--border)'}`,
                    }}>
                      <div style={{ flex: 1, fontSize: '0.85rem' }}>
                        {u.displayName || u.email}
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: '0.5rem' }}>{u.email}</span>
                      </div>
                      <button onClick={() => handlePermission(s.id, u.id, hasPermission)} style={{
                        background: hasPermission ? 'rgba(201,168,76,0.1)' : 'rgba(255,255,255,0.04)',
                        border: `0.5px solid ${hasPermission ? 'rgba(201,168,76,0.3)' : 'var(--border)'}`,
                        borderRadius: 'var(--radius-pill)', padding: '0.3rem 0.875rem',
                        color: hasPermission ? 'var(--gold)' : 'var(--text-muted)',
                        fontSize: '0.75rem', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '0.35rem',
                      }}>
                        <CheckCircle size={12} /> {hasPermission ? 'Revocar' : 'Dar permiso'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}