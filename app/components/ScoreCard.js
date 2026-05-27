'use client'

import { useState } from 'react'
import { Heart, Star, Eye, Bookmark, BookmarkCheck, ShoppingCart } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { db } from '../lib/firebase'
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { useCurrency } from './CurrencySelector'
import toast from 'react-hot-toast'

export default function ScoreCard({ score, onClick, onAddToCart }) {
  const { user } = useAuth()
  const { format } = useCurrency()
  const [saved, setSaved] = useState(score.savedBy?.includes(user?.uid))
  const [liked, setLiked] = useState(score.likedBy?.includes(user?.uid))
  const [likes, setLikes] = useState(score.likes || 0)

  const handleSave = async (e) => {
    e.stopPropagation()
    if (!user) return toast.error('Inicia sesión para guardar partituras')
    try {
      const ref = doc(db, 'scores', score.id)
      if (saved) {
        await updateDoc(ref, { savedBy: arrayRemove(user.uid) })
        setSaved(false)
        toast.success('Eliminada de guardados')
      } else {
        await updateDoc(ref, { savedBy: arrayUnion(user.uid) })
        setSaved(true)
        toast.success('Guardada en tu perfil')
      }
    } catch { toast.error('Error al guardar') }
  }

  const handleLike = async (e) => {
    e.stopPropagation()
    if (!user) return toast.error('Inicia sesión para dar like')
    try {
      const ref = doc(db, 'scores', score.id)
      if (liked) {
        await updateDoc(ref, { likedBy: arrayRemove(user.uid), likes: likes - 1 })
        setLiked(false); setLikes(l => l - 1)
      } else {
        await updateDoc(ref, { likedBy: arrayUnion(user.uid), likes: likes + 1 })
        setLiked(true); setLikes(l => l + 1)
      }
    } catch { toast.error('Error') }
  }

  const stars = Math.round(score.avgRating || 0)

  return (
    <div onClick={onClick} style={{
      background: 'var(--bg-card)',
      border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius)',
      overflow: 'hidden', cursor: 'pointer',
      transition: 'all 0.3s', position: 'relative',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.borderColor = 'var(--border-hover)'
        e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.4)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Cover */}
      <div style={{
        aspectRatio: '3/4',
        background: 'linear-gradient(135deg,#1a1a2e,#16213e)',
        position: 'relative', overflow: 'hidden',
      }}>
        {score.coverURL
          ? <img src={score.coverURL} alt={score.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.2, fontSize: '2rem' }}>🎼</div>
        }

        {/* Badge formato */}
        {score.format && (
          <div style={{
            position: 'absolute', top: '0.75rem', left: '0.75rem',
            background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(4px)',
            border: '0.5px solid var(--border)', color: 'var(--gold)',
            fontSize: '0.6rem', fontWeight: '600',
            padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-pill)',
            letterSpacing: '0.05em', textTransform: 'uppercase',
          }}>{score.format}</div>
        )}

        {/* Botón guardar */}
        <button onClick={handleSave} style={{
          position: 'absolute', top: '0.75rem', right: '0.75rem',
          background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(4px)',
          border: '0.5px solid var(--border)', borderRadius: '50%',
          width: '30px', height: '30px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: saved ? 'var(--gold)' : 'var(--text-muted)', cursor: 'pointer',
          transition: 'all 0.2s',
        }}>
          {saved ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
        </button>
      </div>

      {/* Info */}
      <div style={{ padding: '1rem' }}>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: '1rem',
          marginBottom: '0.2rem', lineHeight: 1.3,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{score.title}</div>
        <div style={{
          fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{score.composer}</div>

        {/* Rating */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            {[1,2,3,4,5].map(i => (
              <Star key={i} size={11}
                fill={i <= stars ? 'var(--gold)' : 'transparent'}
                color={i <= stars ? 'var(--gold)' : 'var(--text-subtle)'}
              />
            ))}
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '0.25rem' }}>
              {score.avgRating?.toFixed(1) || '—'}
            </span>
          </div>
          <div style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--gold)' }}>
            {score.price === 0 ? 'Gratis' : format(score.price)}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Eye size={11} /> {score.views || 0}
          </span>
          <button onClick={handleLike} style={{
            display: 'flex', alignItems: 'center', gap: '0.25rem',
            background: 'transparent', border: 'none',
            color: liked ? '#ff5050' : 'var(--text-muted)',
            fontSize: '0.72rem', cursor: 'pointer', padding: 0,
          }}>
            <Heart size={11} fill={liked ? '#ff5050' : 'transparent'} color={liked ? '#ff5050' : 'var(--text-muted)'} />
            {likes}
          </button>
        </div>

        {/* Tags */}
        {score.tags?.length > 0 && (
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            {score.tags.slice(0, 3).map(tag => (
              <span key={tag} style={{
                background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)',
                fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-pill)',
              }}>#{tag}</span>
            ))}
          </div>
        )}

        {/* Botón añadir al carrito */}
        <button onClick={e => { e.stopPropagation(); onAddToCart?.() }} style={{
          width: '100%', padding: '0.5rem',
          background: 'rgba(201,168,76,0.08)',
          border: '0.5px solid rgba(201,168,76,0.25)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--gold)', fontSize: '0.78rem',
          cursor: 'pointer', transition: 'all 0.2s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
        }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(201,168,76,0.15)'
            e.currentTarget.style.borderColor = 'rgba(201,168,76,0.5)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(201,168,76,0.08)'
            e.currentTarget.style.borderColor = 'rgba(201,168,76,0.25)'
          }}
        >
          <ShoppingCart size={13} /> Añadir al carrito
        </button>
      </div>
    </div>
  )
}