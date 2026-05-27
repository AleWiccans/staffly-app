'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import Color from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import BulletList from '@tiptap/extension-bullet-list'
import ListItem from '@tiptap/extension-list-item'
import { useEffect } from 'react'

const ToolbarButton = ({ onClick, active, children, title }) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    style={{
      background: active ? 'rgba(201,168,76,0.2)' : 'transparent',
      border: `0.5px solid ${active ? 'rgba(201,168,76,0.5)' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: '6px',
      color: active ? 'var(--gold)' : 'rgba(240,237,230,0.7)',
      width: '30px', height: '30px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600',
      transition: 'all 0.15s', flexShrink: 0,
    }}
  >
    {children}
  </button>
)

const COLORS = [
  '#f0ede6', '#c9a84c', '#7eb8d4', '#e8845a',
  '#b17adc', '#68c99a', '#ff5050', '#ffffff',
]

export default function RichTextEditor({ value, onChange, placeholder }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ bulletList: false, listItem: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Underline,
      TextStyle,
      Color,
      BulletList,
      ListItem,
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
    editorProps: {
      attributes: {
        style: 'outline:none; min-height:140px; padding:0.75rem; font-size:0.875rem; line-height:1.7; color:rgba(240,237,230,0.85); font-family:DM Sans,sans-serif;',
      },
    },
  })

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '')
    }
  }, [value])

  if (!editor) return null

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius-sm)',
      overflow: 'hidden',
    }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '0.25rem',
        padding: '0.5rem 0.75rem',
        borderBottom: '0.5px solid var(--border)',
        background: 'rgba(0,0,0,0.2)',
      }}>

        {/* Tamaño */}
        <ToolbarButton title="Título grande" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })}>H2</ToolbarButton>
        <ToolbarButton title="Título pequeño" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })}>H3</ToolbarButton>

        <div style={{ width: '0.5px', background: 'var(--border)', margin: '0 0.25rem' }} />

        {/* Formato */}
        <ToolbarButton title="Negrita" onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')}><strong>B</strong></ToolbarButton>
        <ToolbarButton title="Cursiva" onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')}><em>I</em></ToolbarButton>
        <ToolbarButton title="Subrayado" onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')}><span style={{ textDecoration: 'underline' }}>U</span></ToolbarButton>
        <ToolbarButton title="Tachado" onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')}><span style={{ textDecoration: 'line-through' }}>S</span></ToolbarButton>

        <div style={{ width: '0.5px', background: 'var(--border)', margin: '0 0.25rem' }} />

        {/* Alineación */}
        <ToolbarButton title="Izquierda" onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })}>≡</ToolbarButton>
        <ToolbarButton title="Centrar" onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })}>≡</ToolbarButton>
        <ToolbarButton title="Derecha" onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })}>≡</ToolbarButton>
        <ToolbarButton title="Justificar" onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })}>≡</ToolbarButton>

        <div style={{ width: '0.5px', background: 'var(--border)', margin: '0 0.25rem' }} />

        {/* Viñetas */}
        <ToolbarButton title="Lista con viñetas" onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')}>•≡</ToolbarButton>
        <ToolbarButton title="Lista numerada" onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')}>1≡</ToolbarButton>

        <div style={{ width: '0.5px', background: 'var(--border)', margin: '0 0.25rem' }} />

        {/* Colores */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
          {COLORS.map(color => (
            <button
              key={color}
              type="button"
              title={`Color ${color}`}
              onClick={() => editor.chain().focus().setColor(color).run()}
              style={{
                width: '18px', height: '18px', borderRadius: '50%',
                background: color, border: '1.5px solid rgba(255,255,255,0.15)',
                cursor: 'pointer', transition: 'transform 0.15s', flexShrink: 0,
                padding: 0,
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            />
          ))}
        </div>

        <div style={{ width: '0.5px', background: 'var(--border)', margin: '0 0.25rem' }} />

        {/* Limpiar formato */}
        <ToolbarButton title="Limpiar formato" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>✕</ToolbarButton>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />

      {/* Placeholder manual */}
      {editor.isEmpty && (
        <div style={{
          position: 'absolute', top: '3.5rem', left: '0.75rem',
          color: 'rgba(240,237,230,0.25)', fontSize: '0.875rem',
          pointerEvents: 'none', fontFamily: 'DM Sans,sans-serif',
        }}>
          {placeholder}
        </div>
      )}

      {/* Estilos del contenido */}
      <style>{`
        .ProseMirror h2 { font-size: 1.25rem; font-weight: 700; margin: 0.75rem 0 0.4rem; color: rgba(240,237,230,0.95); font-family: 'Playfair Display', serif; }
        .ProseMirror h3 { font-size: 1rem; font-weight: 600; margin: 0.6rem 0 0.3rem; color: rgba(240,237,230,0.9); }
        .ProseMirror p { margin: 0 0 0.5rem; }
        .ProseMirror ul { padding-left: 1.25rem; margin: 0.4rem 0; }
        .ProseMirror ol { padding-left: 1.25rem; margin: 0.4rem 0; }
        .ProseMirror li { margin-bottom: 0.2rem; }
        .ProseMirror strong { font-weight: 700; }
        .ProseMirror em { font-style: italic; }
        .ProseMirror u { text-decoration: underline; }
        .ProseMirror s { text-decoration: line-through; }
        .ProseMirror:focus { outline: none; }
      `}</style>
    </div>
  )
}