export const LIVE_API_BASE = (
  import.meta.env.VITE_LIVE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  'http://localhost:5000'
).replace(/\/$/, '');