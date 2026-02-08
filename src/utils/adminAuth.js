// Admin authentication utilities
// Credentials loaded from environment variables

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;
const ADMIN_SESSION_KEY = 'safepass_admin_session';

/**
 * Validates admin credentials
 * @param {string} email - Email to check
 * @param {string} password - Password to check
 * @returns {boolean} True if credentials match
 */
export const checkAdminCredentials = (email, password) => {
    return email === ADMIN_EMAIL && password === ADMIN_PASSWORD;
};

/**
 * Sets admin session in localStorage
 */
export const setAdminSession = () => {
    localStorage.setItem(ADMIN_SESSION_KEY, 'true');
    localStorage.setItem('admin_email', ADMIN_EMAIL);
};

/**
 * Checks if admin is logged in
 * @returns {boolean} True if admin session exists
 */
export const isAdminLoggedIn = () => {
    return localStorage.getItem(ADMIN_SESSION_KEY) === 'true';
};

/**
 * Clears admin session
 */
export const logoutAdmin = () => {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    localStorage.removeItem('admin_email');
};

/**
 * Gets admin email from session
 * @returns {string|null} Admin email or null
 */
export const getAdminEmail = () => {
    return localStorage.getItem('admin_email');
};
