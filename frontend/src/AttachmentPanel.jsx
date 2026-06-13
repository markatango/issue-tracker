import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { uploadAttachment, deleteAttachment, viewAttachment, downloadAttachment } from './api'
import { Btn } from './components'

const ICON = {
  image: '🖼',
  pdf: '📄',
  text: '📝',
  zip: '🗜',
  default: '📎',
}

function fileIcon(mime = '') {
  if (mime.startsWith('image/')) return ICON.image
  if (mime === 'application/pdf') return ICON.pdf
  if (mime.startsWith('text/')) return ICON.text
  if (mime.includes('zip') || mime.includes('tar')) return ICON.zip
  return ICON.default
}

function fmtSize(n) {
  if (n < 1024) return n + ' B'
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB'
  return (n / 1024 / 1024).toFixed(1) + ' MB'
}

function isImage(mime = '') { return mime.startsWith('image/') }

export default function AttachmentPanel({ issueId, attachments, onUpdate }) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(null)

  const onDrop = useCallback(async (files) => {
    setUploading(true)
    try {
      for (const file of files) {
        await uploadAttachment(issueId, file)
      }
      onUpdate()
    } catch (e) {
      alert('Upload failed: ' + (e.response?.data?.error || e.message))
    } finally {
      setUploading(false)
    }
  }, [issueId, onUpdate])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 32 * 1024 * 1024,
  })

  const remove = async (id) => {
    if (!confirm('Delete this attachment?')) return
    await deleteAttachment(id)
    onUpdate()
  }

  return (
    <div>
      {/* dropzone */}
      <div
        {...getRootProps()}
        style={{
          border: `1px dashed ${isDragActive ? 'var(--accent)' : 'var(--border-bright)'}`,
          borderRadius: 'var(--radius)',
          padding: '16px',
          textAlign: 'center',
          color: isDragActive ? 'var(--accent)' : 'var(--text2)',
          background: isDragActive ? 'var(--accent-glow)' : 'var(--bg2)',
          cursor: 'pointer',
          transition: 'all 0.15s',
          marginBottom: 12,
          fontSize: 13,
        }}
      >
        <input {...getInputProps()} />
        {uploading
          ? '⏳ Uploading...'
          : isDragActive
          ? '⬇ Drop files here'
          : '📎 Drop files here, or click to browse (max 32 MB each)'}
      </div>

      {/* file list */}
      {attachments.length === 0 && (
        <p style={{ color: 'var(--text3)', fontSize: 12, fontStyle: 'italic' }}>No attachments yet.</p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {attachments.map(att => (
          <div key={att.id} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '7px 10px',
          }}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>{fileIcon(att.mime_type)}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text0)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {att.filename}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                {fmtSize(att.size)} · {new Date(att.uploaded_at).toLocaleString()}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
              {isImage(att.mime_type) && (
                <Btn variant="ghost" style={{ fontSize: 12 }} onClick={() => setPreview(att)}>preview</Btn>
              )}
              <a href={downloadAttachment(att.id)} target="_blank" rel="noreferrer">
                <Btn variant="ghost" style={{ fontSize: 12 }}>download</Btn>
              </a>
              <Btn variant="ghost" style={{ fontSize: 12, color: 'var(--red)' }} onClick={() => remove(att.id)}>×</Btn>
            </div>
          </div>
        ))}
      </div>

      {/* image preview modal */}
      {preview && (
        <div
          onClick={() => setPreview(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, cursor: 'zoom-out',
          }}
        >
          <img
            src={viewAttachment(preview.id)}
            alt={preview.filename}
            style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 'var(--radius)', boxShadow: '0 0 40px #000' }}
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
