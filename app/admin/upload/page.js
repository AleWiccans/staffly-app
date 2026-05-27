'use client'

import { useState } from 'react'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuth } from '../../context/AuthContext'
import { ArrowLeft, Upload, X, Music, FileText, Headphones, Image } from 'lucide-react'
import toast from 'react-hot-toast'
import RichTextEditor from '../../components/RichTextEditor'

const FORMATS = [
  'Orquesta Sinfónica', 'Banda Sinfónica', 'Big Band',
  'Orquesta de Cámara', 'Orquesta de Cuerdas', 'Piano Solo',
  'Piano y Voz', 'Guitarra Solo', 'Guitarra y Voz',
  'Instrumento Solo + Piano', 'Coro SATB', 'Coro + Piano', 'Coro + Orquesta',
]

const GENRES = [
  'Clásico', 'Romántico', 'Barroco', 'Contemporáneo',
  'Jazz', 'Pop', 'Rock', 'Bossa Nova', 'Latin',
  'Cinematográfico', 'Disney', 'Videojuegos', 'Religioso', 'Folclórico',
]

const INSTRUMENT_FAMILIES = {
  'Orquesta Sinfónica': ['Viento Madera', 'Viento Metal', 'Percusión', 'Teclados', 'Arpa', 'Cuerdas'],
  'Banda Sinfónica': ['Maderas', 'Metales', 'Percusión', 'Instrumentos Complementarios'],
  'Big Band': ['Saxofones', 'Trompetas', 'Trombones', 'Sección Rítmica'],
  'Orquesta de Cámara': ['Vientos Madera', 'Vientos Metal', 'Percusión', 'Teclados', 'Arpa', 'Cuerdas'],
  'Orquesta de Cuerdas': ['Cuerdas'],
  'Piano Solo': ['Piano'],
  'Piano y Voz': ['Voz', 'Piano'],
  'Guitarra Solo': ['Guitarra'],
  'Guitarra y Voz': ['Voz', 'Guitarra'],
  'Instrumento Solo + Piano': ['Solista', 'Piano'],
  'Coro SATB': ['Soprano', 'Alto', 'Tenor', 'Bajo'],
  'Coro + Piano': ['Soprano', 'Alto', 'Tenor', 'Bajo', 'Piano'],
  'Coro + Orquesta': ['Soprano', 'Alto', 'Tenor', 'Bajo', 'Viento Madera', 'Viento Metal', 'Percusión', 'Cuerdas'],
}

const DRUM_KIT_PARTS = [
  'bass drum', 'bombo', 'snare', 'caja', 'hi-hat', 'hihat', 'ride', 'crash',
  'tom', 'floor tom', 'cymbal', 'platillo', 'cowbell', 'cencerro', 'kick',
]

const isDrumKitPart = (name) => {
  const n = name.toLowerCase()
  return DRUM_KIT_PARTS.some(p => n.includes(p))
}

