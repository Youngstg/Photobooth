// Central API Base URL Configuration
// Uses relative path '' for local development, and PythonAnywhere backend URL for production/Vercel
export const API_BASE_URL = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
    ? ''
    : 'https://luckystg.pythonanywhere.com';
