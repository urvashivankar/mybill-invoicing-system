import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';

// Auth Pages
import Login from './pages/Login';
import SignUp from './pages/SignUp';

// Lazy load app pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CreateBill = lazy(() => import('./pages/CreateBill'));
const Bills = lazy(() => import('./pages/Bills'));
const Quotations = lazy(() => import('./pages/Quotations'));
const CreateQuotation = lazy(() => import('./pages/CreateQuotation'));
const Customers = lazy(() => import('./pages/Customers'));
const Items = lazy(() => import('./pages/Items'));
const Settings = lazy(() => import('./pages/Settings'));
const Reports = lazy(() => import('./pages/Reports'));

const AppLayout = () => {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', padding: '48px', color: 'var(--text-secondary)' }}>Loading...</div>}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
};

const AuthWrapper = ({ children }: { children: React.ReactNode }) => {
  const { isLoading } = useAppContext();
  
  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f9fafb' }}>Loading MyBill...</div>;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <AppProvider>
      <Router>
        <AuthWrapper>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/create-bill" element={<CreateBill />} />
                <Route path="/bills" element={<Bills />} />
                <Route path="/quotations" element={<Quotations />} />
                <Route path="/create-quotation" element={<CreateQuotation />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/items" element={<Items />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Route>
          </Routes>
        </AuthWrapper>
      </Router>
    </AppProvider>
  );
}

export default App;
