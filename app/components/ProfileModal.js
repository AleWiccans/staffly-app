'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { db } from '../lib/firebase'
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore'
import { X, Camera, User, Music, Download, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ProfileModal({ onClose }) {
  const { user } = useAuth()
  const [profile, setProfile] = useState({ displayName: '', phone: '' })
  const [savedScores, setSavedScores] = useState([])
  const [approvedScores, setApprovedScores] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [tab, setTab] = useState('perfil')

  useEffect(() => { if (user) fetchData() }, [user])

  const fetchData = async () => {
    try {
      const snap = await getDoc(doc(db, 'users', user.uid))
      if (snap.exists()) {
        const d = snap.data()
        setProfile({ displayName: d.displayName || '', phone: d.phone || '' })
        setPhotoPreview(d.photoURL || null)
      }
      const scoresSnap = await getDocs(collection(db, 'scores'))
      const all = scoresSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      setSavedScores(all.filter(s => s.savedBy?.includes(user.uid)))
      setApprovedScores(all.filter(s => s.allowedUsers?.includes(user.uid)))
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  const handlePhoto = (file) => {
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const uploadToCloudinary = async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', 'staffly_unsigned')
    formData.append('cloud_name', process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME)
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: 'POST', body: formData }
    )
    const data = await res.json()
    return data.secure_url
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      let photoURL = photoPreview || ''
      if (photoFile) photoURL = await uploadToCloudinary(photoFile)
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: profile.displayName,
        phone: profile.phone,
        photoURL,
      })
      toast.success('Perfil actualizado')
    } catch { toast.error('Error al guardar') }
    setSaving(false)
  }

  const handleDownload = async (score, type) => {
    const urls = { pdf: score.pdfURL, audio: score.audioURL, midi: score.midiURL }
    const url = urls[type]
    if (!url) return toast.error('Archivo no disponible')

    const downloads = score.userDownloads?.[user.uid] || {}
    if (downloads[type]) {
      return toast.error('Ya descargaste este archivo. Para volver a descargarlo debes pagar de nuevo.')
    }

    try {
      // Abrir el archivo en nueva pestaña para descargarlo
      window.open(url, '_blank')

      // Registrar descarga
      const newDownloads = { ...downloads, [type]: true }
      await updateDoc(doc(db, 'scores', score.id), {
        [`userDownloads.${user.uid}.${type}`]: true
      })

      // Verificar si ya se descargaron los 3 archivos disponibles
      const availableTypes = []
      if (score.pdfURL) availableTypes.push('pdf')
      if (score.audioURL) availableTypes.push('audio')
      if (score.midiURL) availableTypes.push('midi')

      const allDownloaded = availableTypes.every(t => t === type || newDownloads[t])

      if (allDownloaded) {
        // Revocar permiso — sacar de allowedUsers
        const { arrayRemove } = await import('firebase/firestore')
        await updateDoc(doc(db, 'scores', score.id), {
          allowedUsers: arrayRemove(user.uid)
        })
        toast.success('Todos los archivos descargados. Partitura eliminada de tus descargas.')
        // Actualizar lista local
        setApprovedScores(prev => prev.filter(s => s.id !== score.id))
      } else {
        toast.success('Descarga iniciada')
        // Actualizar estado local
        setApprovedScores(prev => prev.map(s => {
          if (s.id !== score.id) return s
          return {
            ...s,
            userDownloads: {
              ...s.userDownloads,
              [user.uid]: newDownloads
            }
          }
        }))
      }
    } catch (err) { toast.error('Error al descargar: ' + err.message) }
  }

  const inputStyle = {
    width: '100%', padding: '0.75rem 1rem',
    background: 'rgba(255,255,255,0.04)',
    border: '0.5px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.875rem', color: 'var(--text)',
    outline: 'none',
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#111118', border: '0.5px solid var(--border)',
        borderRadius: '16px', width: '100%', maxWidth: '560px',
        maxHeight: '88vh', overflowY: 'auto', position: 'relative',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem 1.5rem 0' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem' }}>
            Mi <span style={{ color: 'var(--gold)' }}>Perfil</span>
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', padding: '1rem 1.5rem 0' }}>
          {[
            { key: 'perfil', label: 'Perfil' },
            { key: 'guardadas', label: 'Guardadas' },
            { key: 'descargas', label: `Mis Descargas${approvedScores.length > 0 ? ` (${approvedScores.length})` : ''}` },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '0.4rem 1rem',
              background: tab === t.key ? 'var(--gold)' : 'rgba(255,255,255,0.04)',
              border: `0.5px solid ${tab === t.key ? 'var(--gold)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-pill)',
              color: tab === t.key ? '#0a0a0f' : 'var(--text-muted)',
              fontSize: '0.8rem', fontWeight: tab === t.key ? '500' : '400',
              cursor: 'pointer', transition: 'all 0.2s',
            }}>{t.label}</button>
          ))}
        </div>

        <div style={{ padding: '1.25rem 1.5rem 1.5rem' }}>

          {/* Tab Perfil */}
          {tab === 'perfil' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    width: '72px', height: '72px', borderRadius: '50%',
                    background: 'var(--gold)', overflow: 'hidden',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#0a0a0f', fontSize: '1.5rem', fontWeight: '600',
                    border: '2px solid rgba(201,168,76,0.3)',
                  }}>
                    {photoPreview
                      ? <img src={photoPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : user?.displayName?.[0]?.toUpperCase() || <User size={28} />
                    }
                  </div>
                  <label style={{
                    position: 'absolute', bottom: 0, right: 0,
                    background: 'var(--gold)', borderRadius: '50%',
                    width: '22px', height: '22px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', border: '2px solid #111118',
                  }}>
                    <Camera size={11} color="#0a0a0f" />
                    <input type="file" accept="image/*" style={{ display: 'none' }}
                      onChange={e => e.target.files[0] && handlePhoto(e.target.files[0])} />
                  </label>
                </div>
                <div>
                  <div style={{ fontWeight: '500', fontSize: '0.95rem' }}>{user?.displayName || 'Usuario'}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{user?.email}</div>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Nombre completo</label>
                <input value={profile.displayName} onChange={e => setProfile({ ...profile, displayName: e.target.value })} placeholder="Tu nombre completo" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Teléfono</label>
                <input value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} placeholder="+53 XXXXXXXX" style={inputStyle} />
              </div>

              <button onClick={handleSave} disabled={saving} style={{
                background: 'var(--gold)', border: 'none', borderRadius: 'var(--radius-pill)',
                padding: '0.75rem', color: '#0a0a0f', fontWeight: '500', fontSize: '0.875rem',
                opacity: saving ? 0.7 : 1, cursor: 'pointer',
              }}>
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          )}

          {/* Tab Guardadas */}
          {tab === 'guardadas' && (
            <div>
              {savedScores.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  <Music size={32} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                  <p style={{ fontSize: '0.875rem' }}>No tienes partituras guardadas aún</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem' }}>
                  {savedScores.map(score => (
                    <div key={score.id}
                      onClick={() => { window.location.href = `/score/${score.id}`; onClose() }}
                      style={{
                        cursor: 'pointer', borderRadius: 'var(--radius-sm)',
                        overflow: 'hidden', border: '0.5px solid var(--border)', transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--gold)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                    >
                      <div style={{ aspectRatio: '3/4', background: 'linear-gradient(135deg,#1a1a2e,#16213e)', overflow: 'hidden' }}>
                        {score.coverURL
                          ? <img src={score.coverURL} alt={score.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>🎼</div>
                        }
                      </div>
                      <div style={{ padding: '0.5rem' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{score.title}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{score.composer}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab Descargas */}
          {tab === 'descargas' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {approvedScores.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  <Download size={32} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                  <p style={{ fontSize: '0.875rem' }}>No tienes partituras aprobadas para descargar</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '0.5rem' }}>
                    Una vez que el administrador apruebe tu pago, tus partituras aparecerán aquí.
                  </p>
                </div>
              ) : (
                approvedScores.map(score => {
                  const downloads = score.userDownloads?.[user?.uid] || {}
                  const availableTypes = []
                  if (score.pdfURL) availableTypes.push('pdf')
                  if (score.audioURL) availableTypes.push('audio')
                  if (score.midiURL) availableTypes.push('midi')

                  return (
                    <div key={score.id} style={{
                      background: 'rgba(255,255,255,0.02)', border: '0.5px solid var(--border)',
                      borderRadius: 'var(--radius-sm)', padding: '1rem',
                    }}>
                      <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-start' }}>
                        <div style={{
                          width: '44px', height: '44px', borderRadius: '6px',
                          background: 'linear-gradient(135deg,#1a1a2e,#16213e)',
                          overflow: 'hidden', flexShrink: 0,
                        }}>
                          {score.coverURL && <img src={score.coverURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>{score.title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>{score.composer}</div>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {[
                              { key: 'pdf', label: 'PDF', available: !!score.pdfURL },
                              { key: 'audio', label: 'Audio', available: !!score.audioURL },
                              { key: 'midi', label: 'MIDI', available: !!score.midiURL },
                            ].map(f => (
                              <button key={f.key}
                                disabled={!f.available || downloads[f.key]}
                                onClick={() => handleDownload(score, f.key)}
                                style={{
                                  background: downloads[f.key] ? 'rgba(255,255,255,0.04)' : 'rgba(201,168,76,0.1)',
                                  border: `0.5px solid ${downloads[f.key] ? 'var(--border)' : 'rgba(201,168,76,0.3)'}`,
                                  borderRadius: 'var(--radius-pill)', padding: '0.3rem 0.875rem',
                                  color: downloads[f.key] ? 'var(--text-subtle)' : 'var(--gold)',
                                  fontSize: '0.75rem',
                                  cursor: downloads[f.key] || !f.available ? 'not-allowed' : 'pointer',
                                  display: 'flex', alignItems: 'center', gap: '0.3rem',
                                  opacity: !f.available ? 0.3 : 1,
                                  transition: 'all 0.2s',
                                }}>
                                <Download size={11} />
                                {downloads[f.key] ? `${f.label} ✓` : f.label}
                              </button>
                            ))}
                          </div>
                          <p style={{ fontSize: '0.65rem', color: 'var(--text-subtle)', marginTop: '0.5rem', lineHeight: 1.5 }}>
                            ⚠ Cada archivo se puede descargar una sola vez. Cuando descargues los {availableTypes.length} archivos, la partitura se eliminará de esta lista.
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}