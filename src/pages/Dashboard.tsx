import React from 'react';
import { useAppContext } from '../context/AppContext';
import { FileText, Calendar, TrendingUp, Users, Plus, DownloadCloud } from 'lucide-react';
import { Table } from '../components/ui/Table';
import { formatCurrency } from '../utils/format';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { bills, customers, items } = useAppContext();
  const navigate = useNavigate();

  const totalSales = bills.reduce((sum, bill) => sum + bill.grandTotal, 0);
  const totalOutstanding = bills.reduce((sum, bill) => sum + (bill.grandTotal - (bill.amountPaid || 0)), 0);

  const recentBills = [...bills].slice(0, 5);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Manage your bills, customers and price list</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/create-bill')}>
          <Plus size={18} /> Create New Bill
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        
        {/* Total Bills */}
        <div className="card" style={{ padding: '20px' }}>
          <div className="flex items-center gap-4">
            <div style={{ padding: '12px', backgroundColor: '#EEF2FF', color: '#4F46E5', borderRadius: '12px' }}>
              <FileText size={24} />
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600 }}>TOTAL BILLS</p>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{bills.length}</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>All time invoices</p>
            </div>
          </div>
        </div>

        {/* Total Sales */}
        <div className="card" style={{ padding: '20px' }}>
          <div className="flex items-center gap-4">
            <div style={{ padding: '12px', backgroundColor: '#D1FAE5', color: '#059669', borderRadius: '12px' }}>
              <TrendingUp size={24} />
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600 }}>TOTAL SALES</p>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 800 }}>₹{totalSales.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>All time revenue</p>
            </div>
          </div>
        </div>

        {/* Outstanding Balance */}
        <div className="card" style={{ padding: '20px' }}>
          <div className="flex items-center gap-4">
            <div style={{ padding: '12px', backgroundColor: '#FEE2E2', color: '#DC2626', borderRadius: '12px' }}>
              <TrendingUp size={24} style={{ transform: 'scaleY(-1)' }} />
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600 }}>OUTSTANDING</p>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#DC2626' }}>₹{totalOutstanding.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Pending payments</p>
            </div>
          </div>
        </div>

        {/* Total Customers */}
        <div className="card" style={{ padding: '20px' }}>
          <div className="flex items-center gap-4">
            <div style={{ padding: '12px', backgroundColor: '#F3E8FF', color: '#9333EA', borderRadius: '12px' }}>
              <Users size={24} />
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600 }}>TOTAL CUSTOMERS</p>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{customers.length}</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Active customers</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        
        {/* Recent Bills */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 style={{ fontSize: '1.125rem' }}>Recent Bills</h2>
            {bills.length > 0 && (
              <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }} onClick={() => navigate('/bills')}>
                View All
              </button>
            )}
          </div>
          
          {recentBills.length > 0 ? (
            <Table
              columns={[
                { header: 'Invoice No', accessor: 'billNumber' },
                { header: 'Customer', accessor: 'customer' },
                { header: 'Date', accessor: 'date' },
                { header: 'Status', accessor: 'status', align: 'center' },
                { header: 'Amount', accessor: 'amount', align: 'right' }
              ]}
              data={recentBills.map((bill: any) => ({
                billNumber: bill.billNumber,
                customer: bill.customerSnapshot?.name || bill.customerName,
                date: new Date(bill.invoiceDate).toLocaleDateString(),
                status: bill.paymentStatus || 'Unpaid',
                amount: formatCurrency(bill.grandTotal)
              }))}
              renderRow={(row, idx) => (
                <tr key={idx}>
                  <td style={{ color: 'var(--primary-color)', fontWeight: 600 }}>{row.billNumber}</td>
                  <td>{row.customer}</td>
                  <td>{row.date}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="badge" style={{
                      backgroundColor: row.status === 'Paid' ? '#dcfce7' : row.status === 'Partially Paid' ? '#fef08a' : '#fee2e2',
                      color: row.status === 'Paid' ? '#166534' : row.status === 'Partially Paid' ? '#854d0e' : '#991b1b',
                      padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600
                    }}>
                      {row.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>{row.amount}</td>
                </tr>
              )}
              className=""
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>No bills created yet</p>
              <button className="btn btn-primary" onClick={() => navigate('/create-bill')}>
                Create Your First Bill
              </button>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 style={{ fontSize: '1.125rem', marginBottom: '16px' }}>Quick Actions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={() => navigate('/create-bill')}>
              <Plus size={18} /> Create New Bill
            </button>
            <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={() => navigate('/create-bill')}>
              <DownloadCloud size={18} /> Import Bill
            </button>
            <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={() => navigate('/items')}>
              <DownloadCloud size={18} /> Import Items
            </button>
            <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={() => navigate('/customers')}>
              <Users size={18} /> Add Customer
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
