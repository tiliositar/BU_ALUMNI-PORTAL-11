/**
 * API Configuration
 * Update the BASE_URL with your Render backend URL after deployment.
 */
window.API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? '' // Use relative paths for local development
  : 'https://bu-alumni-portal-11.onrender.com'
