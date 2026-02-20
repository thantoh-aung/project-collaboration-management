import axios from 'axios';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Do NOT set X-CSRF-TOKEN as a default axios header.
// After registration, session()->regenerate() changes the CSRF token, but
// Inertia's client-side navigation doesn't update the meta tag — making
// the header stale and causing 419 errors on the first POST.
//
// Instead, we rely on axios's built-in XSRF cookie handling:
//   Axios reads the XSRF-TOKEN cookie (set by Laravel on every response)
//   and sends it as the X-XSRF-TOKEN header automatically for same-origin
//   requests. This cookie is always fresh, so CSRF never goes stale.

