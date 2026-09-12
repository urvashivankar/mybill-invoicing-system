import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Users, Package, Settings, PlusCircle, Briefcase, BarChart2 } from 'lucide-react';

const Sidebar: React.FC = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header" style={{ 
        display: 'flex', flexDirection: 'column', alignItems: 'center', 
        padding: '28px 16px 20px', gap: '4px', borderBottom: '1px solid var(--border-color)'
      }}>
        <img src="/logo.svg" alt="MyBill" style={{ width: '56px', height: '56px', marginBottom: '4px' }} />
        <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1E293B', letterSpacing: '-0.5px' }}>
          My<span style={{ color: '#4F46E5' }}>Bill</span>
        </span>
        <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#94A3B8', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
          Smart Billing
        </span>
      </div>
      <nav className="sidebar-nav">
        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <LayoutDashboard />
          Dashboard
        </NavLink>
        <NavLink to="/create-bill" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <PlusCircle />
          Create New Bill
        </NavLink>
        <NavLink to="/bills" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <FileText />
          Bills History
        </NavLink>
        <NavLink to="/quotations" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Briefcase />
          Quotations
        </NavLink>
        <NavLink to="/reports" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <BarChart2 />
          Sales Reports
        </NavLink>
        <NavLink to="/customers" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Users />
          Customers
        </NavLink>
        <NavLink to="/items" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Package />
          Items / Price List
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Settings />
          Settings
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;
