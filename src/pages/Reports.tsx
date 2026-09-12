import React, { useState } from 'react';
import { api } from '../api';
import { DownloadCloud, Search, Calendar, BarChart2, TrendingUp, IndianRupee, Receipt, AlertCircle } from 'lucide-react';
import { Bill } from '../types';
import { Table } from '../components/ui/Table';
import { ProgressBar } from '../components/ui/ProgressBar';
import { formatCurrency } from '../utils/format';

const Reports: React.FC = () => {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [bills, setBills] = useState<Bill[]>([]);
  const [summary, setSummary] = useState({ totalSales: 0, totalPaid: 0, totalOutstanding: 0, totalBills: 0 });
  const [hasSearched, setHasSearched] = useState(false);

  const fetchReport = async () => {
    if (!fromDate || !toDate) {
      alert('Please select both From Date and To Date.');
      return;
    }
    setIsLoading(true);
    setHasSearched(true);
    try {
      const data = await api.getSalesReport(fromDate, toDate);
      setBills(data.bills);
      setSummary(data.summary);
    } catch (err) {
      alert("Failed to fetch report");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadExcel = () => {
    window.open(api.getSalesReportExcelUrl(fromDate, toDate), '_blank');
  };

  const collectionRate = summary.totalSales > 0 ? ((summary.totalPaid / summary.totalSales) * 100) : 0;

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '44px', height: '44px', borderRadius: '12px', 
              background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center' 
            }}>
              <BarChart2 size={22} color="white" />
            </div>
            Sales Reports
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '0.9rem' }}>
            Analyze your business performance and track payments
          </p>
        </div>
        {hasSearched && bills.length > 0 && (
          <button className="btn btn-primary" onClick={downloadExcel} style={{ 
            background: 'linear-gradient(135deg, #059669, #10B981)', border: 'none',
            padding: '10px 20px', borderRadius: '10px', fontWeight: 600,
            boxShadow: '0 4px 14px rgba(5,150,105,0.3)'
          }}>
            <DownloadCloud size={18} /> Export Excel
          </button>
        )}
      </div>

      {/* Date Filter Card */}
      <div style={{ 
        background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', 
        borderRadius: '16px', padding: '28px 32px', marginBottom: '28px',
        boxShadow: '0 8px 32px rgba(79,70,229,0.25)'
      }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>
              <Calendar size={14} /> From Date
            </label>
            <input type="date" className="form-control" value={fromDate} onChange={e => setFromDate(e.target.value)} 
              style={{ backgroundColor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: 'white', borderRadius: '10px', padding: '10px 14px' }}
            />
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>
              <Calendar size={14} /> To Date
            </label>
            <input type="date" className="form-control" value={toDate} onChange={e => setToDate(e.target.value)} 
              style={{ backgroundColor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: 'white', borderRadius: '10px', padding: '10px 14px' }}
            />
          </div>
          <button onClick={fetchReport} disabled={isLoading} style={{ 
            background: 'white', color: '#4F46E5', border: 'none', 
            padding: '10px 24px', borderRadius: '10px', fontWeight: 700, fontSize: '0.9rem',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', height: '44px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.15)', transition: 'transform 0.2s'
          }}>
            {isLoading ? 'Loading...' : <><Search size={18} /> Generate Report</>}
          </button>
        </div>
      </div>

      {!hasSearched && (
        <div style={{ 
          textAlign: 'center', padding: '80px 40px', 
          background: 'var(--surface-color)', borderRadius: '16px',
          border: '2px dashed var(--border-color)'
        }}>
          <BarChart2 size={56} style={{ color: '#CBD5E1', marginBottom: '16px' }} />
          <h3 style={{ color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '8px' }}>Select a Date Range</h3>
          <p style={{ color: '#94A3B8', fontSize: '0.9rem' }}>Choose a "From" and "To" date above, then click Generate Report to see your sales analytics.</p>
        </div>
      )}

      {hasSearched && (
        <>
          {/* Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '28px' }}>
            {/* Total Invoices */}
            <div style={{ 
              background: 'var(--surface-color)', borderRadius: '14px', padding: '24px',
              border: '1px solid var(--border-color)', position: 'relative', overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}>
              <div style={{ position: 'absolute', top: '-12px', right: '-12px', width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)', opacity: 0.6 }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #EEF2FF, #C7D2FE)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Receipt size={20} color="#4F46E5" />
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Invoices</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#4F46E5', position: 'relative' }}>{summary.totalBills}</div>
            </div>

            {/* Total Sales */}
            <div style={{ 
              background: 'var(--surface-color)', borderRadius: '14px', padding: '24px',
              border: '1px solid var(--border-color)', position: 'relative', overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}>
              <div style={{ position: 'absolute', top: '-12px', right: '-12px', width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #FFF7ED, #FFEDD5)', opacity: 0.6 }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #FFF7ED, #FED7AA)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={20} color="#EA580C" />
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Sales</span>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', position: 'relative' }}>₹ {summary.totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            </div>

            {/* Amount Received */}
            <div style={{ 
              background: 'var(--surface-color)', borderRadius: '14px', padding: '24px',
              border: '1px solid var(--border-color)', position: 'relative', overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}>
              <div style={{ position: 'absolute', top: '-12px', right: '-12px', width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)', opacity: 0.6 }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #ECFDF5, #A7F3D0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IndianRupee size={20} color="#059669" />
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Received</span>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669', position: 'relative' }}>₹ {summary.totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            </div>

            {/* Balance Due */}
            <div style={{ 
              background: 'var(--surface-color)', borderRadius: '14px', padding: '24px',
              border: '1px solid var(--border-color)', position: 'relative', overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}>
              <div style={{ position: 'absolute', top: '-12px', right: '-12px', width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #FEF2F2, #FECACA)', opacity: 0.6 }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #FEF2F2, #FECACA)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertCircle size={20} color="#DC2626" />
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Outstanding</span>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#DC2626', position: 'relative' }}>₹ {summary.totalOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            </div>
          </div>

          {/* Collection Progress Bar */}
          <div style={{ 
            background: 'var(--surface-color)', borderRadius: '14px', padding: '24px 28px', marginBottom: '28px',
            border: '1px solid var(--border-color)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Payment Collection Rate</span>
              <span style={{ 
                fontWeight: 800, fontSize: '1.1rem', 
                color: collectionRate >= 80 ? '#059669' : collectionRate >= 50 ? '#D97706' : '#DC2626' 
              }}>
                {collectionRate.toFixed(1)}%
              </span>
            </div>
            <ProgressBar percent={collectionRate} color={collectionRate >= 80 ? '#059669' : collectionRate >= 50 ? '#D97706' : '#DC2626'} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <span>₹ {summary.totalPaid.toLocaleString('en-IN')} collected</span>
              <span>₹ {summary.totalSales.toLocaleString('en-IN')} total</span>
            </div>
          </div>

          {/* Invoice Table */}
          <div style={{ 
            background: 'var(--surface-color)', borderRadius: '14px', 
            border: '1px solid var(--border-color)', overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Receipt size={18} color="#4F46E5" /> Invoice Breakdown
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                {bills.length} invoice{bills.length !== 1 ? 's' : ''} found
              </span>
            </div>
            <Table
              columns={[
                { header: 'Date', accessor: 'invoiceDate', align: 'left' },
                { header: 'Invoice No', accessor: 'billNumber', align: 'left' },
                { header: 'Customer', accessor: 'customer', align: 'left' },
                { header: 'Status', accessor: 'paymentStatus', align: 'center' },
                { header: 'Total', accessor: 'grandTotal', align: 'right' },
                { header: 'Paid', accessor: 'amountPaid', align: 'right' },
                { header: 'Balance', accessor: 'balanceDue', align: 'right' }
              ]}
              data={bills.map((bill: any) => ({
                invoiceDate: new Date(bill.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
                billNumber: bill.billNumber,
                customer: bill.customerSnapshot?.name || bill.customerName || 'Customer',
                paymentStatus: bill.paymentStatus || 'Unpaid',
                grandTotal: formatCurrency(bill.grandTotal),
                amountPaid: formatCurrency(bill.amountPaid || 0),
                balanceDue: formatCurrency(bill.grandTotal - (bill.amountPaid || 0))
              }))}
              renderRow={(row, idx) => (
                <tr key={idx} style={{
                  borderBottom: '1px solid #F1F5F9',
                  backgroundColor: idx % 2 === 0 ? 'white' : '#FAFBFC',
                  transition: 'background-color 0.15s'
                }}>
                  <td style={{ padding: '14px 20px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{row.invoiceDate}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ fontWeight: 700, color: '#4F46E5', background: '#EEF2FF', padding: '4px 10px', borderRadius: '6px', fontSize: '0.85rem' }}>{row.billNumber}</span>
                  </td>
                  <td style={{ padding: '14px 20px', fontWeight: 500 }}>{row.customer}</td>
                  <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      backgroundColor: row.paymentStatus === 'Paid' ? '#ECFDF5' : row.paymentStatus === 'Partially Paid' ? '#FFFBEB' : '#FEF2F2',
                      color: row.paymentStatus === 'Paid' ? '#059669' : row.paymentStatus === 'Partially Paid' ? '#B45309' : '#DC2626',
                      padding: '5px 12px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700,
                      border: `1px solid ${row.paymentStatus === 'Paid' ? '#A7F3D0' : row.paymentStatus === 'Partially Paid' ? '#FDE68A' : '#FECACA'}`
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'currentColor' }} />
                      {row.paymentStatus}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: 700, fontSize: '0.9rem' }}>{row.grandTotal}</td>
                  <td style={{ padding: '14px 20px', textAlign: 'right', color: '#059669', fontWeight: 600, fontSize: '0.9rem' }}>{row.amountPaid}</td>
                  <td style={{ padding: '14px 20px', textAlign: 'right', color: '#DC2626', fontWeight: 600, fontSize: '0.9rem' }}>{row.balanceDue}</td>
                </tr>
              )}
              className=""
            />
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;
