'use client'

import { useState, useEffect } from 'react'
import { collection, getDocs, updateDoc, doc, query, orderBy } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuth } from '../../context/AuthContext'
import { ArrowLeft, Check, X, Clock, Download, Eye } from 'lucide-react'
import toast from 'react-hot-toast'

export default function OrdersPage() {
  const { isAdmin } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)

  useEffect(() => { if (isAdmin) fetchOrders() }, [isAdmin])

  const fetchOrders = async () => {
    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  const handleApprove = async (order) => {
    try {
      await updateDoc(doc(db, 'orders', order.id), { status: 'approved' })
      // Dar permiso de descarga al usuario para cada partitura
      for (const score of order.scores) {
        const { arrayUnion } = await import('firebase/firestore')
        await updateDoc(doc(db, 'scores', score.id), {
          allowedUsers: arrayUnion(order.userId)
        })
      }
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'approved' } : o))
      setSelected(prev => prev ? { ...prev, status: 'approved' } : null)
      toast.success('Pedido aprobado — el usuario puede descargar')
    } catch { toast.error('Error al aprobar') }
  }

  const handleReject = async (order) => {
    try {
      await updateDoc(doc(db, 'orders', order.id), { status: 'rejected' })
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'rejected' } : o))
      setSelected(prev => prev ? { ...prev, status: 'rejected' } : null)
      toast.success('Pedido rechazado')
    } catch { toast.error('Error al rechazar') }
  }

  const statusColor = (status) => {
    if (status === 'approved') return { bg: 'rgba(80,200,120,0.1)', border: 'rgba(80,200,120,0.3)', text: '#50c878' }
    if (status === 'rejected') return { bg: 'rgba(255,80,80,0.1)', border: 'rgba(255,80,80,0.3)', text: '#ff5050' }
    return { bg: 'rgba(201,168,76,0.1)', border: 'rgba(201,168,76,0.3)', text: 'var(--gold)' }
  }

  const statusLabel = (status) => {
    if (status === 'approved') return 'Aprobado'
    if (status === 'rejected') return 'Rechazado'
    return 'Pendiente'
  }

  const statusIcon = (status) => {
    if (status === 'approved') return <Check size={11} />
    if (status === 'rejected') return <X size={11} />
    return <Clock size={11} />
  }

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  if (!isAdmin) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
      <div style={{ textAlign: 'center' }}><div style={{ fontSize: '2rem' }}>🔒</div>Acceso restringido</div>
    </div>
  )

  return (
    <main style={{ minHeight: '100vh', maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={() => window.location.href = '/admin'} style={{
          background: 'transparent', border: 'none',
          color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer',
        }}>
          <ArrowLeft size={16} /> Volver
        </button>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem' }}>
          Pedidos <span style={{ color: 'var(--gold)' }}>y Pagos</span>
        </h1>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {[
          { key: 'all', label: 'Todos' },
          { key: 'pending', label: 'Pendientes' },
          { key: 'approved', label: 'Aprobados' },
          { key: 'rejected', label: 'Rechazados' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{
            padding: '0.4rem 1rem',
            background: filter === f.key ? 'var(--gold)' : 'rgba(255,255,255,0.04)',
            border: `0.5px solid ${filter === f.key ? 'var(--gold)' : 'var(--border)'}`,
            borderRadius: 'var(--radius-pill)',
            color: filter === f.key ? '#0a0a0f' : 'var(--text-muted)',
            fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s',
          }}>{f.label} {f.key !== 'all' && `(${orders.filter(o => o.status === (f.key)).length})`}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1.2fr' : '1fr', gap: '1.25rem' }}>

        {/* Lista de pedidos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {loading ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Cargando pedidos...</p>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <Clock size={32} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
              <p style={{ fontSize: '0.875rem' }}>No hay pedidos {filter !== 'all' ? statusLabel(filter).toLowerCase() + 's' : ''}</p>
            </div>
          ) : filtered.map(order => {
            const sc = statusColor(order.status)
            return (
              <div key={order.id}
                onClick={() => setSelected(selected?.id === order.id ? null : order)}
                style={{
                  background: selected?.id === order.id ? 'rgba(201,168,76,0.04)' : 'var(--bg-card)',
                  border: `0.5px solid ${selected?.id === order.id ? 'rgba(201,168,76,0.3)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius)', padding: '1rem 1.25rem',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{order.userName}</span>
                      <span style={{
                        display: 'flex', alignItems: 'center', gap: '0.2rem',
                        background: sc.bg, border: `0.5px solid ${sc.border}`,
                        color: sc.text, fontSize: '0.65rem', padding: '0.15rem 0.5rem',
                        borderRadius: 'var(--radius-pill)',
                      }}>
                        {statusIcon(order.status)} {statusLabel(order.status)}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.userEmail}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      {order.scores?.length} partitura{order.scores?.length !== 1 ? 's' : ''} · {order.payMethod === 'transfermovil' ? 'Transfermóvil' : 'ENZONA'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ color: 'var(--gold)', fontWeight: '600', fontSize: '0.95rem' }}>
                      ${order.total?.toFixed(2)} MN
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {order.createdAt?.toDate?.()?.toLocaleDateString?.() || ''}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Detalle del pedido */}
        {selected && (
          <div style={{
            background: 'var(--bg-card)', border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '1.5rem',
            position: 'sticky', top: '5rem', alignSelf: 'flex-start',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>Detalle del pedido</h3>
              <button onClick={() => setSelected(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            {/* Info usuario */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.875rem', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Usuario</div>
              <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>{selected.userName}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{selected.userEmail}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Método: {selected.payMethod === 'transfermovil' ? 'Transfermóvil' : 'ENZONA'}</div>
            </div>

            {/* Partituras */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Partituras</div>
              {selected.scores?.map((s, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', padding: '0.35rem 0', borderBottom: '0.5px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>{s.title}</span>
                  <span style={{ color: 'var(--text)', flexShrink: 0 }}>${s.price?.toFixed(2)} MN</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontWeight: '600' }}>
                <span style={{ fontSize: '0.825rem' }}>Total</span>
                <span style={{ color: 'var(--gold)' }}>${selected.total?.toFixed(2)} MN</span>
              </div>
            </div>

            {/* Comprobante */}
            {selected.receiptURL && (
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Comprobante de pago</div>
                <img src={selected.receiptURL} alt="Comprobante"
                  style={{ width: '100%', borderRadius: 'var(--radius-sm)', border: '0.5px solid var(--border)', cursor: 'pointer' }}
                  onClick={() => window.open(selected.receiptURL, '_blank')}
                />
                <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.3rem', textAlign: 'center' }}>Clic para ampliar</p>
              </div>
            )}

            {/* Acciones */}
            {selected.status === 'pending' && (
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={() => handleApprove(selected)} style={{
                  flex: 1, padding: '0.75rem',
                  background: 'rgba(80,200,120,0.1)', border: '0.5px solid rgba(80,200,120,0.3)',
                  borderRadius: 'var(--radius-pill)', color: '#50c878',
                  fontWeight: '500', fontSize: '0.875rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                  transition: 'all 0.2s',
                }}>
                  <Check size={15} /> Aprobar
                </button>
                <button onClick={() => handleReject(selected)} style={{
                  flex: 1, padding: '0.75rem',
                  background: 'rgba(255,80,80,0.1)', border: '0.5px solid rgba(255,80,80,0.3)',
                  borderRadius: 'var(--radius-pill)', color: '#ff5050',
                  fontWeight: '500', fontSize: '0.875rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                  transition: 'all 0.2s',
                }}>
                  <X size={15} /> Rechazar
                </button>
              </div>
            )}

            {selected.status !== 'pending' && (
              <div style={{
                textAlign: 'center', padding: '0.75rem',
                background: statusColor(selected.status).bg,
                border: `0.5px solid ${statusColor(selected.status).border}`,
                borderRadius: 'var(--radius-pill)',
                color: statusColor(selected.status).text,
                fontSize: '0.875rem', fontWeight: '500',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
              }}>
                {statusIcon(selected.status)} Pedido {statusLabel(selected.status).toLowerCase()}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}