import React, { createContext, useContext, useState, useCallback } from 'react';
import { BreadcrumbContextType, BreadcrumbItem } from '@/types/breadcrumb';

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(undefined);

export const useBreadcrumbContext = () => {
  const context = useContext(BreadcrumbContext);
  if (!context) {
    throw new Error('useBreadcrumbContext must be used within a BreadcrumbProvider');
  }
  return context;
};

interface BreadcrumbProviderProps {
  children: React.ReactNode;
}

export const BreadcrumbProvider: React.FC<BreadcrumbProviderProps> = ({ children }) => {
  const [breadcrumbs, setBreadcrumbsState] = useState<BreadcrumbItem[]>([]);

  const setBreadcrumbs = useCallback((newBreadcrumbs: BreadcrumbItem[]) => {
    setBreadcrumbsState(newBreadcrumbs);
  }, []);

  const addBreadcrumb = useCallback((breadcrumb: BreadcrumbItem) => {
    setBreadcrumbsState(prev => {
      const exists = prev.find(b => b.href === breadcrumb.href);
      if (exists) return prev;
      return [...prev, breadcrumb];
    });
  }, []);

  const removeBreadcrumb = useCallback((href: string) => {
    setBreadcrumbsState(prev => prev.filter(b => b.href !== href));
  }, []);

  const clearBreadcrumbs = useCallback(() => {
    setBreadcrumbsState([]);
  }, []);

  const value: BreadcrumbContextType = {
    breadcrumbs,
    setBreadcrumbs,
    addBreadcrumb,
    removeBreadcrumb,
    clearBreadcrumbs,
  };

  return (
    <BreadcrumbContext.Provider value={value}>
      {children}
    </BreadcrumbContext.Provider>
  );
};