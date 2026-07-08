import { useState, useRef, useCallback } from 'react'
import { api } from '../api'

/* ── Feature 1: Leaf Disease Diagnostics ─────────────────────── */
export default function DiagnosticsTab() {
  const [imageFile,    setImageFile]    = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [dragOver,     setDragOver]     = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [result,       setResult]       = useState(null)
  const [error,        setError]        = useState(null)
  const fileRef = useRef(null)

  /* ── File ingestion ──────────────────────────────────────── */
  const ingestFile = useCallback((file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (JPG, PNG, WebP).')
      return
    }
    setImageFile(file)
    setResult(null)
    setError(null)
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result)
    reader.readAsDataURL(file)
  }, [])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    ingestFile(e.dataTransfer.files[0])
  }, [ingestFile])

  const onDragOver  = useCallback((e) => { e.preventDefault(); setDragOver(true);  }, [])
  const onDragLeave = useCallback(() => setDragOver(false), [])
  const onFileInput = (e) => ingestFile(e.target.files[0])

  /* ── Diagnose action ─────────────────────────────────────── */
  const handleDiagnose = async () => {
    if (!imagePreview || !imageFile) return
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      // imagePreview is already a data URL — strip the prefix to get raw base64
      const b64 = imagePreview.split(',')[1]
      const { data } = await api.post('/api/diagnose', {
        image_b64: b64,
        mime_type: imageFile.type,
      })
      setResult(data)
    } catch (err) {
      setError(
        err.response?.data?.detail
        || err.message
        || 'Diagnosis request failed. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  const clearImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setResult(null)
    setError(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  /* ── Helpers ─────────────────────────────────────────────── */
  const severityClass = (s = '') => {
    const k = s.trim().toLowerCase()
    if (k === 'low')      return 'badge badge-low'
    if (k === 'moderate') return 'badge badge-moderate'
    if (k === 'high')     return 'badge badge-high'
    if (k === 'critical') return 'badge badge-critical'
    return 'badge badge-moderate'
  }

  const confidencePct = result
    ? Math.min(100, parseInt(result.confidence?.replace(/[^0-9]/g, '') || '0', 10))
    : 0

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <div className="stack">

      {/* Upload / Preview card */}
      <div className="card">
        <h2 className="card-title">
          <LeafIcon /> Leaf Disease Diagnostics
        </h2>
        <p className="card-desc">
          Upload a clear photo of a crop leaf. Supports Apple, Corn, Grape, Pepper, Potato, and Tomato.
          The AI will classify the disease, assess severity, and map treatment pathways.
        </p>

        {!imagePreview ? (
          /* Drag & drop zone */
          <div
            id="upload-zone"
            className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => fileRef.current?.click()}
            role="button"
            tabIndex={0}
            aria-label="Upload leaf image"
            onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={onFileInput}
              id="leaf-file-input"
            />
            <span className="upload-zone-icon" aria-hidden="true">🌿</span>
            <p className="upload-zone-title">Drop a leaf image here</p>
            <p className="upload-zone-hint">or click to browse — JPG, PNG, WebP up to 10 MB</p>
          </div>
        ) : (
          /* Image preview row */
          <div className="preview-row">
            <img
              src={imagePreview}
              alt="Uploaded leaf preview"
              className="preview-img"
            />
            <div className="preview-meta">
              <div>
                <p className="preview-filename">{imageFile?.name}</p>
                <p className="preview-filesize">
                  {(imageFile?.size / 1024).toFixed(0)} KB &mdash; {imageFile?.type}
                </p>
              </div>
              <button
                id="btn-diagnose"
                className="btn-primary"
                onClick={handleDiagnose}
                disabled={loading}
              >
                {loading ? 'Analysing...' : 'Run Diagnostics'}
              </button>
              <button
                id="btn-clear-image"
                className="btn-ghost"
                onClick={clearImage}
              >
                Clear Image
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="card">
          <div className="loading-box">
            <div className="spinner" role="status" aria-label="Analysing" />
            <p className="loading-text">
              CropCare AI is analysing leaf pathology with Gemini 2.5 Flash&hellip;
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="error-box" role="alert">{error}</div>
      )}

      {/* Diagnostic Report */}
      {result && !loading && (
        <div className="card" role="region" aria-label="Diagnostic report">

          {/* Header */}
          <div className="diag-header">
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-ghost)', marginBottom: 4, letterSpacing: '.1em', textTransform: 'uppercase' }}>
                Detected Disease
              </div>
              <h3 className="diag-disease">{result.disease || 'Unknown'}</h3>
              <p className="diag-crop">Crop: <strong>{result.crop || 'Unknown'}</strong></p>
            </div>
            <span className={severityClass(result.severity)}>
              {result.severity || 'Unknown'} Severity
            </span>
          </div>

          {/* Confidence bar */}
          <div className="section-label">Confidence</div>
          <div>
            <div className="conf-header">
              <span>Detection Confidence</span>
              <span>{result.confidence}</span>
            </div>
            <div className="conf-track" role="progressbar" aria-valuenow={confidencePct} aria-valuemin={0} aria-valuemax={100}>
              <div className="conf-fill" style={{ width: `${confidencePct}%` }} />
            </div>
          </div>

          <div className="divider" />

          {/* Treatment steps */}
          <div className="section-label">Treatment Pathway</div>
          <ul className="treatment-list">
            {(result.treatment || []).map((step, i) => (
              <li key={i} className="treatment-item">
                <div className="treatment-num" aria-hidden="true">{i + 1}</div>
                <p className="treatment-text">{step}</p>
              </li>
            ))}
          </ul>

          {/* Reasoning */}
          {result.reasoning && (
            <>
              <div className="divider" />
              <div className="section-label">AI Reasoning</div>
              <div className="reasoning-block">{result.reasoning}</div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function LeafIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
    </svg>
  )
}
