import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { FileText, Copy, Search, Eye, DownloadCloud, Edit, Trash2, IndianRupee } from 'lucide-react';
import { Table } from '../components/ui/Table';
import { formatCurrency } from '../utils/format';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import RecordPaymentModal from '../components/RecordPaymentModal';

const Bills: React.FC = () => {
  const { bills } = useAppContext();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [downloadModal, setDownloadModal] = useState<{ isOpen: boolean, billId: string | null, type: 'pdf' | 'excel' }>({ isOpen: false, billId: null, type: 'pdf' });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [paymentModalBill, setPaymentModalBill] = useState<any | null>(null);

  const filteredBills = bills.filter(b => 
    b.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (b.customerSnapshot?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const triggerDownload = (id: string, type: 'pdf' | 'excel') => {
    setDownloadModal({ isOpen: true, billId: id, type });
  };

  const executeDownload = (template: string) => {
    if (!downloadModal.billId) return;
    if (downloadModal.type === 'pdf') {
      window.open(api.getPdfUrl(downloadModal.billId, template), '_blank');
    } else {
      window.open(api.getExcelUrl(downloadModal.billId, template), '_blank');
    }
    setDownloadModal({ isOpen: false, billId: null, type: 'pdf' });
  };

  const deleteBill = async (id: string) => {
    if (confirm('Are you sure you want to delete this bill? This action cannot be undone.')) {
      try {
        await api.deleteBill(id);
        setSelectedIds(selectedIds.filter(selId => selId !== id));
        window.location.reload(); // Simple refresh since refreshData isn't in Bills context directly
      } catch (err) {
        alert("Failed to delete bill");
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedIds.length} bills? This action cannot be undone.`)) {
      try {
        await api.bulkDeleteBills(selectedIds);
        setSelectedIds([]);
        window.location.reload();
      } catch (err) {
        alert("Failed to delete bills");
      }
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredBills.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredBills.map((b: any) => b.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selId => selId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Bills History</h1>
        <div className="flex gap-2" style={{ alignItems: 'center' }}>
          {selectedIds.length > 0 && (
            <button className="btn btn-secondary" onClick={handleBulkDelete} style={{ color: 'var(--danger-color)', borderColor: 'var(--danger-color)' }}>
              <Trash2 size={18} /> Delete Selected ({selectedIds.length})
            </button>
          )}
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search invoice or customer..." 
              style={{ paddingLeft: '40px' }}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card">
            <Table
              columns={[
                { header: '', accessor: 'select', align: 'center' },
                { header: 'Invoice No', accessor: 'billNumber' },
                
                { header: 'Customer', accessor: 'customer' },
    
                { header: 'Total', accessor: 'total', align: 'right' },
                { header: 'Balance', accessor: 'balance', align: 'right' },
                { header: 'Actions', accessor: 'actions', align: 'center' }
              ]}
              data={filteredBills.map((bill: any) => ({
                select: bill.id,
                billNumber: bill.billNumber,
                date: new Date(bill.invoiceDate).toLocaleDateString(),
                customer: bill.customerSnapshot?.name || 'Walk-in Customer',
                status: bill.paymentStatus || 'Unpaid',
                total: formatCurrency(bill.grandTotal),
                balance: formatCurrency(bill.grandTotal - (bill.amountPaid || 0)),
                actions: bill.id
              }))}
              renderRow={(row, idx) => (
                <tr key={row.select} style={{ backgroundColor: selectedIds.includes(row.select) ? 'var(--primary-light)' : 'transparent' }}>
                  <td>
                    <input type="checkbox" checked={selectedIds.includes(row.select)} onChange={() => toggleSelect(row.select)} />
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--primary-color)' }}>{row.billNumber}</td>
                  <td>{row.date}</td>
                  <td>{row.customer}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="badge" style={{
                      backgroundColor: row.status === 'Paid' ? '#dcfce7' : row.status === 'Partially Paid' ? '#fef08a' : '#fee2e2',
                      color: row.status === 'Paid' ? '#166534' : row.status === 'Partially Paid' ? '#854d0e' : '#991b1b',
                      padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600
                    }}>
                      {row.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{row.total}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: '#dc2626' }}>{row.balance}</td>
                  <td>
                    <div className="flex gap-2 justify-center">
                      {row.status !== 'Paid' && (
                        <button className="btn-icon" onClick={() => setPaymentModalBill(filteredBills.find((b:any)=>b.id===row.select))} title="Record Payment" style={{ color: '#059669' }}>
                          <IndianRupee size={18} />
                        </button>
                      )}
                      <button className="btn-icon" onClick={() => navigate('/create-bill', { state: { editBillId: row.select } })} title="Edit">
                        <Edit size={18} />
                      </button>
                      <button className="btn-icon" onClick={() => navigate('/create-bill', { state: { duplicateBillId: row.select } })} title="Create New From Old">
                        <Copy size={18} />
                      </button>
                      <button className="btn-icon" onClick={() => triggerDownload(row.select, 'pdf')} title="Download PDF" style={{ color: '#dc2626' }}>
                        <FileText size={18} />
                      </button>
                      <button className="btn-icon" onClick={() => triggerDownload(row.select, 'excel')} title="Download Excel" style={{ color: '#10b981' }}>
                        <DownloadCloud size={18} />
                      </button>
                      <button className="btn-icon" onClick={() => deleteBill(row.select)} title="Delete Bill" style={{ color: 'var(--danger-color)' }}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              )}
              className=""
            />
            {filteredBills.length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
                No bills found. Create your first bill!
              </div>
            )}
      </div>

      {downloadModal.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '24px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Download {downloadModal.type === 'pdf' ? 'PDF' : 'Excel'}</h2>
            <p style={{ marginBottom: '24px', color: 'var(--text-secondary)' }}>Select the invoice template you want to use for this download:</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button className="btn btn-secondary" onClick={() => executeDownload('classic')}>
                Classic Black & White
              </button>
              <button className="btn btn-secondary" onClick={() => executeDownload('color')}>
                Color Letterhead
              </button>
              <button className="btn btn-secondary" onClick={() => executeDownload('excel')}>
                Excel Style Invoice
              </button>
            </div>

            <div className="flex justify-end mt-6">
              <button className="btn-secondary" style={{ padding: '8px 16px', borderRadius: '6px' }} onClick={() => setDownloadModal({ isOpen: false, billId: null, type: 'pdf' })}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {paymentModalBill && (
        <RecordPaymentModal 
          bill={paymentModalBill} 
          onClose={() => setPaymentModalBill(null)}
          onSuccess={() => {
            setPaymentModalBill(null);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
};

export default Bills;
