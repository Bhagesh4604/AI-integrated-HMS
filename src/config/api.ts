// Determine API base URL dynamically
const hostname = window.location.hostname;
const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';

export const API_BASE = isLocal
    ? "http://localhost:8080"
    : (import.meta.env.VITE_API_BASE || "https://shreemedicare-backend.onrender.com");

export const apiUrl = (path: string) => {
    // Ensure no double slashes if API_BASE ends with / and path starts with /
    const base = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${base}${cleanPath}`;
};

export default apiUrl;
