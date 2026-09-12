import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Plus, Edit2, Trash2, Search, ChevronDown, ChevronRight, FileText, Copy } from 'lucide-react';
import { api } from '../api';
import { Table } from '../components/ui/Table';
import { formatCurrency } from '../utils/format';
import { useNavigate } from 'react-router-dom';

const Customers: React.FC = () => {
  const { customers, bills, refreshData } = useAppContext();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', address: '', gstNumber: ''
  });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filteredCustomers = customers.filter((c: any) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.phone || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingId) { await api.updateCustomer(editingId, formData); }
      else { await api.createCustomer(formData); }
      await refreshData();
      setShowForm(false); setEditingId(null);
      setFormData({ name: '', phone: '', email: '', address: '', gstNumber: '' });
    } catch { alert('Failed to save customer'); }
    finally { setIsSaving(false); }
  };

  const editCustomer = (customer: any) => {
    setFormData({ name: customer.name, phone: customer.phone || '', email: customer.email || '', address: customer.address || '', gstNumber: customer.gstNumber || '' });
    setEditingId(customer.id); setShowForm(true);
  };

  const deleteCustomer = async (id: string) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      try { await api.deleteCustomer(id); setSelectedIds(selectedIds.filter(s => s !== id)); await refreshData(); }
      catch { alert('Failed to delete customer'); }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Delete ${selectedIds.length} customers?`)) {
      try { await api.bulkDeleteCustomers(selectedIds); setSelectedIds([]); await refreshData(); }
      catch { alert('Failed to delete customers'); }
    }
  };

  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.length === filteredCustomers.length ? [] : filteredCustomers.map((c: any) => c.id));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(selectedIds.includes(id) ? selectedIds.filter(s => s !== id) : [...selectedIds, id]);
  };

  const toggleExpand = (id: string) => {
    setExpandedCustomerId(expandedCustomerId === id ? null : id);
  };

  const getCustomerBills = (customerId: string) => {
    return bills
      .filter((b: any) => b.customerId === customerId || b.customerSnapshot?.id === customerId)
      .sort((a: any, b: any) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime())
      .slice(0, 5);
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, { bg: string; color: string }> = {
      'Paid': { bg: '#dcfce7', color: '#166534' },
      'Partially Paid': { bg: '#fef9c3', color: '#854d0e' },
      'Unpaid': { bg: '#fee2e2', color: '#991b1b' },
    };
    const s = styles[status] || styles['Unpaid'];
    return (
      <span style={{ ...s, padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
        {status}
      </span>
    );
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Customers</h1>
        <div className="flex gap-2" style={{ alignItems: 'center' }}>
          {selectedIds.length > 0 && (
            <button className="btn btn-secondary" onClick={handleBulkDelete} style={{ color: 'var(--danger-color)', borderColor: 'var(--danger-color)' }}>
              <Trash2 size={18} /> Delete Selected ({selectedIds.length})
            </button>
          )}
          <div style={{ position: 'relative', width: '260px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input type="text" className="form-control" placeholder="Search by name or phone..."
              style={{ paddingLeft: '40px' }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          {!showForm && (
            <button className="btn btn-primary" onClick={() => { setFormData({ name: '', phone: '', email: '', address: '', gstNumber: '' }); setEditingId(null); setShowForm(true); }}>
              <Plus size={18} /> Add Customer
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.125rem', marginBottom: '16px', color: 'var(--primary-color)' }}>
            {editingId ? 'Edit Customer' : 'Add New Customer'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group" style={{ flex: 2 }}>
                <label className="form-label">Customer Name *</label>
                <input type="text" className="form-control" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input type="text" className="form-control" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-control" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">GST Number</label>
                <input type="text" className="form-control" value={formData.gstNumber} onChange={e => setFormData({ ...formData, gstNumber: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Billing Address</label>
              <textarea className="form-control" rows={3} value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
            </div>
            <div className="flex gap-2 justify-end" style={{ marginTop: '16px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Customer'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {/* Table Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '40px 24px 1.5fr 1fr 1fr 1fr 100px', gap: '12px', padding: '10px 16px', backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>
          <div style={{ textAlign: 'center' }}>
            <input type="checkbox" checked={customers.length > 0 && selectedIds.length === filteredCustomers.length} onChange={toggleSelectAll} />
          </div>
          <div></div>
          <div>Customer Name</div>
          <div>Phone</div>
          <div>Email</div>
          <div>GSTIN</div>
          <div style={{ textAlign: 'center' }}>Actions</div>
        </div>

        {filteredCustomers.map((customer: any) => {
          const customerBills = getCustomerBills(customer.id);
          const isExpanded = expandedCustomerId === customer.id;

          return (
            <div key={customer.id}>
              {/* Customer Row */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '40px 24px 1.5fr 1fr 1fr 1fr 100px',
                  gap: '12px',
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border-color)',
                  alignItems: 'center',
                  backgroundColor: selectedIds.includes(customer.id) ? 'var(--primary-light)' : 'transparent',
                  transition: 'background 0.15s'
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <input type="checkbox" checked={selectedIds.includes(customer.id)} onChange={() => toggleSelect(customer.id)} />
                </div>
                <div>
                  <button
                    onClick={() => toggleExpand(customer.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: customerBills.length > 0 ? 'var(--primary-color)' : '#d1d5db', display: 'flex', alignItems: 'center' }}
                    title={customerBills.length > 0 ? `${customerBills.length} bills — click to expand` : 'No bills yet'}
                  >
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                </div>
                <div>
                  <div style={{ fontWeight: 500 }}>{customer.name}</div>
                  {customer.address && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '220px' }}>
                      {customer.address}
                    </div>
                  )}
                </div>
                <div>{customer.phone || '-'}</div>
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{customer.email || '-'}</div>
                <div style={{ fontSize: '0.875rem' }}>{customer.gstNumber || '-'}</div>
                <div>
                  <div className="flex gap-2 justify-center">
                    <button className="btn-icon" onClick={() => editCustomer(customer)} title="Edit Customer"><Edit2 size={16} /></button>
                    <button className="btn-icon" onClick={() => deleteCustomer(customer.id)} title="Delete Customer" style={{ color: 'var(--danger-color)' }}><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>

              {/* Expanded Previous Bills Panel */}
              {isExpanded && (
                <div style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid var(--primary-color)', padding: '0 16px 16px 64px' }}>
                  <div style={{ paddingTop: '12px', marginBottom: '8px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileText size={13} /> Previous Bills ({customerBills.length > 0 ? `last ${customerBills.length}` : 'none'})
                  </div>
                  {customerBills.length === 0 ? (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', padding: '8px 0' }}>
                      No bills found for this customer.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {customerBills.map((bill: any) => (
                        <div key={bill.id} style={{
                          display: 'grid', gridTemplateColumns: '140px 120px 120px 100px 1fr',
                          gap: '12px', alignItems: 'center', padding: '8px 12px',
                          backgroundColor: '#fff', borderRadius: '6px', border: '1px solid var(--border-color)'
                        }}>
                          <div style={{ fontWeight: 700, color: 'var(--primary-color)', fontSize: '0.875rem' }}>{bill.billNumber}</div>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{formatCurrency(bill.grandTotal)}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {new Date(bill.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                          <div>{statusBadge(bill.paymentStatus || 'Unpaid')}</div>
                          <div className="flex gap-2">
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '3px 10px', fontSize: '0.75rem', height: 'auto' }}
                              onClick={() => navigate('/bills')}
                              title="View in Bills"
                            >
                              <FileText size={12} /> View
                            </button>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '3px 10px', fontSize: '0.75rem', height: 'auto' }}
                              onClick={() => navigate('/create-bill', { state: { duplicateBillId: bill.id } })}
                              title="Duplicate Bill"
                            >
                              <Copy size={12} /> Duplicate
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filteredCustomers.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
            {searchTerm ? 'No customers match your search.' : 'No customers found. Add your first customer!'}
          </div>
        )}
      </div>
    </div>
  );
};

export default Customers;
