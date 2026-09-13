import React, { createContext, useContext, useState, useEffect } from 'react';
import { Item, Customer, Bill, BusinessSettings, Quotation } from '../types';
import { api } from '../api';

interface AppContextType {
  items: Item[];
  setItems: React.Dispatch<React.SetStateAction<Item[]>>;
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  bills: Bill[];
  setBills: React.Dispatch<React.SetStateAction<Bill[]>>;
  quotations: Quotation[];
  setQuotations: React.Dispatch<React.SetStateAction<Quotation[]>>;
  settings: BusinessSettings;
  setSettings: React.Dispatch<React.SetStateAction<BusinessSettings>>;
  refreshData: () => Promise<void>;
  isLoading: boolean;
  
  // Auth
  isAuthenticated: boolean;
  user: any;
  loginState: (userData: any, token: string) => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [settings, setSettings] = useState<BusinessSettings>({
    businessName: 'My Business',
    invoicePrefix: 'INV-'
  });
  const [isLoading, setIsLoading] = useState(true);

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem('token'));
  const [user, setUser] = useState<any>(JSON.parse(localStorage.getItem('user') || 'null'));

  const loginState = (userData: any, token: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
    refreshData();
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
    // Clear data
    setItems([]);
    setCustomers([]);
    setBills([]);
    setQuotations([]);
    window.location.href = '/login';
  };

  useEffect(() => {
    const handleAuthExpired = () => logout();
    window.addEventListener('auth-expired', handleAuthExpired);
    return () => window.removeEventListener('auth-expired', handleAuthExpired);
  }, []);

  const refreshData = async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      const [fetchedSettings, fetchedItems, fetchedCustomers] = await Promise.all([
        api.getSettings(),
        api.getItems(),
        api.getCustomers()
      ]);
      if (fetchedSettings && !fetchedSettings.error) setSettings(fetchedSettings);
      
      const safeItems = fetchedItems?.error ? [] : (fetchedItems?.data || fetchedItems || []);
      const safeCustomers = fetchedCustomers?.error ? [] : (fetchedCustomers?.data || fetchedCustomers || []);
      
      setItems(safeItems);
      setCustomers(safeCustomers);
      setBills([]); 
      setQuotations([]); 
    } catch (error) {
      console.error("Failed to fetch initial data from backend:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshData();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  return (
    <AppContext.Provider value={{ 
      items, setItems, 
      customers, setCustomers, 
      bills, setBills, 
      quotations, setQuotations,
      settings, setSettings,
      refreshData,
      isLoading,
      isAuthenticated,
      user,
      loginState,
      logout
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
