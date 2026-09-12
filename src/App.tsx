import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import CreateBill from './pages/CreateBill';
import Bills from './pages/Bills';
import Quotations from './pages/Quotations';
import CreateQuotation from './pages/CreateQuotation';
import Customers from './pages/Customers';
import Items from './pages/Items';
import Settings from './pages/Settings';
import Reports from './pages/Reports';

function App() {
  return (
    <AppProvider>
      <Router>
        <div className="app-container">
          <Sidebar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/create-bill" element={<CreateBill />} />
              <Route path="/bills" element={<Bills />} />
              <Route path="/quotations" element={<Quotations />} />
              <Route path="/create-quotation" element={<CreateQuotation />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/items" element={<Items />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;
