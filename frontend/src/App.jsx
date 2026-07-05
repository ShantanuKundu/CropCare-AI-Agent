import { useState } from 'react'
import DiagnosticsTab from './components/DiagnosticsTab'
import RecommendTab from './components/RecommendTab'
import YieldTab from './components/YieldTab'
import './index.css'

const TABS = [
  { id: 'diagnose',  label: 'Leaf Diagnostics', component: DiagnosticsTab },
  { id: 'recommend', label: 'Crop Advisor',      component: RecommendTab   },
  { id: 'yield',     label: 'Yield Predictor',   component: YieldTab       },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('diagnose')
  const ActiveComponent = TABS.find(t => t.id === activeTab)?.component

  return (
    <div className="app">

      {/* ── Header ────────────────────────────────────────── */}
      <header className="app-header">
        <div className="header-inner">
          <div className="brand-logo" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
            </svg>
          </div>
          <div className="brand-text">
            <h1 className="brand-title">CropCare AI</h1>
            <p className="brand-subtitle">Autonomous Agricultural Intelligence</p>
          </div>
          <div className="live-badge" aria-label="Live AI service">
            <span className="live-dot" />
            LIVE AI
          </div>
        </div>
      </header>

      {/* ── Tab Navigation ────────────────────────────────── */}
      <nav className="tab-nav" role="tablist" aria-label="Feature tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <TabIcon id={tab.id} />
            {tab.label}
          </button>
        ))}
      </nav>

      {/* ── Main Panel ────────────────────────────────────── */}
      <main
        id={`panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        className="app-main"
      >
        {ActiveComponent && <ActiveComponent />}
      </main>
    </div>
  )
}

function TabIcon({ id }) {
  if (id === 'diagnose') return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
    </svg>
  )
  if (id === 'recommend') return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 20h10"/>
      <path d="M10 20c5.5-2.5.8-6.4 3-10"/>
      <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/>
      <path d="M14.1 6a7 7 0 0 1 1.3 4.2c-1.9.1-3.3-.1-4.3-1-1-1-1.6-2.5-1.3-5 2.7.1 4 1 4.3 1.8z"/>
    </svg>
  )
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6"  y1="20" x2="6"  y2="14"/>
      <line x1="2"  y1="20" x2="22" y2="20"/>
    </svg>
  )
}
