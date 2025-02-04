// Google OAuth configuration
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Google OAuth scopes and settings
export const googleAuthConfig = {
  client_id: GOOGLE_CLIENT_ID,
  scope: 'email profile',
  response_type: 'code',
  prompt: 'select_account'
};