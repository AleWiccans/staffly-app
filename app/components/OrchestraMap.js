'use client'

import { useRef, useState } from 'react'

const COLORS = {
  strings:    'rgba(201,168,76,1)',
  woodwinds:  'rgba(100,180,220,1)',
  brass:      'rgba(210,140,70,1)',
  percussion: 'rgba(160,100,220,1)',
}

// Keywords que identifican cada sección específica
const SECTION_KEYWORDS = {
  violines:    ['violín', 'violin', 'violines'],
  violas:      ['viola'],
  chelos:      ['violonchelo', 'cello', 'chelo', 'violoncello'],
  contrabajos: ['contrabajo', 'double bass', 'contrabass'],
  arpa:        ['arpa', 'harp'],
  piano:       ['piano', 'celesta', 'clavecín', 'harpsichord', 'órgano', 'organ'],
  flautas:     ['flauta', 'flute', 'flautín', 'piccolo'],
  oboes:       ['oboe', 'corno inglés', 'english horn', 'heckelphone'],
  clarinetes:  ['clarinete', 'clarinet', 'basset'],
  fagotes:     ['fagot', 'bassoon', 'contrafagot'],
  trompas:     ['trompa', 'horn', 'corno'],
  trompetas:   ['trompeta', 'trumpet', 'corneta', 'cornet', 'fliscorno', 'flugelhorn'],
  trombones:   ['trombón', 'trombone', 'tuba', 'cimbasso', 'eufonio', 'euphonium'],
  percusion:   ['timbal', 'timpani', 'bombo', 'bass drum', 'caja', 'snare', 'xilófono', 'xylophone',
                'marimba', 'vibráfono', 'vibraphone', 'campana', 'glockenspiel', 'triángulo',
                'triangle', 'platillo', 'cymbal', 'tam-tam', 'pandereta', 'tambourine',
                'maracas', 'claves', 'güiro', 'cencerro', 'drum kit', 'batería'],
}

const getInstrumentsForSection = (sectionId, instruments) => {
  const keywords = SECTION_KEYWORDS[sectionId] || []
  if (keywords.length === 0) return []
  return instruments.filter(inst => {
    const name = inst.name.toLowerCase()
    return keywords.some(kw => name.includes(kw))
  }).map(i => i.name)
}

const PATHS = {
  arpa:        "M 260 450 A 140 140 0 0 1 268.40 402.12 L 212.00 381.60 A 200 200 0 0 0 200 450 Z",
  piano:       "M 200 450 A 200 200 0 0 1 212.00 381.60 L 155.60 361.08 A 260 260 0 0 0 140 450 Z",
  violines:    "M 340 450 A 60 60 0 0 1 379.48 393.60 L 352.12 318.40 A 140 140 0 0 0 260 450 Z",
  violas:      "M 379.48 393.60 A 60 60 0 0 1 420.52 393.60 L 447.88 318.40 A 140 140 0 0 0 352.12 318.40 Z",
  chelos:      "M 420.52 393.60 A 60 60 0 0 1 456.40 429.48 L 531.60 402.12 A 140 140 0 0 0 447.88 318.40 Z",
  contrabajos: "M 456.40 429.48 A 60 60 0 0 1 460 450 L 540 450 A 140 140 0 0 0 531.60 402.12 Z",
  flautas:     "M 268.40 402.12 A 140 140 0 0 1 400 310 L 400 250 A 200 200 0 0 0 212.00 381.60 Z",
  oboes:       "M 400 310 A 140 140 0 0 1 531.60 402.12 L 588.00 381.60 A 200 200 0 0 0 400 250 Z",
  clarinetes:  "M 212.00 381.60 A 200 200 0 0 1 400 250 L 400 190 A 260 260 0 0 0 155.60 361.08 Z",
  fagotes:     "M 400 250 A 200 200 0 0 1 588.00 381.60 L 644.40 361.08 A 260 260 0 0 0 400 190 Z",
  trompas:     "M 155.60 361.08 A 260 260 0 0 1 354.76 193.90 L 344.32 134.80 A 320 320 0 0 0 99.20 340.56 Z",
  trompetas:   "M 354.76 193.90 A 260 260 0 0 1 567.18 250.84 L 605.76 204.88 A 320 320 0 0 0 344.32 134.80 Z",
  trombones:   "M 567.18 250.84 A 260 260 0 0 1 660 450 L 720 450 A 320 320 0 0 0 605.76 204.88 Z",
  perc_l:      "M 80 450 A 320 320 0 0 1 111.68 311.12 L 57.62 285.08 A 380 380 0 0 0 20 450 Z",
  perc_c:      "M 111.68 311.12 A 320 320 0 0 1 200.64 199.76 L 163.26 152.84 A 380 380 0 0 0 57.62 285.08 Z",
  perc_cc:     "M 200.64 199.76 A 320 320 0 0 1 328.64 138.00 L 315.26 79.50 A 380 380 0 0 0 163.26 152.84 Z",
  perc_mid:    "M 328.64 138.00 A 320 320 0 0 1 471.36 138.00 L 484.74 79.50 A 380 380 0 0 0 315.26 79.50 Z",
  perc_cr:     "M 471.36 138.00 A 320 320 0 0 1 599.36 199.76 L 636.74 152.84 A 380 380 0 0 0 484.74 79.50 Z",
  perc_r:      "M 599.36 199.76 A 320 320 0 0 1 688.32 311.12 L 742.38 285.08 A 380 380 0 0 0 636.74 152.84 Z",
  perc_rr:     "M 688.32 311.12 A 320 320 0 0 1 720 450 L 780 450 A 380 380 0 0 0 742.38 285.08 Z",
}

