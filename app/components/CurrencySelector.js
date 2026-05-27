'use client'

import { useState, useEffect, createContext, useContext } from 'react'

const CURRENCIES = {
  MN:  { label: 'MN',  name: 'Peso Cubano',      symbol: '$',  rate: 1 },
  USD: { label: 'USD', name: 'Dólar',             symbol: 'US$', rate: 0.04 },
  EUR: { label: 'EUR', name: 'Euro',              symbol: '€',  rate: 0.037 },
  GBP: { label: 'GBP', name: 'Libra Esterlina',  symbol: '£',  rate: 0.032 },
  MXN: { label: 'MXN', name: 'Peso Mexicano',    symbol: 'MX$', rate: 0.68 },
}

const CurrencyContext = createContext({
  currency: 'MN',
  setCurrency: () => {},
  convert: (price) => price,
  format: (price) => price,
  currencies: CURRENCIES,
})

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState('MN')

  const convert = (priceMN) => {
    const rate = CURRENCIES[currency]?.rate || 1
    return priceMN * rate
  }

  const format = (priceMN) => {
    const cur = CURRENCIES[currency]
    if (!cur) return `$${priceMN}`
    const converted = priceMN * cur.rate
    return `${cur.symbol}${converted % 1 === 0 ? converted : converted.toFixed(2)}`
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, convert, format, currencies: CURRENCIES }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export const useCurrency = () => useContext(CurrencyContext)

export default function CurrencySelector() {
  const { currency, setCurrency, currencies } = useCurrency()
  const [open, setOpen] = useState(false)

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} style={{
        background: 'rgba(255,255,255,0.04)',
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-pill)',
        padding: '0.4rem 0.875rem',
        color: 'var(--text-muted)',
        fontSize: '0.78rem',
        display: 'flex', alignItems: 'center', gap: '0.35rem',
        cursor: 'pointer', transition: 'all 0.2s',
      }}>
        💱 {currency}
        <span style={{ fontSize: '0.6rem', opacity: 0.6 }}>▼</span>
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 98 }} />
          <div style={{
            position: 'absolute', top: 'calc(100% + 0.5rem)', right: 0,
            background: '#111118',
            border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '0.5rem',
            zIndex: 99, minWidth: '180px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}>
            {Object.entries(currencies).map(([key, cur]) => (
              <button key={key} onClick={() => { setCurrency(key); setOpen(false) }} style={{
                width: '100%', textAlign: 'left',
                background: currency === key ? 'rgba(201,168,76,0.08)' : 'transparent',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: '0.5rem 0.75rem',
                color: currency === key ? 'var(--gold)' : 'var(--text-muted)',
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                transition: 'all 0.15s',
              }}>
                <span>{cur.symbol} {cur.label}</span>
                <span style={{ fontSize: '0.72rem', opacity: 0.5 }}>{cur.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}