'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { doc, getDoc, updateDoc, increment, collection, addDoc, getDocs, query, orderBy, setDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuth } from '../../context/AuthContext'
import { ArrowLeft, Heart, Bookmark, BookmarkCheck, ShoppingCart, Star, Play, Pause, Edit, ChevronLeft, ChevronRight, X } from 'lucide-react'
import toast from 'react-hot-toast'
import OrchestraMap from '../../components/OrchestraMap'

export default function ScorePage() {
  const { id } = useParams()
  const { user, isAdmin } = useAuth()
  const [score, setScore] = useState(null)
  const [loading, setLoading] = useState(true)
  const [playing, setPlaying] = useState(false)
  const [audioObj, setAudioObj] = useState(null)
  const [userRating, setUserRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [submittingComment, setSubmittingComment] = useState(false)
  const [modalPage, setModalPage] = useState(null)
  const visitRegistered = useRef(false)

  useEffect(() => { fetchScore(); fetchComments() }, [id])
  useEffect(() => { return () => { if (audioObj) audioObj.pause() } }, [audioObj])

  const fetchScore = async () => {
    try {
      const ref = doc(db, 'scores', id)
      const snap = await getDoc(ref)
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() }
        setScore(data)
        setLiked(data.likedBy?.includes(user?.uid))
        setSaved(data.savedBy?.includes(user?.uid))
        if (!visitRegistered.current) {
          visitRegistered.current = true
          await updateDoc(ref, { views: increment(1) })
          setScore(prev => prev ? { ...prev, views: (prev.views || 0) + 1 } : prev)
        }
      }
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  const fetchComments = async () => {
    try {
      const q = query(collection(db, 'scores', id, 'comments'), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (err) { console.error(err) }
  }

  const handlePlay = () => {
    if (!score?.audioURL) return toast.error('No hay audio disponible')
    if (playing) { audioObj?.pause(); setPlaying(false) }
    else {
      const a = new Audio(score.audioURL)
      a.play(); a.onended = () => setPlaying(false)
      setAudioObj(a); setPlaying(true)
    }
  }

  const handleLike = async () => {
    if (!user) return toast.error('Inicia sesión para dar like')
    const ref = doc(db, 'scores', id)
    const { arrayUnion, arrayRemove } = await import('firebase/firestore')
    if (liked) {
      await updateDoc(ref, { likedBy: arrayRemove(user.uid), likes: increment(-1) })
      setLiked(false); setScore(prev => ({ ...prev, likes: (prev.likes || 1) - 1 }))
    } else {
      await updateDoc(ref, { likedBy: arrayUnion(user.uid), likes: increment(1) })
      setLiked(true); setScore(prev => ({ ...prev, likes: (prev.likes || 0) + 1 }))
    }
  }

  const handleSave = async () => {
    if (!user) return toast.error('Inicia sesión para guardar')
    const ref = doc(db, 'scores', id)
    const { arrayUnion, arrayRemove } = await import('firebase/firestore')
    if (saved) {
      await updateDoc(ref, { savedBy: arrayRemove(user.uid) }); setSaved(false); toast.success('Eliminada de guardados')
    } else {
      await updateDoc(ref, { savedBy: arrayUnion(user.uid) }); setSaved(true); toast.success('Guardada en tu perfil')
    }
  }

  const handleRating = async (rating) => {
    if (!user) return toast.error('Inicia sesión para votar')
    try {
      await setDoc(doc(db, 'scores', id, 'ratings', user.uid), { rating, userId: user.uid, createdAt: new Date() })
      const ratingsSnap = await getDocs(collection(db, 'scores', id, 'ratings'))
      const ratings = ratingsSnap.docs.map(d => d.data().rating)
      const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length
      await updateDoc(doc(db, 'scores', id), { avgRating: avg, totalRatings: ratings.length })
      setUserRating(rating)
      setScore(prev => ({ ...prev, avgRating: avg, totalRatings: ratings.length }))
      toast.success('¡Voto registrado!')
    } catch { toast.error('Error al votar') }
  }

  const handleComment = async () => {
    if (!user) return toast.error('Inicia sesión para comentar')
    if (!newComment.trim()) return
    setSubmittingComment(true)
    try {
      await addDoc(collection(db, 'scores', id, 'comments'), {
        text: newComment, userId: user.uid,
        userName: user.displayName || 'Usuario',
        userPhoto: user.photoURL || '', createdAt: new Date(),
      })
      setNewComment(''); fetchComments(); toast.success('Comentario publicado')
    } catch { toast.error('Error al comentar') }
    setSubmittingComment(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
      <div style={{ textAlign: 'center' }}><div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🎼</div>Cargando partitura...</div>
    </div>
  )

  if (!score) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
      Partitura no encontrada
    </div>
  )

  const pages = score.previewPages || []

  return (
    <main style={{ minHeight: '100vh', maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem' }}>

      {/* Modal páginas */}
      {modalPage !== null && (
        <div onClick={() => setModalPage(null)} style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}>
          <button onClick={() => setModalPage(null)} style={{
            position: 'absolute', top: '1.5rem', right: '1.5rem',
            background: 'rgba(255,255,255,0.08)', border: 'none',
            borderRadius: '50%', width: '40px', height: '40px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text)', cursor: 'pointer',
          }}><X size={18} /></button>
          {modalPage > 0 && (
            <button onClick={e => { e.stopPropagation(); setModalPage(modalPage - 1) }} style={{
              position: 'absolute', left: '1.5rem',
              background: 'rgba(255,255,255,0.08)', border: 'none',
              borderRadius: '50%', width: '44px', height: '44px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text)', cursor: 'pointer',
            }}><ChevronLeft size={22} /></button>
          )}
          <img src={pages[modalPage]} alt={`Página ${modalPage + 1}`}
            onClick={e => e.stopPropagation()}
            style={{ maxHeight: '90vh', maxWidth: '90vw', objectFit: 'contain', borderRadius: 'var(--radius)', boxShadow: '0 40px 80px rgba(0,0,0,0.6)' }}
          />
          {modalPage < pages.length - 1 && (
            <button onClick={e => { e.stopPropagation(); setModalPage(modalPage + 1) }} style={{
              position: 'absolute', right: '1.5rem',
              background: 'rgba(255,255,255,0.08)', border: 'none',
              borderRadius: '50%', width: '44px', height: '44px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text)', cursor: 'pointer',
            }}><ChevronRight size={22} /></button>
          )}
          <div style={{ position: 'absolute', bottom: '1.5rem', color: 'var(--text-muted)', fontSize: '0.825rem' }}>
            Página {modalPage + 1} de {pages.length}
          </div>
        </div>
      )}

      {/* Volver + Editar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <button onClick={() => window.location.href = '/'} style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          background: 'transparent', border: 'none',
          color: 'var(--text-muted)', fontSize: '0.875rem', cursor: 'pointer',
        }}>
          <ArrowLeft size={16} /> Volver al catálogo
        </button>
        {isAdmin && (
          <button onClick={() => window.location.href = `/admin/edit/${id}`} style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: 'rgba(201,168,76,0.1)', border: '0.5px solid rgba(201,168,76,0.3)',
            borderRadius: 'var(--radius-pill)', padding: '0.5rem 1.25rem',
            color: 'var(--gold)', fontSize: '0.85rem', cursor: 'pointer',
          }}>
            <Edit size={14} /> Editar partitura
          </button>
        )}
      </div>

      {/* Header: cover + info */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '2.5rem', marginBottom: '3rem' }}>

        {/* Cover + miniaturas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ aspectRatio: '3/4', borderRadius: 'var(--radius)', overflow: 'hidden', background: 'linear-gradient(135deg,#1a1a2e,#16213e)' }}>
            {score.coverURL
              ? <img src={score.coverURL} alt={score.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.2, fontSize: '3rem' }}>🎼</div>
            }
          </div>
          {pages.length > 0 && (
            <div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.4rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Vista previa</p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {pages.map((url, i) => (
                  <div key={i} onClick={() => setModalPage(i)} style={{
                    flex: 1, aspectRatio: '3/4', borderRadius: '6px', overflow: 'hidden',
                    border: '0.5px solid var(--border)', cursor: 'pointer', transition: 'all 0.2s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--gold)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    <img src={url} alt={`Página ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
              <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.3rem', textAlign: 'center' }}>Clic para ampliar</p>
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{
            display: 'inline-flex', alignSelf: 'flex-start',
            border: '0.5px solid rgba(201,168,76,0.4)', color: 'var(--gold)',
            fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase',
            padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-pill)',
          }}>{score.format}</div>

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem,3vw,2.8rem)', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            {score.title}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>{score.composer}</p>
          {score.genre && <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Género: {score.genre}</p>}

          {/* Rating */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              {[1,2,3,4,5].map(i => (
                <Star key={i} size={20}
                  fill={(hoverRating || userRating) >= i ? 'var(--gold)' : 'transparent'}
                  color={(hoverRating || userRating) >= i ? 'var(--gold)' : 'var(--text-subtle)'}
                  style={{ cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={() => setHoverRating(i)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => handleRating(i)}
                />
              ))}
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              {score.avgRating?.toFixed(1) || '—'} ({score.totalRatings || 0} votos)
            </span>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-muted)', fontSize: '0.825rem' }}>
            <span>👁 {score.views || 0} vistas</span>
            <span>❤️ {score.likes || 0} likes</span>
          </div>

          {/* Descripción con HTML */}
          {score.description && (
            <div
              dangerouslySetInnerHTML={{ __html: score.description }}
              style={{
                color: 'var(--text-muted)', fontSize: '0.9rem',
                lineHeight: 1.7, maxWidth: '520px',
              }}
            />
          )}

          {/* Estilos para el HTML de la descripción */}
          <style>{`
            .score-description h2 { font-size: 1.1rem; font-weight: 700; margin: 0.75rem 0 0.4rem; color: rgba(240,237,230,0.95); font-family: 'Playfair Display', serif; }
            .score-description h3 { font-size: 0.95rem; font-weight: 600; margin: 0.6rem 0 0.3rem; color: rgba(240,237,230,0.9); }
            .score-description p { margin: 0 0 0.5rem; }
            .score-description ul { padding-left: 1.25rem; margin: 0.4rem 0; }
            .score-description ol { padding-left: 1.25rem; margin: 0.4rem 0; }
            .score-description li { margin-bottom: 0.2rem; }
            .score-description strong { font-weight: 700; color: rgba(240,237,230,0.95); }
            .score-description em { font-style: italic; }
            .score-description u { text-decoration: underline; }
            .score-description s { text-decoration: line-through; }
          `}</style>

          {score.tags?.length > 0 && (
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {score.tags.map(tag => (
                <span key={tag} style={{
                  background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)',
                  fontSize: '0.75rem', padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-pill)',
                }}>#{tag}</span>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: 'auto', flexWrap: 'wrap' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--gold)' }}>
              {score.price === 0 ? 'Gratis' : `$${score.price?.toFixed(2)} MN`}
            </div>
            <button style={{
              background: 'var(--gold)', border: 'none', borderRadius: 'var(--radius-pill)',
              padding: '0.75rem 1.75rem', color: '#0a0a0f', fontSize: '0.9rem', fontWeight: '500',
              display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer',
            }}>
              <ShoppingCart size={16} /> Añadir al carrito
            </button>
            <button onClick={handlePlay} style={{
              background: 'rgba(255,255,255,0.06)', border: '0.5px solid var(--border)',
              borderRadius: 'var(--radius-pill)', padding: '0.75rem 1.25rem',
              color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer',
            }}>
              {playing ? <Pause size={16} /> : <Play size={16} />}
              {playing ? 'Pausar' : 'Escuchar muestra'}
            </button>
            <button onClick={handleLike} style={{
              background: liked ? 'rgba(255,80,80,0.1)' : 'rgba(255,255,255,0.04)',
              border: `0.5px solid ${liked ? 'rgba(255,80,80,0.3)' : 'var(--border)'}`,
              borderRadius: '50%', width: '42px', height: '42px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: liked ? '#ff5050' : 'var(--text-muted)', cursor: 'pointer',
            }}>
              <Heart size={16} fill={liked ? '#ff5050' : 'transparent'} />
            </button>
            <button onClick={handleSave} style={{
              background: saved ? 'rgba(201,168,76,0.1)' : 'rgba(255,255,255,0.04)',
              border: `0.5px solid ${saved ? 'rgba(201,168,76,0.3)' : 'var(--border)'}`,
              borderRadius: '50%', width: '42px', height: '42px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: saved ? 'var(--gold)' : 'var(--text-muted)', cursor: 'pointer',
            }}>
              {saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* Instrumentación con mapa de orquesta */}
      {score.instruments?.length > 0 && (
        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', marginBottom: '1.25rem' }}>
            Instrumentación
          </h2>
          <OrchestraMap instruments={score.instruments} />
        </section>
      )}

      {/* Comentarios */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', marginBottom: '1.25rem' }}>
          Comentarios ({comments.length})
        </h2>
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <textarea value={newComment} onChange={e => setNewComment(e.target.value)}
            placeholder={user ? 'Escribe un comentario...' : 'Inicia sesión para comentar'}
            disabled={!user} rows={2} style={{
              flex: 1, padding: '0.75rem 1rem',
              background: 'rgba(255,255,255,0.04)', border: '0.5px solid var(--border)',
              borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', color: 'var(--text)',
              resize: 'vertical', outline: 'none', opacity: user ? 1 : 0.5,
            }} />
          <button onClick={handleComment} disabled={!user || submittingComment} style={{
            background: 'var(--gold)', border: 'none', borderRadius: 'var(--radius-sm)',
            padding: '0 1.25rem', color: '#0a0a0f', fontWeight: '500', fontSize: '0.875rem',
            opacity: (!user || submittingComment) ? 0.5 : 1, cursor: 'pointer',
          }}>
            {submittingComment ? '...' : 'Publicar'}
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {comments.length === 0
            ? <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Sé el primero en comentar</p>
            : comments.map(comment => (
              <div key={comment.id} style={{
                background: 'var(--bg-card)', border: '0.5px solid var(--border)',
                borderRadius: 'var(--radius-sm)', padding: '1rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <div style={{
                    width: '30px', height: '30px', borderRadius: '50%', background: 'var(--gold)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#0a0a0f', fontSize: '0.75rem', fontWeight: '600',
                    overflow: 'hidden', flexShrink: 0,
                  }}>
                    {comment.userPhoto
                      ? <img src={comment.userPhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : comment.userName?.[0]?.toUpperCase()
                    }
                  </div>
                  <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{comment.userName}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                    {comment.createdAt?.toDate?.()?.toLocaleDateString?.() || ''}
                  </span>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{comment.text}</p>
              </div>
            ))
          }
        </div>
      </section>
    </main>
  )
}