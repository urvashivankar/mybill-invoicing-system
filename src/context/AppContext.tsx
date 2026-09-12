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

  const refreshData = async () => {
    try {
      const [fetchedSettings, fetchedItems, fetchedCustomers, fetchedBills, fetchedQuotations] = await Promise.all([
        api.getSettings(),
        api.getItems(),
        api.getCustomers(),
        api.getBills(),
        api.getQuotations()
      ]);
      if (fetchedSettings) setSettings(fetchedSettings);
      setItems(fetchedItems || []);
      setCustomers(fetchedCustomers || []);
      setBills(fetchedBills || []);
      setQuotations(fetchedQuotations || []);
    } catch (error) {
      console.error("Failed to fetch initial data from backend:", error);
      alert("Failed to connect to backend server. Is it running on port 5000?");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  return (
    <AppContext.Provider value={{ 
      items, setItems, 
      customers, setCustomers, 
      bills, setBills, 
      quotations, setQuotations,
      settings, setSettings,
      refreshData,
      isLoading
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
