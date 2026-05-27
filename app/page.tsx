'use client'

import { useState, useEffect } from 'react'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from './lib/firebase'
import { useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import ScoreCard from './components/ScoreCard'
import AuthModal from './components/AuthModal'
import CartModal from './components/CartModal'
import ProfileModal from './components/ProfileModal'
import CurrencySelector, { useCurrency } from './components/CurrencySelector'
import toast from 'react-hot-toast'

const FORMATS = [
  'Todos', 'Orquesta Sinfónica', 'Banda Sinfónica', 'Big Band',
  'Orquesta de Cámara', 'Orquesta de Cuerdas', 'Piano Solo',
  'Piano y Voz', 'Guitarra Solo', 'Guitarra y Voz',
  'Instrumento Solo + Piano', 'Coro SATB', 'Coro + Piano', 'Coro + Orquesta',
]

const SCORES_PER_PAGE = 12

function HomeContent() {
  const { user, isAdmin } = useAuth()
  const { format } = useCurrency()
  const [scores, setScores] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeFormat, setActiveFormat] = useState('Todos')
  const [showAuth, setShowAuth] = useState(false)
  const [showCart, setShowCart] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [cart, setCart] = useState([])
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => { fetchScores() }, [])
  useEffect(() => { filterScores() }, [search, activeFormat, scores])
  useEffect(() => { setCurrentPage(1) }, [search, activeFormat])

  const fetchScores = async () => {
    try {
      const q = query(collection(db, 'scores'), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setScores(data)
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  const filterScores = () => {
    let result = [...scores]
    if (activeFormat !== 'Todos') result = result.filter(s => s.format === activeFormat)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(s =>
        s.title?.toLowerCase().includes(q) ||
        s.composer?.toLowerCase().includes(q) ||
        s.tags?.some(t => t.toLowerCase().includes(q.replace('#', '')))
      )
    }
    setFiltered(result)
  }

  const addToCart = (score) => {
    if (!user) return setShowAuth(true)
    if (cart.find(s => s.id === score.id)) return toast.error('Ya está en el carrito')
    setCart(prev => [...prev, score])
    toast.success('Añadido al carrito')
  }

  const removeFromCart = (id) => setCart(prev => prev.filter(s => s.id !== id))
  const clearCart = () => setCart([])

  // Paginación
  const totalPages = Math.ceil(filtered.length / SCORES_PER_PAGE)
  const paginated = filtered.slice((currentPage - 1) * SCORES_PER_PAGE, currentPage * SCORES_PER_PAGE)

  const goToPage = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <main style={{ minHeight: '100vh' }}>
      <Navbar
        onSearch={setSearch}
        cartCount={cart.length}
        onCartClick={() => user ? setShowCart(true) : setShowAuth(true)}
        onLoginClick={() => setShowAuth(true)}
        onAdminClick={() => window.location.href = '/admin'}
        onProfileClick={() => user ? setShowProfile(true) : setShowAuth(true)}
        extraRight={<CurrencySelector />}
      />

      {/* Hero */}
      <section style={{ padding: '4rem 2.5rem 3rem', textAlign: 'center' }}>
        <div style={{
          display: 'inline-block',
          border: '0.5px solid rgba(201,168,76,0.4)',
          color: 'var(--gold)', fontSize: '0.75rem',
          letterSpacing: '0.12em', textTransform: 'uppercase',
          padding: '0.35rem 1rem', borderRadius: 'var(--radius-pill)', marginBottom: '1.5rem',
        }}>✦ Tu biblioteca musical digital</div>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2.2rem,5vw,4.5rem)',
          lineHeight: 1.05, letterSpacing: '-0.03em',
          marginBottom: '1.25rem', maxWidth: '700px', margin: '0 auto 1.25rem',
        }}>
          Partituras para <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>cada</em> músico
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '480px', margin: '0 auto', lineHeight: 1.7 }}>
          Descubre, escucha y descarga partituras de alta calidad para todos los formatos y géneros musicales.
        </p>
      </section>

      {/* Filtros */}
      <div style={{ padding: '0 2.5rem 1.25rem', display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
        {FORMATS.map(f => (
          <button key={f} onClick={() => setActiveFormat(f)} style={{
            border: `0.5px solid ${activeFormat === f ? 'var(--gold)' : 'var(--border)'}`,
            color: activeFormat === f ? 'var(--gold)' : 'var(--text-muted)',
            padding: '0.4rem 1rem', borderRadius: 'var(--radius-pill)', fontSize: '0.8rem',
            background: activeFormat === f ? 'rgba(201,168,76,0.08)' : 'transparent',
            transition: 'all 0.2s', cursor: 'pointer',
          }}>{f}</button>
        ))}
      </div>

      {/* Catálogo */}
      <div style={{ padding: '0 2.5rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🎼</div>
            Cargando partituras...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔍</div>
            {search ? `No se encontraron resultados para "${search}"` : 'No hay partituras aún'}
          </div>
        ) : (
          <>
            {/* Contador */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                {filtered.length} partitura{filtered.length !== 1 ? 's' : ''} encontrada{filtered.length !== 1 ? 's' : ''}
              </span>
              {totalPages > 1 && (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                  Página {currentPage} de {totalPages}
                </span>
              )}
            </div>

            {/* Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: '1.25rem' }}>
              {paginated.map(score => (
                <ScoreCard
                  key={score.id}
                  score={score}
                  onAddToCart={() => addToCart(score)}
                  onClick={() => window.location.href = `/score/${score.id}`}
                />
              ))}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '0.5rem', padding: '3rem 0 4rem',
              }}>
                {/* Anterior */}
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '0.5px solid var(--border)',
                    borderRadius: 'var(--radius-pill)',
                    padding: '0.5rem 1rem',
                    color: currentPage === 1 ? 'var(--text-subtle)' : 'var(--text-muted)',
                    fontSize: '0.825rem', cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    opacity: currentPage === 1 ? 0.4 : 1,
                    transition: 'all 0.2s',
                  }}>
                  ← Anterior
                </button>

                {/* Números de página */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                  const isNear = page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1
                  const isDot = !isNear && (page === 2 || page === totalPages - 1)
                  if (!isNear && !isDot) return null
                  if (isDot) return (
                    <span key={page} style={{ color: 'var(--text-subtle)', fontSize: '0.825rem', padding: '0 0.25rem' }}>…</span>
                  )
                  return (
                    <button key={page} onClick={() => goToPage(page)} style={{
                      background: currentPage === page ? 'var(--gold)' : 'rgba(255,255,255,0.04)',
                      border: `0.5px solid ${currentPage === page ? 'var(--gold)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius-sm)',
                      width: '36px', height: '36px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: currentPage === page ? '#0a0a0f' : 'var(--text-muted)',
                      fontSize: '0.825rem', fontWeight: currentPage === page ? '600' : '400',
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}>{page}</button>
                  )
                })}

                {/* Siguiente */}
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '0.5px solid var(--border)',
                    borderRadius: 'var(--radius-pill)',
                    padding: '0.5rem 1rem',
                    color: currentPage === totalPages ? 'var(--text-subtle)' : 'var(--text-muted)',
                    fontSize: '0.825rem', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    opacity: currentPage === totalPages ? 0.4 : 1,
                    transition: 'all 0.2s',
                  }}>
                  Siguiente →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modales */}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      {showCart && <CartModal cart={cart} onClose={() => setShowCart(false)} onRemove={removeFromCart} onClearCart={clearCart} />}
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
    </main>
  )
}

export default function Home() {
  return <HomeContent />
}