export default function UploadPage() {
  const { isAdmin } = useAuth()
  const [loading, setLoading] = useState(false)
  const [xmlParsed, setXmlParsed] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [dragOver, setDragOver] = useState(null)
  const [draggedInst, setDraggedInst] = useState(null)
  const [form, setForm] = useState({
    title: '', composer: '', genre: '', format: '',
    description: '', price: '', tags: [], instruments: [],
  })
  const [files, setFiles] = useState({ cover: null, pdf: null, audio: null, midi: null })
  const [previewPages, setPreviewPages] = useState([null, null, null])
  const [previewPageFiles, setPreviewPageFiles] = useState([null, null, null])
  const [coverPreview, setCoverPreview] = useState(null)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleFile = (field, file) => {
    setFiles({ ...files, [field]: file })
    if (field === 'cover' && file) setCoverPreview(URL.createObjectURL(file))
  }

  const handlePageImage = (index, file) => {
    if (!file) return
    const newFiles = [...previewPageFiles]
    const newPreviews = [...previewPages]
    newFiles[index] = file
    newPreviews[index] = URL.createObjectURL(file)
    setPreviewPageFiles(newFiles)
    setPreviewPages(newPreviews)
  }

  const removePageImage = (index) => {
    const newFiles = [...previewPageFiles]
    const newPreviews = [...previewPages]
    newFiles[index] = null; newPreviews[index] = null
    setPreviewPageFiles(newFiles); setPreviewPages(newPreviews)
  }

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const val = tagInput.trim().replace('#', '')
      if (!val) return
      if (!form.tags.includes(val)) setForm({ ...form, tags: [...form.tags, val] })
      setTagInput('')
    }
  }

  const removeTag = (index) => setForm({ ...form, tags: form.tags.filter((_, i) => i !== index) })

  const removeInstrument = (name) => {
    setForm(prev => ({ ...prev, instruments: prev.instruments.filter(i => i.name !== name) }))
  }

  const handleDragStart = (inst) => setDraggedInst(inst)
  const handleDrop = (targetFamily) => {
    if (!draggedInst) return
    setForm(prev => ({
      ...prev,
      instruments: prev.instruments.map(i =>
        i.name === draggedInst.name ? { ...i, family: targetFamily } : i
      )
    }))
    setDraggedInst(null); setDragOver(null)
  }

  const handleXML = async (file) => {
    if (!form.format) return toast.error('Selecciona el formato primero')
    try {
      const text = await file.text()
      const parser = new DOMParser()
      const xml = parser.parseFromString(text, 'text/xml')
      const parts = xml.querySelectorAll('part-name, instrument-name')
      const allNames = [...parts].map(p => p.textContent.trim()).filter(Boolean)
      let hasDrumKit = false
      const filteredNames = []
      for (const name of allNames) {
        if (isDrumKitPart(name)) { hasDrumKit = true }
        else { filteredNames.push(name) }
      }
      const uniqueNames = [...new Set(filteredNames)]
      if (hasDrumKit) uniqueNames.push('Drum Kit (Batería)')
      const instruments = uniqueNames.map(name => ({ name, family: detectFamily(name, form.format) }))
      setForm(prev => ({ ...prev, instruments }))
      setXmlParsed(true)
      toast.success(`${instruments.length} instrumentos detectados`)
    } catch { toast.error('Error al leer el archivo XML') }
  }

  const detectFamily = (name, format) => {
    const n = name.toLowerCase()
    if (format === 'Orquesta Sinfónica' || format === 'Orquesta de Cámara') {
      if (/flauta|flute|piccolo|flautín|oboe|corno inglés|english horn|clarinete|clarinet|fagot|bassoon|saxo|basset/.test(n)) return 'Viento Madera'
      if (/trompa|french horn|horn|trompeta|trumpet|trombón|trombone|tuba|cimbasso|fliscorno|flugelhorn|corneta|cornet/.test(n)) return 'Viento Metal'
      if (/timbal|timpani|percus|xilófono|xylophone|marimba|vibráfono|vibraphone|campana|glockenspiel|triángulo|triangle|tam.tam|drum kit|batería/.test(n)) return 'Percusión'
      if (/piano|celesta|clavecín|harpsichord|órgano|organ/.test(n)) return 'Teclados'
      if (/arpa|harp/.test(n)) return 'Arpa'
      if (/violín|violin|viola|chelo|cello|violonchelo|contrabajo|double bass/.test(n)) return 'Cuerdas'
    }
    if (format === 'Banda Sinfónica') {
      if (/flauta|flute|piccolo|oboe|clarinete|clarinet|fagot|bassoon|saxo|requinto/.test(n)) return 'Maderas'
      if (/trompa|horn|trompeta|trumpet|corneta|cornet|trombón|trombone|tuba|eufonio|euphonium|barítono|baritone|fliscorno|flugelhorn/.test(n)) return 'Metales'
      if (/timbal|timpani|percus|xilófono|marimba|vibráfono|campana|glockenspiel|triángulo|drum kit|batería/.test(n)) return 'Percusión'
      return 'Instrumentos Complementarios'
    }
    if (format === 'Big Band') {
      if (/saxo|sax/.test(n)) return 'Saxofones'
      if (/trompeta|trumpet|corneta|cornet/.test(n)) return 'Trompetas'
      if (/trombón|trombone/.test(n)) return 'Trombones'
      return 'Sección Rítmica'
    }
    if (format === 'Orquesta de Cuerdas') return 'Cuerdas'
    return 'Otros'
  }

  const uploadToCloudinary = async (file, resourceType = 'auto') => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', 'staffly_unsigned')
    formData.append('cloud_name', process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME)
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
      { method: 'POST', body: formData }
    )
    const data = await res.json()
    if (data.error) throw new Error(data.error.message)
    return data.secure_url
  }

  const handleSubmit = async () => {
    if (!form.title || !form.composer || !form.format || !form.genre)
      return toast.error('Completa título, compositor, formato y género')
    if (!files.cover || !files.pdf)
      return toast.error('El cover y el PDF son obligatorios')
    setLoading(true)
    try {
      toast.loading('Subiendo archivos...', { id: 'upload' })
      const coverURL = await uploadToCloudinary(files.cover, 'image')
      const pdfURL = await uploadToCloudinary(files.pdf, 'raw')
      const audioURL = files.audio ? await uploadToCloudinary(files.audio, 'video') : null
      const midiURL = files.midi ? await uploadToCloudinary(files.midi, 'raw') : null
      const pageURLs = await Promise.all(
        previewPageFiles.map(f => f ? uploadToCloudinary(f, 'image') : null)
      )
      await addDoc(collection(db, 'scores'), {
        title: form.title, composer: form.composer,
        genre: form.genre, format: form.format,
        description: form.description,
        price: parseFloat(form.price) || 0,
        tags: form.tags, instruments: form.instruments,
        coverURL, pdfURL, audioURL, midiURL,
        previewPages: pageURLs.filter(Boolean),
        views: 0, likes: 0, avgRating: 0, totalRatings: 0,
        savedBy: [], likedBy: [], allowedUsers: [],
        createdAt: new Date(),
      })
      toast.success('¡Partitura publicada!', { id: 'upload' })
      window.location.href = '/admin'
    } catch (err) {
      toast.error('Error: ' + err.message, { id: 'upload' })
    }
    setLoading(false)
  }

  if (!isAdmin) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
      <div style={{ textAlign: 'center' }}><div style={{ fontSize: '2rem' }}>🔒</div>Acceso restringido</div>
    </div>
  )

  const inputStyle = {
    width: '100%', padding: '0.75rem 1rem',
    background: 'rgba(255,255,255,0.04)',
    border: '0.5px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.875rem', color: 'var(--text)', outline: 'none',
  }

  const labelStyle = {
    fontSize: '0.78rem', color: 'var(--text-muted)',
    letterSpacing: '0.05em', textTransform: 'uppercase',
    marginBottom: '0.4rem', display: 'block',
  }

  const families = INSTRUMENT_FAMILIES[form.format] || ['Otros']

  return (
    <main style={{ minHeight: '100vh', maxWidth: '800px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={() => window.location.href = '/admin'} style={{
          background: 'transparent', border: 'none',
          color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer',
        }}>
          <ArrowLeft size={16} /> Volver
        </button>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem' }}>
          Subir <span style={{ color: 'var(--gold)' }}>Partitura</span>
        </h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Info básica */}
        <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: '1.25rem', color: 'var(--gold)' }}>Información básica</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Título *</label>
              <input name="title" value={form.title} onChange={handleChange} placeholder="Ej: Sinfonía No. 5" style={inputStyle} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Compositor *</label>
              <input name="composer" value={form.composer} onChange={handleChange} placeholder="Ej: Ludwig van Beethoven" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Formato *</label>
              <select name="format" value={form.format} onChange={handleChange} style={inputStyle}>
                <option value="">Seleccionar formato</option>
                {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Género *</label>
              <select name="genre" value={form.genre} onChange={handleChange} style={inputStyle}>
                <option value="">Seleccionar género</option>
                {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Descripción</label>
              <div style={{ position: 'relative' }}>
                <RichTextEditor
                  value={form.description}
                  onChange={(val) => setForm({ ...form, description: val })}
                  placeholder="Describe la obra, su historia, dificultad, etc."
                />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Precio (MN)</label>
              <input name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange} placeholder="0.00 = Gratis" style={inputStyle} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Etiquetas</label>
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: '0.4rem', padding: '0.5rem',
                background: 'rgba(255,255,255,0.04)', border: '0.5px solid var(--border)',
                borderRadius: 'var(--radius-sm)', minHeight: '44px', alignItems: 'center',
              }}>
                {form.tags.map((tag, i) => (
                  <span key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '0.3rem',
                    background: 'rgba(201,168,76,0.1)', border: '0.5px solid rgba(201,168,76,0.3)',
                    color: 'var(--gold)', fontSize: '0.78rem',
                    padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-pill)',
                  }}>
                    #{tag}
                    <button onClick={() => removeTag(i)} style={{ background: 'transparent', border: 'none', color: 'var(--gold)', cursor: 'pointer', padding: '0', fontSize: '0.85rem' }}>×</button>
                  </span>
                ))}
                <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown}
                  placeholder={form.tags.length === 0 ? 'Escribe y presiona Enter...' : ''}
                  style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '0.875rem', color: 'var(--text)', flex: 1, minWidth: '150px', padding: '0.25rem' }} />
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>Presiona Enter o coma para agregar cada etiqueta</p>
            </div>
          </div>
        </div>

        {/* Archivos */}
        <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: '1.25rem', color: 'var(--gold)' }}>Archivos</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {[
              { key: 'cover', label: 'Cover / Imagen *', accept: 'image/*', icon: <Upload size={16} /> },
              { key: 'pdf', label: 'Partitura PDF *', accept: '.pdf', icon: <FileText size={16} /> },
              { key: 'audio', label: 'Audio de referencia', accept: 'audio/*', icon: <Headphones size={16} /> },
              { key: 'midi', label: 'Archivo MIDI', accept: '.mid,.midi', icon: <Music size={16} /> },
            ].map(f => (
              <div key={f.key}>
                <label style={labelStyle}>{f.label}</label>
                <label style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
                  background: files[f.key] ? 'rgba(201,168,76,0.06)' : 'rgba(255,255,255,0.04)',
                  border: `0.5px solid ${files[f.key] ? 'rgba(201,168,76,0.3)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                  fontSize: '0.825rem', color: files[f.key] ? 'var(--gold)' : 'var(--text-muted)',
                }}>
                  {f.icon}
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {files[f.key] ? files[f.key].name : 'Seleccionar archivo'}
                  </span>
                  {files[f.key] && (
                    <button onClick={(e) => { e.preventDefault(); handleFile(f.key, null) }} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', padding: '0', cursor: 'pointer' }}>
                      <X size={13} />
                    </button>
                  )}
                  <input type="file" accept={f.accept} style={{ display: 'none' }} onChange={e => e.target.files[0] && handleFile(f.key, e.target.files[0])} />
                </label>
              </div>
            ))}
          </div>
          {coverPreview && (
            <div style={{ marginTop: '1rem' }}>
              <label style={labelStyle}>Vista previa del cover</label>
              <img src={coverPreview} alt="Cover" style={{ height: '160px', borderRadius: 'var(--radius-sm)', objectFit: 'cover', border: '0.5px solid var(--border)' }} />
            </div>
          )}
        </div>

        {/* Páginas de preview */}
        <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--gold)' }}>Páginas de muestra</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem', marginBottom: '1.25rem' }}>Sube hasta 3 capturas de las primeras páginas como imágenes.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
            {[0,1,2].map(i => (
              <div key={i}>
                <label style={labelStyle}>Página {i+1} {i === 0 ? '*' : '(opcional)'}</label>
                {previewPages[i] ? (
                  <div style={{ position: 'relative' }}>
                    <img src={previewPages[i]} alt={`Página ${i+1}`} style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '0.5px solid rgba(201,168,76,0.3)' }} />
                    <button onClick={() => removePageImage(i)} style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'rgba(10,10,15,0.8)', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)', cursor: 'pointer' }}>
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', aspectRatio: '3/4', background: 'rgba(255,255,255,0.02)', border: '0.5px dashed var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                    <Image size={20} style={{ opacity: 0.4 }} />
                    Subir imagen
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files[0] && handlePageImage(i, e.target.files[0])} />
                  </label>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Instrumentos */}
        <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--gold)' }}>Instrumentos</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem', marginBottom: '1.25rem' }}>
            Sube un archivo MusicXML para detectar instrumentos automáticamente. Puedes arrastrarlos entre familias o eliminarlos con ×.
          </p>
          <label style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1.25rem',
            background: xmlParsed ? 'rgba(201,168,76,0.06)' : 'rgba(255,255,255,0.04)',
            border: `0.5px solid ${xmlParsed ? 'rgba(201,168,76,0.3)' : 'var(--border)'}`,
            borderRadius: 'var(--radius-pill)', cursor: 'pointer',
            fontSize: '0.825rem', color: xmlParsed ? 'var(--gold)' : 'var(--text-muted)', marginBottom: '1rem',
          }}>
            <Music size={15} />
            {xmlParsed ? `${form.instruments.length} instrumentos detectados` : 'Subir archivo MusicXML'}
            <input type="file" accept=".xml,.musicxml" style={{ display: 'none' }} onChange={e => e.target.files[0] && handleXML(e.target.files[0])} />
          </label>

          {form.instruments.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {families.map(family => {
                const familyInsts = form.instruments.filter(i => i.family === family)
                return (
                  <div key={family}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(family) }}
                    onDragLeave={() => setDragOver(null)}
                    onDrop={() => handleDrop(family)}
                    style={{
                      background: dragOver === family ? 'rgba(201,168,76,0.06)' : 'rgba(255,255,255,0.02)',
                      border: `0.5px solid ${dragOver === family ? 'rgba(201,168,76,0.4)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius-sm)', padding: '0.875rem',
                      transition: 'all 0.2s', minHeight: '60px',
                    }}>
                    <div style={{ color: 'var(--gold)', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{family}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {familyInsts.map(inst => (
                        <span key={inst.name} draggable onDragStart={() => handleDragStart(inst)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.3rem',
                            background: 'rgba(255,255,255,0.06)', border: '0.5px solid var(--border)',
                            color: 'var(--text-muted)', fontSize: '0.78rem',
                            padding: '0.2rem 0.4rem 0.2rem 0.6rem', borderRadius: 'var(--radius-pill)',
                            cursor: 'grab', userSelect: 'none',
                          }}>
                          ⠿ {inst.name}
                          <button onClick={() => removeInstrument(inst.name)} style={{ background: 'transparent', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer', padding: '0', fontSize: '0.8rem', lineHeight: 1, display: 'flex', alignItems: 'center' }}>×</button>
                        </span>
                      ))}
                      {familyInsts.length === 0 && (
                        <span style={{ color: 'var(--text-subtle)', fontSize: '0.75rem', fontStyle: 'italic' }}>Arrastra instrumentos aquí</span>
                      )}
                    </div>
                  </div>
                )
              })}

              {form.instruments.some(i => !families.includes(i.family)) && (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver('Otros') }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={() => handleDrop('Otros')}
                  style={{
                    background: dragOver === 'Otros' ? 'rgba(201,168,76,0.06)' : 'rgba(255,80,80,0.04)',
                    border: `0.5px solid ${dragOver === 'Otros' ? 'rgba(201,168,76,0.4)' : 'rgba(255,80,80,0.2)'}`,
                    borderRadius: 'var(--radius-sm)', padding: '0.875rem', transition: 'all 0.2s',
                  }}>
                  <div style={{ color: '#ff5050', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>⚠ Sin clasificar</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {form.instruments.filter(i => !families.includes(i.family)).map(inst => (
                      <span key={inst.name} draggable onDragStart={() => handleDragStart(inst)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.3rem',
                          background: 'rgba(255,80,80,0.08)', border: '0.5px solid rgba(255,80,80,0.2)',
                          color: '#ff8080', fontSize: '0.78rem',
                          padding: '0.2rem 0.4rem 0.2rem 0.6rem', borderRadius: 'var(--radius-pill)',
                          cursor: 'grab', userSelect: 'none',
                        }}>
                        ⠿ {inst.name}
                        <button onClick={() => removeInstrument(inst.name)} style={{ background: 'transparent', border: 'none', color: '#ff8080', cursor: 'pointer', padding: '0', fontSize: '0.8rem', lineHeight: 1 }}>×</button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <button onClick={handleSubmit} disabled={loading} style={{
          background: 'var(--gold)', border: 'none', borderRadius: 'var(--radius-pill)',
          padding: '1rem 2rem', color: '#0a0a0f', fontSize: '1rem', fontWeight: '500',
          opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer',
        }}>
          <Upload size={18} />
          {loading ? 'Publicando...' : 'Publicar partitura'}
        </button>
      </div>
    </main>
  )
}