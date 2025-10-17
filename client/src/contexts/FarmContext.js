import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';

const FarmContext = createContext();

export const FarmProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [farms, setFarms] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load farms when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadFarms();
    } else {
      setFarms([]);
      setSelectedFarm(null);
    }
  }, [isAuthenticated]);

  // Auto-select farm if only one available or restore from localStorage
  useEffect(() => {
    if (farms.length > 0 && !selectedFarm) {
      const savedFarmId = localStorage.getItem('selectedFarmId');
      const savedFarm = farms.find(farm => farm.id === savedFarmId);
      
      if (savedFarm) {
        setSelectedFarm(savedFarm);
      } else if (farms.length === 1) {
        setSelectedFarm(farms[0]);
      }
    }
  }, [farms, selectedFarm]);

  // Save selected farm to localStorage
  useEffect(() => {
    if (selectedFarm) {
      localStorage.setItem('selectedFarmId', selectedFarm.id);
    } else {
      localStorage.removeItem('selectedFarmId');
    }
  }, [selectedFarm]);

  const loadFarms = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axios.get('/api/farms');
      setFarms(response.data);
    } catch (error) {
      console.error('Error loading farms:', error);
      setError(error.response?.data?.error || 'Failed to load farms');
    } finally {
      setIsLoading(false);
    }
  };

  const createFarm = async (farmData) => {
    try {
      setError(null);
      
      const response = await axios.post('/api/farms', farmData);
      const newFarm = response.data;
      
      setFarms(prev => [...prev, newFarm]);
      
      // Auto-select the new farm
      setSelectedFarm(newFarm);
      
      return { success: true, farm: newFarm };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to create farm';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const updateFarm = async (farmId, farmData) => {
    try {
      setError(null);
      
      const response = await axios.put(`/api/farms/${farmId}`, farmData);
      const updatedFarm = response.data;
      
      setFarms(prev => prev.map(farm => 
        farm.id === farmId ? updatedFarm : farm
      ));
      
      // Update selected farm if it's the one being updated
      if (selectedFarm?.id === farmId) {
        setSelectedFarm(updatedFarm);
      }
      
      return { success: true, farm: updatedFarm };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to update farm';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const deleteFarm = async (farmId) => {
    try {
      setError(null);
      
      await axios.delete(`/api/farms/${farmId}`);
      
      setFarms(prev => prev.filter(farm => farm.id !== farmId));
      
      // Clear selected farm if it's the one being deleted
      if (selectedFarm?.id === farmId) {
        setSelectedFarm(null);
      }
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to delete farm';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const selectFarm = (farm) => {
    setSelectedFarm(farm);
  };

  const addUserToFarm = async (farmId, email, role = 'worker') => {
    try {
      setError(null);
      
      const response = await axios.post(`/api/farms/${farmId}/users`, {
        email,
        role
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to add user to farm';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const updateUserRole = async (farmId, userId, role) => {
    try {
      setError(null);
      
      await axios.put(`/api/farms/${farmId}/users/${userId}`, { role });
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to update user role';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const removeUserFromFarm = async (farmId, userId) => {
    try {
      setError(null);
      
      await axios.delete(`/api/farms/${farmId}/users/${userId}`);
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to remove user from farm';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    farms,
    selectedFarm,
    isLoading,
    error,
    loadFarms,
    createFarm,
    updateFarm,
    deleteFarm,
    selectFarm,
    addUserToFarm,
    updateUserRole,
    removeUserFromFarm,
    clearError,
  };

  return (
    <FarmContext.Provider value={value}>
      {children}
    </FarmContext.Provider>
  );
};

export const useFarm = () => {
  const context = useContext(FarmContext);
  if (!context) {
    throw new Error('useFarm must be used within a FarmProvider');
  }
  return context;
};

export default FarmContext;