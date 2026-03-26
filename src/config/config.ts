/**
 * Configuration globale de l'application
 */

export const APP_CONFIG = {
  NAME: 'ProspectRadar AI',
  VERSION: '1.0.0',
  API_ENDPOINTS: {
    PROSPECTS: '/api/prospects',
    SCAN: '/api/scan',
    AUDIT_SAVE: (id: string) => `/api/audit/${id}/save`,
    UPDATE_STATUS: (id: string) => `/api/prospects/${id}/status`,
    UPDATE_FOLLOW_UP: (id: string) => `/api/prospects/${id}/follow-up`,
    UPDATE_EMAIL: (id: string) => `/api/prospects/${id}/email`,
    DELETE_PROSPECT: (id: string) => `/api/prospects/${id}`,
  },
  UI: {
    COLORS: {
      PRIMARY: '#6366f1', // Indigo 500
      SECONDARY: '#4f46e5', // Indigo 600
      SUCCESS: '#10b981', // Emerald 500
      WARNING: '#f59e0b', // Amber 500
      DANGER: '#ef4444', // Red 500
      SLATE: {
        50: '#f8fafc',
        900: '#0f172a',
        950: '#020617',
      }
    },
    ANIMATIONS: {
      SPRING: { type: 'spring', damping: 25, stiffness: 200 },
    }
  },
  BUSINESS: {
    SCORE_URGENT: 30,
    SCORE_GOOD: 70,
    DEFAULT_PANIER_MOYEN: {
      RESTAURATION: 25,
      BEAUTE: 45,
      ARTISANAT: 150,
      SERVICES: 35
    }
  }
};
