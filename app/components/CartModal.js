'use client'

import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { db } from '../lib/firebase'
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore'
import { X, ShoppingCart, Trash2, ChevronRight, Upload, Check } from 'lucide-react'
import { useCurrency } from './CurrencySelector'
import toast from 'react-hot-toast'

const TRANSFERMOVIL_QR = 'https://res.cloudinary.com/dni9iud0t/image/upload/v1779684846/IMG_20260525_004714_pw0qwy.jpg'
const ENZONA_QR = 'https://res.cloudinary.com/dni9iud0t/image/upload/v1779685043/1779684209887_m08t9n.jpg'
const CARD_NUMBER = '9224 0699 9669 7302'
const PHONE = '+53 59558767'
const ADMIN_EMAIL = 'ale0597dani@gmail.com'

export default function CartModal({ cart, onClose, onRemove, onClearCart }) {
  const { user } = useAuth()
  const { format } = useCurrency()
  const [step, setStep] = useState('cart') // cart | payment | method | confirm
  const [payMethod, setPayMethod] = useState(null) // transfermovil | enzona
  const [receipt, setReceipt] = useState(null)
  const [receiptPreview, setReceiptPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [done, setDone] = useState(false)

  const total = cart.reduce((sum, s) => sum + (s.price || 0), 0)

  const handleReceiptFile = (file) => {
    if (!file) return
    setReceipt(file)
    setReceiptPreview(URL.createObjectURL(file))
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

  const handleSubmit = async () => {
    if (!receipt) return toast.error('Debes subir el comprobante de pago')
    if (!user) return toast.error('Inicia sesión primero')
    setUploading(true)
    try {
      const receiptURL = await uploadToCloudinary(receipt)
      await addDoc(collection(db, 'orders'), {
        userId: user.uid,
        userName: user.displayName || 'Usuario',
        userEmail: user.email,
        userPhone: '',
        scores: cart.map(s => ({ id: s.id, title: s.title, composer: s.composer, price: s.price })),
        total,
        payMethod,
        receiptURL,
        status: 'pending',
        createdAt: new Date(),
      })
      toast.success('¡Solicitud enviada! En espera de aprobación.')
      onClearCart()
      setDone(true)
    } catch (err) {
      toast.error('Error al enviar: ' + err.message)
    }
    setUploading(false)
  }

  const boxStyle = {
    background: '#111118',
    border: '0.5px solid var(--border)',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '520px',
    maxHeight: '90vh',
    overflowY: 'auto',
    position: 'relative',
  }

  if (done) return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div onClick={e => e.stopPropagation()} style={{ ...boxStyle, padding: '2.5rem', textAlign: 'center' }}>
        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(201,168,76,0.1)', border: '0.5px solid rgba(201,168,76,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
          <Check size={28} color="var(--gold)" />
        </div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '0.75rem' }}>¡Solicitud enviada!</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
          Tu comprobante fue recibido. El administrador revisará tu pago y aprobará las descargas en breve. Puedes ver el estado en tu perfil → <strong>Mis Descargas</strong>.
        </p>
        <button onClick={onClose} style={{ background: 'var(--gold)', border: 'none', borderRadius: 'var(--radius-pill)', padding: '0.75rem 2rem', color: '#0a0a0f', fontWeight: '500', cursor: 'pointer' }}>
          Entendido
        </button>
      </div>
    </div>
  )

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div onClick={e => e.stopPropagation()} style={boxStyle}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem 1.5rem 0' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingCart size={18} color="var(--gold)" />
            {step === 'cart' && 'Mi Carrito'}
            {step === 'payment' && 'Método de Pago'}
            {step === 'method' && (payMethod === 'transfermovil' ? 'Transfermóvil' : 'ENZONA')}
            {step === 'confirm' && 'Subir Comprobante'}
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '1.25rem 1.5rem 1.5rem' }}>

          {/* STEP: CARRITO */}
          {step === 'cart' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  <ShoppingCart size={36} style={{ opacity: 0.2, marginBottom: '0.75rem' }} />
                  <p style={{ fontSize: '0.875rem' }}>Tu carrito está vacío</p>
                </div>
              ) : (
                <>
                  {cart.map(score => (
                    <div key={score.id} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '6px', background: 'linear-gradient(135deg,#1a1a2e,#16213e)', overflow: 'hidden', flexShrink: 0 }}>
                        {score.coverURL && <img src={score.coverURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{score.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{score.composer}</div>
                      </div>
                      <div style={{ color: 'var(--gold)', fontWeight: '500', fontSize: '0.875rem', flexShrink: 0 }}>
                        {format(score.price)}
                      </div>
                      <button onClick={() => onRemove(score.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}

                  {/* Total */}
                  <div style={{ borderTop: '0.5px solid var(--border)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Total</span>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--gold)' }}>{format(total)}</span>
                  </div>

                  <button onClick={() => setStep('payment')} style={{ background: 'var(--gold)', border: 'none', borderRadius: 'var(--radius-pill)', padding: '0.875rem', color: '#0a0a0f', fontWeight: '500', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    Efectuar pago <ChevronRight size={16} />
                  </button>
                </>
              )}
            </div>
          )}

          {/* STEP: MÉTODO DE PAGO */}
          {step === 'payment' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Selecciona cómo deseas realizar el pago de <strong style={{ color: 'var(--gold)' }}>{format(total)}</strong>:
              </p>

              {/* Transfermóvil */}
              <button onClick={() => { setPayMethod('transfermovil'); setStep('method') }} style={{
                background: 'rgba(30,80,180,0.08)',
                border: '0.5px solid rgba(30,80,180,0.3)',
                borderRadius: 'var(--radius)',
                padding: '1.25rem',
                cursor: 'pointer', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: '1rem',
                textAlign: 'left',
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(30,80,180,0.6)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(30,80,180,0.3)'}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg,#1e50b4,#0a2a7a)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '800' }}>T</span>
                </div>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.95rem', color: 'var(--text)', marginBottom: '0.2rem' }}>Transfermóvil</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Pago por QR o número de tarjeta</div>
                </div>
                <ChevronRight size={16} color="var(--text-muted)" style={{ marginLeft: 'auto' }} />
              </button>

              {/* ENZONA */}
              <button onClick={() => { setPayMethod('enzona'); setStep('method') }} style={{
                background: 'rgba(20,160,80,0.08)',
                border: '0.5px solid rgba(20,160,80,0.3)',
                borderRadius: 'var(--radius)',
                padding: '1.25rem',
                cursor: 'pointer', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: '1rem',
                textAlign: 'left',
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(20,160,80,0.6)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(20,160,80,0.3)'}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg,#14a050,#0a6030)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '800' }}>E</span>
                </div>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.95rem', color: 'var(--text)', marginBottom: '0.2rem' }}>ENZONA</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Pago por código QR</div>
                </div>
                <ChevronRight size={16} color="var(--text-muted)" style={{ marginLeft: 'auto' }} />
              </button>

              <button onClick={() => setStep('cart')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.825rem', cursor: 'pointer', textAlign: 'center' }}>
                ← Volver al carrito
              </button>
            </div>
          )}

          {/* STEP: INSTRUCCIONES DE PAGO */}
          {step === 'method' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem', lineHeight: 1.6 }}>
                {payMethod === 'transfermovil'
                  ? 'Escanea el QR con Transfermóvil o realiza la transferencia manualmente con los datos siguientes:'
                  : 'Escanea el código QR con la app ENZONA para realizar el pago:'
                }
              </p>

              {/* QR */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <img
                  src={payMethod === 'transfermovil' ? TRANSFERMOVIL_QR : ENZONA_QR}
                  alt="Código QR"
                  style={{ width: '200px', height: '200px', objectFit: 'contain', borderRadius: 'var(--radius)', border: '0.5px solid var(--border)', background: '#fff', padding: '0.5rem' }}
                />
              </div>

              {/* Datos manuales solo para Transfermóvil */}
              {payMethod === 'transfermovil' && (
                <div style={{ background: 'rgba(30,80,180,0.06)', border: '0.5px solid rgba(30,80,180,0.2)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    O transfiere manualmente a:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Número de tarjeta</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: '600', letterSpacing: '0.05em', color: 'var(--text)' }}>{CARD_NUMBER}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Teléfono a confirmar</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text)' }}>{PHONE}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Monto total</span>
                      <span style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--gold)' }}>{format(total)}</span>
                    </div>
                  </div>
                </div>
              )}

              {payMethod === 'enzona' && (
                <div style={{ background: 'rgba(20,160,80,0.06)', border: '0.5px solid rgba(20,160,80,0.2)', borderRadius: 'var(--radius-sm)', padding: '1rem', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Monto total a pagar: </span>
                  <span style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--gold)' }}>{format(total)}</span>
                </div>
              )}

              <button onClick={() => setStep('confirm')} style={{ background: 'var(--gold)', border: 'none', borderRadius: 'var(--radius-pill)', padding: '0.875rem', color: '#0a0a0f', fontWeight: '500', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                Ya realicé el pago <ChevronRight size={16} />
              </button>

              <button onClick={() => setStep('payment')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.825rem', cursor: 'pointer', textAlign: 'center' }}>
                ← Cambiar método de pago
              </button>
            </div>
          )}

          {/* STEP: SUBIR COMPROBANTE */}
          {step === 'confirm' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem', lineHeight: 1.7 }}>
                Sube una captura de pantalla del mensaje de confirmación que te envió <strong style={{ color: 'var(--text)' }}>{payMethod === 'transfermovil' ? 'Transfermóvil' : 'ENZONA'}</strong> al realizar la transferencia.
              </p>

              {/* Resumen del pedido */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                  Resumen del pedido
                </div>
                {cart.map(s => (
                  <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>{s.title}</span>
                    <span style={{ color: 'var(--text)', flexShrink: 0 }}>{format(s.price)}</span>
                  </div>
                ))}
                <div style={{ borderTop: '0.5px solid var(--border)', marginTop: '0.5rem', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.825rem', fontWeight: '600' }}>Total</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--gold)' }}>{format(total)}</span>
                </div>
              </div>

              {/* Subir comprobante */}
              <label style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: '0.5rem', padding: '1.5rem',
                background: receipt ? 'rgba(201,168,76,0.06)' : 'rgba(255,255,255,0.02)',
                border: `0.5px dashed ${receipt ? 'rgba(201,168,76,0.4)' : 'var(--border)'}`,
                borderRadius: 'var(--radius)', cursor: 'pointer', transition: 'all 0.2s',
              }}>
                {receiptPreview ? (
                  <img src={receiptPreview} alt="Comprobante" style={{ maxHeight: '160px', borderRadius: '8px', objectFit: 'contain' }} />
                ) : (
                  <>
                    <Upload size={24} color="var(--text-muted)" />
                    <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Subir captura de pantalla</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>JPG, PNG — máx. 5MB</span>
                  </>
                )}
                <input type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => e.target.files[0] && handleReceiptFile(e.target.files[0])} />
              </label>

              <button onClick={handleSubmit} disabled={!receipt || uploading} style={{
                background: 'var(--gold)', border: 'none', borderRadius: 'var(--radius-pill)',
                padding: '0.875rem', color: '#0a0a0f', fontWeight: '500', fontSize: '0.9rem',
                cursor: !receipt || uploading ? 'not-allowed' : 'pointer',
                opacity: !receipt || uploading ? 0.6 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              }}>
                {uploading ? 'Enviando...' : 'Enviar solicitud de compra'}
              </button>

              <button onClick={() => setStep('method')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.825rem', cursor: 'pointer', textAlign: 'center' }}>
                ← Volver
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}