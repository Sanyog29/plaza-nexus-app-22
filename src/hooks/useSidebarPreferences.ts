import { useState, useEffect } from 'react';

interface SidebarPreferences {
  favorites: string[];
  isCollapsed: boolean;
  expandedGroups: string[];
  quickActionsVisible: boolean;
}

const DEFAULT_PREFERENCES: SidebarPreferences = {
  favorites: [],
  isCollapsed: false,
  expandedGroups: ['core-operations'],
  quickActionsVisible: true,
};

export const useSidebarPreferences = () => {
  const [preferences, setPreferences] = useState<SidebarPreferences>(() => {
    const saved = localStorage.getItem('sidebar-preferences');
    return saved ? { ...DEFAULT_PREFERENCES, ...JSON.parse(saved) } : DEFAULT_PREFERENCES;
  });

  useEffect(() => {
    localStorage.setItem('sidebar-preferences', JSON.stringify(preferences));
  }, [preferences]);

  const updatePreferences = (updates: Partial<SidebarPreferences>) => {
    setPreferences(prev => ({ ...prev, ...updates }));
  };

  const toggleFavorite = (path: string) => {
    setPreferences(prev => ({
      ...prev,
      favorites: prev.favorites.includes(path)
        ? prev.favorites.filter(fav => fav !== path)
        : [...prev.favorites, path]
    }));
  };

  const resetPreferences = () => {
    setPreferences(DEFAULT_PREFERENCES);
    localStorage.removeItem('sidebar-preferences');
  };

  return {
    preferences,
    updatePreferences,
    toggleFavorite,
    resetPreferences,
  };
};