/**
 * Centralized API client for CropCare AI.
 *
 * In development, Vite proxies /api/* → localhost:8000 (vite.config.js).
 * In production (Vercel), VITE_API_BASE_URL points to the Render backend,
 * and all requests are sent to that absolute URL instead of a relative path.
 */
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '') // strip trailing slash
  : '' // falls back to relative path (local dev proxy)

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 120_000, // 2 min — Render cold-starts can take ~30-50 s
})

/**
 * Ping the backend health endpoint to wake up the Render instance.
 * Call this once on app load so the first user action doesn't hit a cold-start 503.
 */
export async function warmUpBackend() {
  try {
    await api.get('/api/health')
  } catch {
    // Silently ignore — the backend may still be waking up.
  }
}
