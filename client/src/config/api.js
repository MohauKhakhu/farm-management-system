const API_BASE_URL = 'http://192.168.0.167:3002';

export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    REGISTER: `${API_BASE_URL}/api/auth/register`,
    LOGOUT: `${API_BASE_URL}/api/auth/logout`,
    PROFILE: `${API_BASE_URL}/api/auth/profile`,
  },
  
  // Farm endpoints
  FARMS: {
    BASE: `${API_BASE_URL}/api/farms`,
    BY_ID: (id) => `${API_BASE_URL}/api/farms/${id}`,
    USERS: (farmId) => `${API_BASE_URL}/api/farms/${farmId}/users`,
    USER_ROLE: (farmId, userId) => `${API_BASE_URL}/api/farms/${farmId}/users/${userId}`,
  },
  
  // Animal endpoints
  ANIMALS: {
    BASE: `${API_BASE_URL}/api/animals`,
    BY_ID: (id) => `${API_BASE_URL}/api/animals/${id}`,
    BY_FARM: (farmId) => `${API_BASE_URL}/api/animals/farm/${farmId}`,
    HEALTH: (animalId) => `${API_BASE_URL}/api/animals/${animalId}/health`,
    BREEDING: (animalId) => `${API_BASE_URL}/api/animals/${animalId}/breeding`,
  },
  
  // Dashboard endpoints
  DASHBOARD: {
    FARM_STATS: (farmId) => `${API_BASE_URL}/api/dashboard/farm/${farmId}`,
  },
  
  // Other endpoints (you can add more as needed)
  FIELDS: {
    BASE: `${API_BASE_URL}/api/fields`,
    BY_FARM: (farmId) => `${API_BASE_URL}/api/fields/farm/${farmId}`,
  },
  
  INVENTORY: {
    BASE: `${API_BASE_URL}/api/inventory`,
    BY_FARM: (farmId) => `${API_BASE_URL}/api/inventory/farm/${farmId}`,
  },
  
  TASKS: {
    BASE: `${API_BASE_URL}/api/tasks`,
    BY_FARM: (farmId) => `${API_BASE_URL}/api/tasks/farm/${farmId}`,
  },
};

export default API_BASE_URL;