const SECTIONS = [
  { id: 'arpa',        type: 'strings',    label: 'CUERDAS',     labelX: 234,  labelY: 420, rotate: -15 },
  { id: 'piano',       type: 'strings',    label: 'CUERDAS',     labelX: 174,  labelY: 415, rotate: -15 },
  { id: 'violines',    type: 'strings',    label: 'CUERDAS',     labelX: 308,  labelY: 386, rotate: 0 },
  { id: 'violas',      type: 'strings',    label: 'CUERDAS',     labelX: 400,  labelY: 356, rotate: 0 },
  { id: 'chelos',      type: 'strings',    label: 'CUERDAS',     labelX: 484,  labelY: 376, rotate: 0,  small: true },
  { id: 'contrabajos', type: 'strings',    label: 'CUERDAS',     labelX: 502,  labelY: 428, rotate: 15, small: true },
  { id: 'flautas',     type: 'woodwinds',  label: 'VTO. MADERA', labelX: 304,  labelY: 320, rotate: 0 },
  { id: 'oboes',       type: 'woodwinds',  label: 'VTO. MADERA', labelX: 494,  labelY: 320, rotate: 0 },
  { id: 'clarinetes',  type: 'woodwinds',  label: 'VTO. MADERA', labelX: 274,  labelY: 268, rotate: 0 },
  { id: 'fagotes',     type: 'woodwinds',  label: 'VTO. MADERA', labelX: 522,  labelY: 268, rotate: 0 },
  { id: 'trompas',     type: 'brass',      label: 'VTO. METAL',  labelX: 216,  labelY: 228, rotate: 0 },
  { id: 'trompetas',   type: 'brass',      label: 'VTO. METAL',  labelX: 466,  labelY: 185, rotate: 0 },
  { id: 'trombones',   type: 'brass',      label: 'VTO. METAL',  labelX: 641,  labelY: 318, rotate: 35, small: true },
  { id: 'percusion',   type: 'percussion', label: 'PERCUSIÓN',   labelX: 58,   labelY: 375, rotate: -65, small: true, path: 'perc_l' },
  { id: 'percusion',   type: 'percussion', label: 'PERCUSIÓN',   labelX: 128,  labelY: 238, rotate: -40, small: true, path: 'perc_c' },
  { id: 'percusion',   type: 'percussion', label: 'PERCUSIÓN',   labelX: 244,  labelY: 136, rotate: -15, small: true, path: 'perc_cc' },
  { id: 'percusion',   type: 'percussion', label: 'PERCUSIÓN',   labelX: 400,  labelY: 110, rotate: 0,   path: 'perc_mid' },
  { id: 'percusion',   type: 'percussion', label: 'PERCUSIÓN',   labelX: 549,  labelY: 136, rotate: 15,  small: true, path: 'perc_cr' },
  { id: 'percusion',   type: 'percussion', label: 'PERCUSIÓN',   labelX: 670,  labelY: 238, rotate: 40,  small: true, path: 'perc_r' },
  { id: 'percusion',   type: 'percussion', label: 'PERCUSIÓN',   labelX: 733,  labelY: 375, rotate: 65,  small: true, path: 'perc_rr' },
]

