// Environment-controlled feature flags
//
// Set VITE_SHOW_DEMO=true in .env (development only) to surface demo accounts
// and demo invitation codes in the UI. In production builds, leave it unset
// so end-users do not see development credentials.

export const showDemoHelpers =
  String(import.meta.env.VITE_SHOW_DEMO ?? '').toLowerCase() === 'true'
