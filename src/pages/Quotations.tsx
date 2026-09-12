import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { FileText, Copy, Search, DownloadCloud, Edit, Trash2, ArrowRightCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Table } from '../components/ui/Table';
import { formatCurrency } from '../utils/format';

const Quotations: React.FC = () => {
  const { quotations } = useAppContext();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filteredQuotations = quotations.filter(q => {
    const matchesSearch = q.quotationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.customerSnapshot?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === '' || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const triggerDownload = (id: string, type: 'pdf' | 'excel') => {
    if (type === 'pdf') {
      window.open(api.getQuotationPdfUrl(id), '_blank');
    } else {
      window.open(api.getQuotationExcelUrl(id), '_blank');
    }
  };

  const deleteQuotation = async (id: string) => {
    if (confirm('Are you sure you want to delete this quotation? This action cannot be undone.')) {
      try {
        await api.deleteQuotation(id);
        window.location.reload();
      } catch (err) {
        alert('Failed to delete quotation');
      }
    }
  };

  const convertToBill = async (id: string) => {
    if (confirm('Are you sure you want to convert this quotation to an invoice? A new invoice will be created.')) {
      try {
        const newBill = await api.convertQuotationToBill(id);
        alert(`Successfully created Invoice ${newBill.billNumber}`);
        navigate('/bills');
        window.location.reload();
      } catch (err) {
        alert('Failed to convert quotation');
      }
    }
  };

  const statusStyle = (status: string) => {
    if (status === 'Converted') return { backgroundColor: '#dcfce7', color: '#166534' };
    if (status === 'Accepted') return { backgroundColor: '#dbeafe', color: '#1d4ed8' };
    if (status === 'Rejected') return { backgroundColor: '#fee2e2', color: '#991b1b' };
    return { backgroundColor: '#f3f4f6', color: '#374151' };
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Quotations &amp; Estimates</h1>
        <div className="flex gap-2" style={{ alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Search quotation or customer..."
              style={{ paddingLeft: '40px' }}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="form-control" 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: '150px' }}
          >
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Sent">Sent</option>
            <option value="Accepted">Accepted</option>
            <option value="Rejected">Rejected</option>
            <option value="Expired">Expired</option>
            <option value="Converted">Converted</option>
          </select>
          <button className="btn btn-primary" onClick={() => navigate('/create-quotation')}>
            + Create Quotation
          </button>
        </div>
      </div>

      <div className="card">
        <Table
          columns={[
            { header: 'Quotation No', accessor: 'quotationNumber' },
            { header: 'Date', accessor: 'date' },
            { header: 'Customer', accessor: 'customer' },
            { header: 'Status', accessor: 'status', align: 'center' },
            { header: 'Total', accessor: 'total', align: 'right' },
            { header: 'Actions', accessor: 'actions', align: 'center' },
          ]}
          data={filteredQuotations.map((qt: any) => ({
            id: qt.id,
            quotationNumber: qt.quotationNumber,
            date: new Date(qt.quotationDate).toLocaleDateString(),
            customer: qt.customerSnapshot?.name || 'Walk-in Customer',
            status: qt.status,
            total: formatCurrency(qt.grandTotal),
            actions: qt.id,
          }))}
          renderRow={(row) => (
            <tr key={row.id}>
              <td style={{ fontWeight: 600, color: 'var(--primary-color)' }}>{row.quotationNumber}</td>
              <td>{row.date}</td>
              <td>{row.customer}</td>
              <td style={{ textAlign: 'center' }}>
                <span className="badge" style={{
                  ...statusStyle(row.status),
                  padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600
                }}>
                  {row.status}
                </span>
              </td>
              <td style={{ textAlign: 'right', fontWeight: 600 }}>{row.total}</td>
              <td>
                <div className="flex gap-2 justify-center">
                  {row.status !== 'Converted' && (
                    <>
                      <button className="btn-icon" onClick={() => convertToBill(row.id)} title="Convert to Invoice" style={{ color: '#059669' }}>
                        <ArrowRightCircle size={18} />
                      </button>
                      <button className="btn-icon" onClick={() => navigate('/create-quotation', { state: { editQuotationId: row.id } })} title="Edit">
                        <Edit size={18} />
                      </button>
                    </>
                  )}
                  <button className="btn-icon" onClick={() => navigate('/create-quotation', { state: { duplicateQuotationId: row.id } })} title="Duplicate">
                    <Copy size={18} />
                  </button>
                  <button className="btn-icon" onClick={() => triggerDownload(row.id, 'pdf')} title="Download PDF" style={{ color: '#dc2626' }}>
                    <FileText size={18} />
                  </button>
                  <button className="btn-icon" onClick={() => triggerDownload(row.id, 'excel')} title="Download Excel" style={{ color: '#10b981' }}>
                    <DownloadCloud size={18} />
                  </button>
                  <button className="btn-icon" onClick={() => deleteQuotation(row.id)} title="Delete" style={{ color: 'var(--danger-color)' }}>
                    <Trash2 size={18} />
                  </button>
                </div>
              </td>
            </tr>
          )}
        />
        {filteredQuotations.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
            No quotations found. Create your first quotation!
          </div>
        )}
      </div>
    </div>
  );
};

export default Quotations;
