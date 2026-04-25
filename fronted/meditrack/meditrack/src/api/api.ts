// src/api/api.ts
// =============================================================================
// UTILITAIRE API CENTRALISÉ - Django REST Framework + JWT + TypeScript
// =============================================================================

// 🔧 Configuration de base (Vite ou fallback)
const API_BASE_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) 
  ? (import.meta as any).env.VITE_API_URL 
  : 'http://localhost:8000/api/';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export interface ApiErrorResponse {
  detail?: string;
  non_field_errors?: string[];
  [key: string]: any;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface TokenResponse {
  access: string;
  refresh: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

// =============================================================================
// GESTION DES HEADERS
// =============================================================================

const getHeaders = (isFormData: boolean = false): Record<string, string> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const headers: Record<string, string> = {};
  
  // Ne pas définir Content-Type pour FormData (le navigateur le fait automatiquement)
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  
  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }
  
  return headers;
};

// =============================================================================
// GESTION DU TOKEN JWT (REFRESH AUTOMATIQUE)
// =============================================================================

const refreshToken = async (): Promise<string> => {
  const refresh = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
  
  if (!refresh) {
    throw new Error('Aucun refresh token disponible');
  }

  try {
    const res = await fetch(`${API_BASE_URL}token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Échec du refresh token' }));
      throw new Error(err.detail || 'Impossible de rafraîchir le token');
    }

    const data: TokenResponse = await res.json();
    
    // Mise à jour du token dans le storage
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', data.access);
    }
    
    return data.access;
  } catch (error) {
    // Échec critique : déconnexion forcée
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
    throw new Error('Session expirée - Veuillez vous reconnecter');
  }
};

// =============================================================================
// WRAPPER FETCH PRINCIPAL (TYPÉ + AUTO-RETRY) - ✅ CORRIGÉ
// =============================================================================

export const apiFetch = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  // 🔧 CORRECTION CRITIQUE : Gérer correctement les query params (?search=...)
  // Sépare le chemin de la query string pour éviter le bug du "/" final
  const [path, queryString] = endpoint.split('?');
  const cleanPath = path.replace(/^\/+|\/+$/g, '');
  
  // Construit l'URL : slash APRÈS le chemin, query string APRÈS le slash
  const url = queryString 
    ? `${API_BASE_URL}${cleanPath}/?${queryString}`  // ✅ patients/?search=KOUM
    : `${API_BASE_URL}${cleanPath}/`;                 // ✅ patients/
  
  const isFormData = options.body instanceof FormData;
  
  // Première tentative
  let response = await fetch(url, {
    ...options,
    headers: { ...getHeaders(isFormData), ...(options.headers || {}) },
  });

  // ⚠️ Gestion automatique du 401 (token expiré)
  if (response.status === 401) {
    try {
      // Tenter de rafraîchir le token
      await refreshToken();
      
      // Réessayer la requête avec le nouveau token
      response = await fetch(url, {
        ...options,
        headers: { ...getHeaders(isFormData), ...(options.headers || {}) },
      });
    } catch (refreshError) {
      // Redirection vers login si refresh échoue
      if (typeof window !== 'undefined') {
        // Éviter boucle de redirection
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
      throw new Error('Authentification requise');
    }
  }

  // Gestion des erreurs HTTP
  if (!response.ok) {
    let errorData: ApiErrorResponse = { detail: response.statusText };
    
    try {
      errorData = await response.json();
    } catch {
      // Si le corps n'est pas du JSON, garder le statut HTTP
    }
    
    // Message d'erreur lisible
    const message = 
      errorData.detail || 
      errorData.non_field_errors?.[0] || 
      Object.values(errorData).filter(v => typeof v === 'string').join(', ') ||
      `Erreur HTTP ${response.status}`;
    
    throw new Error(message);
  }

  // Gestion des réponses vides (ex: DELETE 204 No Content)
  if (response.status === 204) {
    return {} as T;
  }

  // Parsing JSON sécurisé
  const text = await response.text();
  if (!text.trim()) {
    return {} as T;
  }
  
  return JSON.parse(text) as T;
};

// =============================================================================
// MÉTHODES D'AUTHENTIFICATION
// =============================================================================

/**
 * Authentification utilisateur - Obtention des tokens JWT
 */
export const loginApi = async (credentials: LoginCredentials): Promise<TokenResponse> => {
  const res = await fetch(`${API_BASE_URL}token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Échec de connexion' }));
    throw new Error(err.detail || 'Identifiants incorrects');
  }

  const data: TokenResponse = await res.json();
  
  // Stockage sécurisé des tokens
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
  }
  
  return data;
};

/**
 * Déconnexion - Nettoyage des tokens
 */
export const logoutApi = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
};

/**
 * Vérifie si l'utilisateur est authentifié (token présent et non expiré)
 */
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const token = localStorage.getItem('access_token');
  if (!token) return false;
  
  // Vérification basique de l'expiration (le payload JWT est en base64)
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    return payload.exp > now;
  } catch {
    return false;
  }
};

// =============================================================================
// MÉTHODES CRUD PRÉ-DÉFINIES (Optionnel - Pour simplifier l'usage)
// =============================================================================

export const api = {
  // GET liste (avec pagination)
  list: <T>(endpoint: string, params?: URLSearchParams) => {
    const qs = params ? `?${params.toString()}` : '';
    return apiFetch<PaginatedResponse<T>>(`${endpoint}${qs}`);
  },

  // GET détail
  get: <T>(endpoint: string, id: number | string) => 
    apiFetch<T>(`${endpoint}/${id}`),

  // POST création
  create: <T, R = T>(endpoint: string, data: T, isFormData: boolean = false) => 
    apiFetch<R>(endpoint, {
      method: 'POST',
      body: isFormData ? (data as FormData) : JSON.stringify(data),
    }),

  // PUT/PATCH mise à jour
  update: <T, R = T>(endpoint: string, id: number | string, data: T, isFormData: boolean = false, method: 'PUT' | 'PATCH' = 'PATCH') => 
    apiFetch<R>(`${endpoint}/${id}`, {
      method,
      body: isFormData ? (data as FormData) : JSON.stringify(data),
    }),

  // DELETE suppression
  delete: (endpoint: string, id: number | string) => 
    apiFetch(`${endpoint}/${id}`, { method: 'DELETE' }),
};