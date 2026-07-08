import { useState } from 'react'
import { api } from '../api'

/* ── Feature 2: Crop & Fertilizer Recommendation ─────────────── */
export default function RecommendTab() {
  const [region,  setRegion]  = useState('')
  const [query,   setQuery]   = useState('')
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState(null)
  const [error,   setError]   = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!region.trim() || !query.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const { data } = await api.post('/api/recommend', {
        region: region.trim(),
        query:  query.trim(),
      })
      setResult(data)
    } catch (err) {
      setError(
        err.response?.data?.detail
        || err.message
        || 'Recommendation request failed. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  /* Soil profile is pipe-delimited: "Soil: ... | pH: ... | ..." */
  const soilSegments = result?.soil_profile
    ? result.soil_profile.split('|').map(s => s.trim()).filter(Boolean)
    : []

  const crops = Array.isArray(result?.crop_recommendations)
    ? result.crop_recommendations
    : []

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <div className="stack">

      {/* Input form */}
      <div className="card">
        <h2 className="card-title">
          <SproutIcon /> Crop &amp; Fertilizer Advisor
        </h2>
        <p className="card-desc">
          Enter your region and farming query. The AI agent will autonomously call the soil database
          before forming crop selection and fertilizer recommendations.
        </p>

        <form id="recommend-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="region-input" className="form-label">Geographic Region</label>
            <input
              id="region-input"
              type="text"
              className="form-input"
              placeholder="e.g. Maharashtra, Punjab, Kerala, Rajasthan..."
              value={region}
              onChange={e => setRegion(e.target.value)}
              required
              autoComplete="off"
            />
          </div>

          <div className="form-group">
            <label htmlFor="query-input" className="form-label">Your Agricultural Query</label>
            <textarea
              id="query-input"
              className="form-textarea"
              placeholder="e.g. What should I plant this Kharif season? My fields have been used for wheat for 3 consecutive years..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              required
            />
          </div>

          <button
            id="btn-recommend"
            type="submit"
            className="btn-primary"
            disabled={loading || !region.trim() || !query.trim()}
          >
            {loading ? 'Consulting AI Agent...' : 'Get Recommendations'}
          </button>
        </form>
      </div>

      {/* Loading */}
      {loading && (
        <div className="card">
          <div className="loading-box">
            <div className="spinner" role="status" aria-label="Processing" />
            <p className="loading-text">
              Agent querying soil database and reasoning through your query&hellip;
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="error-box" role="alert">{error}</div>
      )}

      {/* Results */}
      {result && !loading && (
        <>
          {/* Soil profile */}
          {soilSegments.length > 0 && (
            <div className="card" role="region" aria-label="Soil profile">
              <div className="section-label">Soil Database Record</div>
              <div className="soil-card">
                <div className="soil-region">Region: {region}</div>
                <div className="soil-segments">
                  {soilSegments.map((seg, i) => (
                    <div key={i} className="soil-segment">{seg}</div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Crops + Fertilizer + Reasoning */}
          <div className="card" role="region" aria-label="Recommendations">

            {/* Crop recommendations */}
            {crops.length > 0 && (
              <>
                <div className="section-label">Recommended Crops</div>
                <div className="crop-pills" aria-label="Crop list">
                  {crops.map((crop, i) => (
                    <div key={i} className="crop-pill">{crop}</div>
                  ))}
                </div>
                <div className="divider" />
              </>
            )}

            {/* Fertilizer plan */}
            {result.fertilizer_plan && (
              <>
                <div className="section-label">Fertilizer Plan</div>
                <div className="reasoning-block">{result.fertilizer_plan}</div>
                <div className="divider" />
              </>
            )}

            {/* Reasoning */}
            {result.reasoning && (
              <>
                <div className="section-label">AI Reasoning</div>
                <div className="reasoning-block">{result.reasoning}</div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function SproutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 20h10"/>
      <path d="M10 20c5.5-2.5.8-6.4 3-10"/>
      <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/>
      <path d="M14.1 6a7 7 0 0 1 1.3 4.2c-1.9.1-3.3-.1-4.3-1-1-1-1.6-2.5-1.3-5 2.7.1 4 1 4.3 1.8z"/>
    </svg>
  )
}
