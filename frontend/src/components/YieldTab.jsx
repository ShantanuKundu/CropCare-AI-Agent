import { useState } from 'react'
import axios from 'axios'

const CROPS = [
  'Wheat', 'Rice', 'Cotton', 'Sugarcane', 'Maize',
  'Soybean', 'Tomato', 'Potato', 'Onion', 'Barley',
]

const SEASONS = ['Kharif', 'Rabi', 'Zaid', 'Year-Round']

const CONF_COLOR = {
  Low:    'var(--conf-low)',
  Medium: 'var(--conf-medium)',
  High:   'var(--conf-high)',
}

/* ── Feature 3: Crop Yield Predictor ─────────────────────────── */
export default function YieldTab() {
  const [crop,    setCrop]    = useState('Wheat')
  const [areaHa,  setAreaHa]  = useState('')
  const [season,  setSeason]  = useState('Rabi')
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState(null)
  const [error,   setError]   = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const area = parseFloat(areaHa)
    if (!area || area <= 0) {
      setError('Please enter a valid positive area in hectares.')
      return
    }
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const { data } = await axios.post('/api/predict-yield', {
        crop,
        area_ha: area,
        season,
      }, { timeout: 60_000 })
      setResult(data)
    } catch (err) {
      setError(
        err.response?.data?.detail
        || err.message
        || 'Yield prediction request failed. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  const yieldNum   = result?.estimated_yield_mt
  const perHaNum   = result?.yield_per_ha
  const confidence = result?.confidence || 'Medium'
  const confColor  = CONF_COLOR[confidence] || CONF_COLOR.Medium

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <div className="stack">

      {/* Input form */}
      <div className="card">
        <h2 className="card-title">
          <ChartIcon /> Crop Yield Predictor
        </h2>
        <p className="card-desc">
          Enter your farm parameters to receive a step-by-step AI yield estimate based on
          national agronomic benchmarks and seasonal adjustment factors.
        </p>

        <form id="yield-form" onSubmit={handleSubmit} noValidate>
          <div className="grid-3" style={{ marginBottom: 22 }}>

            {/* Area input */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="area-input" className="form-label">Farm Area (hectares)</label>
              <input
                id="area-input"
                type="number"
                className="form-input"
                placeholder="e.g. 5.0"
                value={areaHa}
                onChange={e => setAreaHa(e.target.value)}
                min="0.1"
                step="0.1"
                required
              />
            </div>

            {/* Crop selector */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="crop-select" className="form-label">Crop Type</label>
              <select
                id="crop-select"
                className="form-select"
                value={crop}
                onChange={e => setCrop(e.target.value)}
              >
                {CROPS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Season selector */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="season-select" className="form-label">Growing Season</label>
              <select
                id="season-select"
                className="form-select"
                value={season}
                onChange={e => setSeason(e.target.value)}
              >
                {SEASONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <button
            id="btn-predict"
            type="submit"
            className="btn-primary"
            disabled={loading || !areaHa}
          >
            {loading ? 'Calculating...' : 'Predict Yield'}
          </button>
        </form>
      </div>

      {/* Loading */}
      {loading && (
        <div className="card">
          <div className="loading-box">
            <div className="spinner" role="status" aria-label="Calculating" />
            <p className="loading-text">
              Reasoning through agronomic benchmarks for {crop} ({season})&hellip;
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="error-box" role="alert">{error}</div>
      )}

      {/* Yield Result Card */}
      {result && !loading && (
        <div
          className="yield-hero"
          role="region"
          aria-label="Yield prediction result"
        >
          {/* Crop + season tag */}
          <div className="yield-crop-tag">
            {result.crop || crop} &mdash; {result.season || season}
          </div>

          {/* Primary metric */}
          <div
            className="yield-number"
            aria-label={`${typeof yieldNum === 'number' ? yieldNum.toFixed(1) : '--'} metric tons estimated`}
          >
            {typeof yieldNum === 'number' ? yieldNum.toFixed(1) : '--'}
          </div>
          <div className="yield-unit">metric tons estimated</div>

          {/* Meta grid */}
          <div className="yield-meta-grid" role="list">
            <div className="yield-meta-cell" role="listitem">
              <div className="yield-meta-val">
                {typeof perHaNum === 'number' ? perHaNum.toFixed(2) : '--'}
              </div>
              <div className="yield-meta-label">MT per Hectare</div>
            </div>
            <div className="yield-meta-cell" role="listitem">
              <div className="yield-meta-val">{result.area_ha ?? areaHa}</div>
              <div className="yield-meta-label">Hectares</div>
            </div>
            <div className="yield-meta-cell" role="listitem">
              <div className="yield-meta-val" style={{ color: confColor }}>
                {confidence}
              </div>
              <div className="yield-meta-label">Confidence</div>
            </div>
          </div>

          {/* Agronomic notes */}
          {result.notes && (
            <div className="yield-notes">
              <div className="section-label">Agronomic Notes</div>
              <p>{result.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" aria-hidden="true">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6"  y1="20" x2="6"  y2="14"/>
      <line x1="2"  y1="20" x2="22" y2="20"/>
    </svg>
  )
}
