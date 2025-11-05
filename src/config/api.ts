export const API_BASE = import.meta.env.VITE_API_BASE;

export const apiUrl = (path: string) => `${API_BASE}/${path.startsWith('/') ? path.substring(1) : path}`;

export default apiUrl;