export default function OrchestraMap({ instruments = [] }) {
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, title: '', color: '', items: [] })
  const wrapRef = useRef(null)

  const fillColor = (type, hover = false) => {
    const alpha = hover ? 0.45 : 0.18
    const map = {
      strings:    `rgba(201,168,76,${alpha})`,
      woodwinds:  `rgba(100,180,220,${alpha})`,
      brass:      `rgba(210,140,70,${alpha})`,
      percussion: `rgba(160,100,220,${alpha})`,
    }
    return map[type] || `rgba(255,255,255,${alpha})`
  }

  const labelColor = {
    strings:    'rgba(201,168,76,0.85)',
    woodwinds:  'rgba(100,180,220,0.85)',
    brass:      'rgba(210,140,70,0.85)',
    percussion: 'rgba(160,100,220,0.85)',
  }

  const handleEnter = (e, sec) => {
    const instr = getInstrumentsForSection(sec.id, instruments)
    const r = wrapRef.current.getBoundingClientRect()
    let x = e.clientX - r.left + 14
    let y = e.clientY - r.top - 14
    if (x + 230 > r.width) x = e.clientX - r.left - 244
    if (y < 8) y = 8
    setTooltip({ visible: true, x, y, title: sec.label, color: COLORS[sec.type], items: instr })
  }

  const handleMove = (e) => {
    if (!tooltip.visible) return
    const r = wrapRef.current.getBoundingClientRect()
    let x = e.clientX - r.left + 14
    let y = e.clientY - r.top - 14
    if (x + 230 > r.width) x = e.clientX - r.left - 244
    if (y < 8) y = 8
    setTooltip(prev => ({ ...prev, x, y }))
  }

  const handleLeave = () => setTooltip(prev => ({ ...prev, visible: false }))

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%', maxWidth: '720px', margin: '0 auto' }}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%"
        style={{ background: '#0a0a0f', borderRadius: '14px', display: 'block' }}>

        {/* Director */}
        <g>
          <path d="M 360 450 A 40 40 0 0 1 440 450 Z"
            fill="#1a1a2e" stroke="rgba(201,168,76,0.35)" strokeWidth="1"/>
          <text x="400" y="435" fill="rgba(201,168,76,0.6)"
            fontSize="7" fontFamily="DM Sans,sans-serif"
            textAnchor="middle" dominantBaseline="middle"
            letterSpacing="0.8" style={{ pointerEvents: 'none', textTransform: 'uppercase' }}>
            DIR.
          </text>
        </g>

        {/* Secciones */}
        {SECTIONS.map((sec, i) => {
          const pathKey = sec.path || sec.id
          const instr = getInstrumentsForSection(sec.id, instruments)
          const hasInstr = instr.length > 0
          return (
            <g key={i}
              onMouseEnter={e => handleEnter(e, sec)}
              onMouseMove={handleMove}
              onMouseLeave={handleLeave}
              style={{ cursor: 'pointer' }}
            >
              <path
                d={PATHS[pathKey]}
                fill={fillColor(sec.type)}
                stroke="rgba(10,10,15,0.95)"
                strokeWidth="2"
                opacity={hasInstr ? 1 : 0.35}
                style={{ transition: 'fill 0.25s, opacity 0.25s' }}
                onMouseEnter={e => e.currentTarget.style.fill = fillColor(sec.type, true)}
                onMouseLeave={e => e.currentTarget.style.fill = fillColor(sec.type)}
              />
            </g>
          )
        })}

        {/* Etiquetas de familia — una sola por zona, sin repetir */}
        {[
          { label: 'CUERDAS',     x: 308, y: 386, rotate: 0,   color: 'rgba(201,168,76,0.7)',    size: 9 },
          { label: 'ARPA',        x: 234, y: 420, rotate: -15, color: 'rgba(201,168,76,0.7)',    size: 8 },
          { label: 'TECLADOS',    x: 174, y: 415, rotate: -15, color: 'rgba(201,168,76,0.7)',    size: 8 },
          { label: 'VIOLAS',      x: 400, y: 356, rotate: 0,   color: 'rgba(201,168,76,0.7)',    size: 9 },
          { label: 'CHELOS',      x: 484, y: 376, rotate: 0,   color: 'rgba(201,168,76,0.7)',    size: 8 },
          { label: 'CBAJOS',      x: 502, y: 432, rotate: 15,  color: 'rgba(201,168,76,0.7)',    size: 7.5 },
          { label: 'FLAUTAS',     x: 304, y: 320, rotate: 0,   color: 'rgba(100,180,220,0.75)',  size: 9 },
          { label: 'OBOES',       x: 494, y: 320, rotate: 0,   color: 'rgba(100,180,220,0.75)',  size: 9 },
          { label: 'CLARINETES',  x: 274, y: 268, rotate: 0,   color: 'rgba(100,180,220,0.75)',  size: 8.5 },
          { label: 'FAGOTES',     x: 522, y: 268, rotate: 0,   color: 'rgba(100,180,220,0.75)',  size: 9 },
          { label: 'TROMPAS',     x: 216, y: 228, rotate: 0,   color: 'rgba(210,140,70,0.8)',    size: 9 },
          { label: 'TROMPETAS',   x: 466, y: 185, rotate: 0,   color: 'rgba(210,140,70,0.8)',    size: 9 },
          { label: 'TROMBS/TUBA', x: 641, y: 318, rotate: 35,  color: 'rgba(210,140,70,0.8)',    size: 7.5 },
          { label: 'PERCUSIÓN',   x: 400, y: 110, rotate: 0,   color: 'rgba(160,100,220,0.8)',   size: 9 },
        ].map((lbl, i) => (
          <text key={i}
            x={lbl.x} y={lbl.y}
            fill={lbl.color}
            fontSize={lbl.size}
            fontFamily="DM Sans,sans-serif"
            textAnchor="middle" dominantBaseline="middle"
            letterSpacing="0.6"
            fontWeight="600"
            transform={lbl.rotate ? `rotate(${lbl.rotate},${lbl.x},${lbl.y})` : undefined}
            style={{ pointerEvents: 'none', textTransform: 'uppercase' }}
          >
            {lbl.label}
          </text>
        ))}
      </svg>

      {/* Tooltip */}
      {tooltip.visible && (
        <div style={{
          position: 'absolute', left: tooltip.x, top: tooltip.y,
          background: '#0f0f1a',
          border: '0.5px solid rgba(255,255,255,0.12)',
          borderRadius: '10px', padding: '0.65rem 0.9rem',
          pointerEvents: 'none', minWidth: '140px', maxWidth: '220px', zIndex: 99,
        }}>
          <div style={{
            fontSize: '0.68rem', fontWeight: 600,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            marginBottom: '0.4rem', color: tooltip.color,
            fontFamily: 'DM Sans, sans-serif',
          }}>
            {tooltip.title}
          </div>
          {tooltip.items.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.22rem' }}>
              {tooltip.items.map((inst, i) => (
                <span key={i} style={{
                  fontSize: '0.65rem',
                  background: 'rgba(255,255,255,0.06)',
                  border: '0.5px solid rgba(255,255,255,0.1)',
                  color: 'rgba(230,225,215,0.75)',
                  padding: '0.1rem 0.42rem', borderRadius: '2rem',
                  fontFamily: 'DM Sans, sans-serif',
                }}>{inst}</span>
              ))}
            </div>
          ) : (
            <span style={{ fontSize: '0.7rem', color: 'rgba(240,237,230,0.3)', fontStyle: 'italic', fontFamily: 'DM Sans, sans-serif' }}>
              No hay instrumentos en esta sección
            </span>
          )}
        </div>
      )}
    </div>
  )
}