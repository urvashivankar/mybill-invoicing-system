import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { Quotation, QuotationItem, Customer } from '../types';
import { Plus, Trash2, Save, Users, Package, Eye, X, DownloadCloud, FileText, Lock, Search, Clock } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { numberToWords } from '../utils/numberToWords';
import { api } from '../api';

// ─── Recently Used Items helper ───────────────────────────────────────────────
const RECENT_KEY = 'mybill_recently_used_items';
const getRecentItems = (): string[] => {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
};
const addToRecent = (itemId: string) => {
  const existing = getRecentItems().filter(id => id !== itemId);
  localStorage.setItem(RECENT_KEY, JSON.stringify([itemId, ...existing].slice(0, 5)));
};

const CreateQuotation: React.FC = () => {
  const { customers, items, quotations, settings, refreshData } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const duplicateQuotationId = location.state?.duplicateQuotationId;
  const editQuotationId = location.state?.editQuotationId;

  const [quotationNumber, setQuotationNumber] = useState('');
  const [quotationDate, setQuotationDate] = useState(new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState('');

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerDetails, setCustomerDetails] = useState<Customer | undefined>();

  const [quotationItems, setQuotationItems] = useState<QuotationItem[]>([]);
  const [notes, setNotes] = useState(settings.defaultNotes || '');
  const [discount, setDiscount] = useState(0);
  const [templateType, setTemplateType] = useState(settings.defaultTemplate || 'classic');

  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedQuotationId, setSavedQuotationId] = useState<string | null>(null);

  // Quick item search
  const [itemSearch, setItemSearch] = useState('');
  const [recentItemIds, setRecentItemIds] = useState<string[]>(getRecentItems());

  // Refs for keyboard navigation
  const qtyRefs = useRef<(HTMLInputElement | null)[]>([]);
  const rateRefs = useRef<(HTMLInputElement | null)[]>([]);

  const loadQuotationData = (oldQt: Quotation, isDuplicate: boolean) => {
    setCustomerName(oldQt.customerName);
    setSelectedCustomerId(oldQt.customerId);
    setCustomerDetails(oldQt.customerSnapshot);
    setQuotationItems(oldQt.items.map((item: any) => ({ ...item, id: Date.now().toString() + Math.random() })));
    setNotes(oldQt.notes || '');
    setDiscount(oldQt.discount || 0);
    setValidUntil(oldQt.validUntil ? new Date(oldQt.validUntil).toISOString().split('T')[0] : '');
    setTemplateType(oldQt.templateType || 'classic');
    if (isDuplicate) {
      setQuotationNumber('');
      setQuotationDate(new Date().toISOString().split('T')[0]);
    } else {
      setQuotationNumber(oldQt.quotationNumber);
      setQuotationDate(new Date(oldQt.quotationDate).toISOString().split('T')[0]);
    }
  };

  const fetchNextQuotationNumber = async () => {
    try {
      const data = await api.getNextQuotationNumber();
      setQuotationNumber(data.nextNumber);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (duplicateQuotationId) {
      const oldQt = quotations.find(q => q.id === duplicateQuotationId);
      if (oldQt) { loadQuotationData(oldQt, true); fetchNextQuotationNumber(); }
    } else if (editQuotationId) {
      const oldQt = quotations.find(q => q.id === editQuotationId);
      if (oldQt) loadQuotationData(oldQt, false);
    } else {
      setNotes(settings.defaultNotes || '');
      fetchNextQuotationNumber();
    }
  }, [duplicateQuotationId, editQuotationId, quotations, settings]);

  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedCustomerId(id);
    const customer = customers.find(c => c.id === id);
    if (customer) { setCustomerName(customer.name); setCustomerDetails(customer); }
    else { setCustomerName(''); setCustomerDetails(undefined); }
  };

  const addEmptyItem = useCallback(() => {
    setQuotationItems(prev => [...prev, {
      id: Date.now().toString(), itemId: '', name: '', quantity: '' as any,
      rate: '' as any, unit: '', tax: settings.defaultTax || 0, amount: 0
    } as any]);
  }, [settings.defaultTax]);

  const handleItemSelect = (index: number, itemId: string) => {
    const itemDef = items.find(i => i.id === itemId);
    if (!itemDef) return;
    addToRecent(itemId);
    setRecentItemIds(getRecentItems());
    const newItems = [...quotationItems];
    newItems[index] = {
      ...newItems[index], itemId: itemDef.id, name: itemDef.itemName,
      unit: itemDef.unit || '', rate: itemDef.rate,
      tax: itemDef.gst || settings.defaultTax || 0,
      quantity: '' as any, amount: 0
    } as any;
    setQuotationItems(newItems);
    setTimeout(() => qtyRefs.current[index]?.focus(), 50);
  };

  const insertRecentItem = (itemId: string) => {
    const itemDef = items.find(i => i.id === itemId);
    if (!itemDef) return;
    addToRecent(itemId);
    setRecentItemIds(getRecentItems());
    setQuotationItems(prev => [...prev, {
      id: Date.now().toString(), itemId: itemDef.id, name: itemDef.itemName,
      unit: itemDef.unit || '', rate: itemDef.rate,
      tax: itemDef.gst || settings.defaultTax || 0,
      quantity: '' as any, amount: 0
    } as any]);
  };

  const updateItemField = (index: number, field: string, value: any) => {
    const newItems = [...quotationItems];
    (newItems[index] as any)[field] = value;
    const qty = parseFloat(newItems[index].quantity as any);
    const rate = parseFloat(newItems[index].rate as any);
    newItems[index].amount = (!isNaN(qty) && !isNaN(rate) && qty > 0 && rate >= 0) ? qty * rate : 0;
    setQuotationItems(newItems);
  };

  const removeItem = (index: number) => {
    setQuotationItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleQtyKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter') { e.preventDefault(); rateRefs.current[index]?.focus(); }
  };
  const handleRateKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addEmptyItem();
      setTimeout(() => qtyRefs.current[quotationItems.length]?.focus(), 80);
    }
  };

  const subtotal = quotationItems.reduce((sum, item) => sum + item.amount, 0);
  const taxTotal = quotationItems.reduce((sum, item) => sum + (item.amount * ((item as any).tax || 0) / 100), 0);
  const grandTotal = subtotal + taxTotal - discount;

  const handleSaveQuotation = async () => {
    if (!customerName && !selectedCustomerId) { alert('Please select or enter a customer.'); setShowPreview(false); return; }
    if (quotationItems.length === 0 || quotationItems.some((i: any) => !i.name)) { alert('Please add at least one valid item.'); setShowPreview(false); return; }
    if (quotationItems.some((i: any) => isNaN(parseFloat(i.quantity)) || isNaN(parseFloat(i.rate)) || parseFloat(i.quantity) <= 0 || parseFloat(i.rate) < 0)) {
      alert('Please enter valid quantity and rate.'); setShowPreview(false); return;
    }
    setIsSaving(true);
    try {
      const payload = {
        quotationNumber: editQuotationId ? quotationNumber : undefined,
        quotationDate, validUntil: validUntil || undefined,
        customerId: selectedCustomerId || undefined,
        customerName: customerName || 'Walk-in Customer',
        customerSnapshot: customerDetails || { name: customerName },
        items: quotationItems.map((i: any) => ({ itemId: i.itemId || undefined, itemName: i.name, unit: i.unit || '', quantity: i.quantity, rate: i.rate, amount: i.amount })),
        subtotal, taxAmount: taxTotal, discount, grandTotal,
        amountInWords: numberToWords(grandTotal), notes, templateType,
        bankDetailsSnapshot: { bankName: settings.bankName, branch: settings.branch, accountNumber: settings.accountNumber, ifscCode: settings.ifscCode },
        status: 'Draft'
      };
      let saved;
      if (editQuotationId) { saved = await api.updateQuotation(editQuotationId, payload); }
      else { saved = await api.createQuotation(payload); }
      setSavedQuotationId(saved.id);
      await refreshData();
    } catch (err) { console.error(err); alert('Failed to save quotation.'); }
    finally { setIsSaving(false); }
  };

  const downloadPdf = () => { if (savedQuotationId) window.open(api.getQuotationPdfUrl(savedQuotationId), '_blank'); };
  const downloadExcel = () => { if (savedQuotationId) window.open(api.getQuotationExcelUrl(savedQuotationId), '_blank'); };

  const filteredItems = itemSearch.trim()
    ? items.filter(i => i.itemName.toLowerCase().includes(itemSearch.toLowerCase()))
    : items;

  const recentItems = recentItemIds.map(id => items.find(i => i.id === id)).filter(Boolean) as typeof items;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{duplicateQuotationId ? 'Create Quotation from Existing' : editQuotationId ? 'Edit Quotation' : 'Create New Quotation'}</h1>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={() => navigate('/quotations')}>Cancel</button>
          <button className="btn btn-primary" onClick={() => setShowPreview(true)}><Eye size={18} /> Preview &amp; Save</button>
        </div>
      </div>

      {/* Basic Details */}
      <div className="card mb-4">
        <h2 style={{ fontSize: '1.125rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-color)' }}>
          <Users size={18} /> Basic Details
        </h2>
        <div className="form-row">
          <div className="form-group" style={{ maxWidth: '200px' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              Quotation Number <Lock size={14} className="text-secondary" />
            </label>
            <input type="text" className="form-control" value={quotationNumber || 'Auto...'} readOnly
              style={{ backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 600, cursor: 'not-allowed' }} />
          </div>
          <div className="form-group">
            <label className="form-label">Date</label>
            <input type="date" className="form-control" value={quotationDate} onChange={e => setQuotationDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Valid Until</label>
            <input type="date" className="form-control" value={validUntil} onChange={e => setValidUntil(e.target.value)} />
          </div>
        </div>
        <div className="form-row mt-4">
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Select Customer *</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select className="form-control" value={selectedCustomerId} onChange={handleCustomerChange}>
                <option value="">-- Select Saved Customer --</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
              </select>
              <input type="text" className="form-control" placeholder="Or type name manually..." value={customerName} onChange={e => setCustomerName(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="card mb-4">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-color)', margin: 0 }}>
            <Package size={18} /> Items
          </h2>
          <div style={{ position: 'relative', width: '260px' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Quick search items..."
              style={{ paddingLeft: '34px', fontSize: '0.875rem', height: '36px' }}
              value={itemSearch}
              onChange={e => setItemSearch(e.target.value)}
            />
          </div>
        </div>

        {recentItems.length > 0 && (
          <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
              <Clock size={13} /> Recently used:
            </span>
            {recentItems.map(item => (
              <button key={item.id} onClick={() => insertRecentItem(item.id)}
                style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: '20px', border: '1px solid #0d9488', backgroundColor: '#f0fdfa', color: '#0d9488', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 500 }}
                title={`Add ${item.itemName} — ₹${item.rate}`}>
                + {item.itemName}
              </button>
            ))}
          </div>
        )}

        <div className="bill-item-header" style={{ gridTemplateColumns: '2fr 3fr 1.5fr 1fr 1.5fr 1.5fr auto' }}>
          <div>Select Master Item</div><div>Particulars</div><div>Unit</div>
          <div>Qty</div><div>Rate (₹)</div><div>Amount (₹)</div><div></div>
        </div>

        {quotationItems.map((item: any, index) => (
          <div className="bill-item-row" key={item.id} style={{ gridTemplateColumns: '2fr 3fr 1.5fr 1fr 1.5fr 1.5fr auto' }}>
            <div>
              <select className="form-control" value={item.itemId || ''} onChange={(e) => handleItemSelect(index, e.target.value)}>
                <option value="">Select Item...</option>
                {filteredItems.map(i => <option key={i.id} value={i.id}>{i.itemName}</option>)}
              </select>
            </div>
            <div>
              <input type="text" className="form-control" value={item.name}
                onChange={(e) => updateItemField(index, 'name', e.target.value)} placeholder="Description" />
            </div>
            <div>
              <input type="text" list="create-quotation-units" className="form-control" placeholder="Select Unit"
                value={item.unit || ''} onChange={(e) => updateItemField(index, 'unit', e.target.value)} />
              {index === 0 && (
                <datalist id="create-quotation-units">
                  <option value="Nos" /><option value="Piece" /><option value="Feet" /><option value="Meter" />
                  <option value="Kg" /><option value="Litre" /><option value="Box" /><option value="Set" />
                  <option value="Visit" /><option value="Service" /><option value="Job" /><option value="Hour" /><option value="Day" />
                </datalist>
              )}
            </div>
            <div>
              <input
                ref={el => { qtyRefs.current[index] = el; }}
                type="number" min="0"
                step={['Feet', 'Meter', 'Kg', 'Litre'].includes(item.unit || '') ? 'any' : '1'}
                className="form-control hide-arrows" placeholder="Qty"
                value={item.quantity === '' ? '' : item.quantity}
                onChange={(e) => updateItemField(index, 'quantity', e.target.value)}
                onKeyDown={(e) => handleQtyKeyDown(e, index)}
              />
            </div>
            <div>
              <input
                ref={el => { rateRefs.current[index] = el; }}
                type="number" min="0" step="any"
                className="form-control hide-arrows" placeholder="Rate"
                value={item.rate === '' ? '' : item.rate}
                onChange={(e) => updateItemField(index, 'rate', e.target.value)}
                onKeyDown={(e) => handleRateKeyDown(e, index)}
              />
            </div>
            <div style={{ fontWeight: 600 }}>{item.amount > 0 ? `₹ ${item.amount.toFixed(2)}` : '₹ 0.00'}</div>
            <div>
              <button className="btn-icon" onClick={() => removeItem(index)} style={{ color: 'var(--danger-color)' }} title="Delete Item">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}

        {quotationItems.length === 0 && (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No items added. Click "+ Add Item" to get started.
          </div>
        )}

        <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={addEmptyItem}><Plus size={16} /> Add Item</button>
          {quotationItems.length > 0 && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Press <kbd style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '3px', padding: '1px 5px', fontSize: '0.7rem' }}>Enter</kbd> in Rate to add next item
            </span>
          )}
        </div>
      </div>

      {/* Totals */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '24px' }}>
        <div style={{ flex: 1, minWidth: '300px' }}>
          <div className="form-group">
            <label className="form-label">Terms &amp; Conditions / Notes</label>
            <textarea className="form-control" rows={4} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Thank you for your business!" />
          </div>
          <div className="form-group mt-4">
            <label className="form-label">Quotation Template</label>
            <select className="form-control" value={templateType} onChange={e => setTemplateType(e.target.value)} style={{ width: '200px' }}>
              <option value="classic">Classic Black &amp; White</option>
              <option value="color">Color Letterhead</option>
            </select>
          </div>
        </div>
        <div style={{ width: '350px', backgroundColor: '#f0fdfa', padding: '24px', borderRadius: '12px', border: '1px solid #d1fae5' }}>
          <div className="flex justify-between mb-3">
            <span style={{ color: 'var(--text-secondary)' }}>Subtotal:</span>
            <span style={{ fontWeight: 600 }}>₹ {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between mb-3">
            <span style={{ color: 'var(--text-secondary)' }}>Tax / GST:</span>
            <span style={{ fontWeight: 600 }}>₹ {taxTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between mb-4 items-center">
            <span style={{ color: 'var(--text-secondary)' }}>Discount (₹):</span>
            <input type="number" min="0" className="form-control" style={{ width: '120px', padding: '6px 12px' }} value={discount || ''} onChange={e => setDiscount(parseFloat(e.target.value) || 0)} />
          </div>
          <div style={{ borderTop: '2px dashed #99f6e4', margin: '16px 0' }}></div>
          <div className="flex justify-between items-center mb-2">
            <span style={{ fontWeight: 700, fontSize: '1.25rem' }}>Grand Total:</span>
            <span style={{ fontWeight: 800, fontSize: '1.5rem', color: '#0d9488' }}>₹ {grandTotal.toFixed(2)}</span>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'right' }}>{numberToWords(grandTotal)}</div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '24px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <button className="btn-icon" style={{ position: 'absolute', top: '16px', right: '16px' }} onClick={() => setShowPreview(false)}>
              <X size={24} />
            </button>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '24px', textAlign: 'center', color: '#0d9488' }}>Quotation Preview</h2>

            {savedQuotationId ? (
              <div style={{ backgroundColor: '#f0fdfa', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '32px', textAlign: 'center' }}>
                <h3 style={{ color: '#065f46', marginBottom: '8px' }}>Quotation Saved Successfully!</h3>
                <p style={{ color: '#047857', marginBottom: '20px' }}>Download your quotation below</p>
                <div className="flex justify-center gap-4">
                  <button className="btn btn-secondary" onClick={() => { setShowPreview(false); navigate('/quotations'); }}>Go to Quotations</button>
                  <button className="btn btn-primary" style={{ backgroundColor: '#0d9488' }} onClick={downloadPdf}><FileText size={18} /> Download PDF</button>
                  <button className="btn btn-primary" style={{ backgroundColor: '#10b981' }} onClick={downloadExcel}><DownloadCloud size={18} /> Download Excel</button>
                </div>
              </div>
            ) : (
              <>
                {/* Quotation Preview Content */}
                <div style={{ border: `2px solid ${templateType === 'color' ? '#d1fae5' : '#000'}`, padding: '32px', borderRadius: '8px', backgroundColor: templateType === 'color' ? '#fafffe' : '#fff' }}>
                  {/* Header */}
                  <div style={{ backgroundColor: templateType === 'color' ? '#0d9488' : '#fff', color: templateType === 'color' ? '#fff' : '#000', border: templateType === 'color' ? 'none' : '2px solid #000', textAlign: 'center', padding: '10px', borderRadius: '4px', fontSize: '1.5rem', fontWeight: 800, letterSpacing: '3px', marginBottom: '20px' }}>
                    QUOTATION
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div style={{ backgroundColor: templateType === 'color' ? '#f0fdfa' : '#fff', border: `1px solid ${templateType === 'color' ? '#d1fae5' : '#000'}`, borderRadius: '6px', padding: '12px' }}>
                      <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#6b7280', marginBottom: '4px' }}>From</div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: templateType === 'color' ? '#0d9488' : '#000' }}>{settings.businessName}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>{settings.address}</div>
                      {settings.phone && <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Phone: {settings.phone}</div>}
                    </div>
                    <div style={{ backgroundColor: templateType === 'color' ? '#f0fdfa' : '#fff', border: `1px solid ${templateType === 'color' ? '#d1fae5' : '#000'}`, borderRadius: '6px', padding: '12px' }}>
                      <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#6b7280', marginBottom: '6px' }}>Quotation Details</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Quotation No:</span>
                        <span style={{ fontWeight: 700, color: templateType === 'color' ? '#0d9488' : '#000' }}>{quotationNumber || 'Auto-generated'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Date:</span>
                        <span>{quotationDate ? new Date(quotationDate).toLocaleDateString() : '-'}</span>
                      </div>
                      {validUntil && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Valid Until:</span>
                          <span style={{ color: templateType === 'color' ? '#065f46' : '#000', fontWeight: 600 }}>{new Date(validUntil).toLocaleDateString()}</span>
                        </div>
                      )}
                      {(customerName || customerDetails) && (
                        <>
                          <div style={{ borderTop: `1px solid ${templateType === 'color' ? '#d1fae5' : '#000'}`, paddingTop: '8px', marginTop: '4px', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#6b7280', marginBottom: '4px' }}>Bill To</div>
                          <div style={{ fontWeight: 700 }}>{customerDetails?.name || customerName}</div>
                          {customerDetails?.phone && <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Phone: {customerDetails.phone}</div>}
                        </>
                      )}
                    </div>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
                    <thead>
                      <tr style={{ backgroundColor: templateType === 'color' ? '#0d9488' : '#fff', color: templateType === 'color' ? '#fff' : '#000' }}>
                        <th style={{ padding: '10px', textAlign: 'center', width: '50px', border: `1px solid ${templateType === 'color' ? '#d1fae5' : '#000'}` }}>Sr</th>
                        <th style={{ padding: '10px', textAlign: 'left', border: `1px solid ${templateType === 'color' ? '#d1fae5' : '#000'}` }}>Particulars</th>
                        <th style={{ padding: '10px', textAlign: 'center', width: '80px', border: `1px solid ${templateType === 'color' ? '#d1fae5' : '#000'}` }}>Qty</th>
                        <th style={{ padding: '10px', textAlign: 'right', width: '120px', border: `1px solid ${templateType === 'color' ? '#d1fae5' : '#000'}` }}>Rate</th>
                        <th style={{ padding: '10px', textAlign: 'right', width: '140px', border: `1px solid ${templateType === 'color' ? '#d1fae5' : '#000'}` }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quotationItems.map((item: any, idx) => (
                        <tr key={idx} style={{ backgroundColor: templateType === 'color' ? (idx % 2 === 0 ? '#fafffe' : '#f0fdfa') : '#fff' }}>
                          <td style={{ padding: '8px', textAlign: 'center', border: `1px solid ${templateType === 'color' ? '#d1fae5' : '#000'}` }}>{idx + 1}</td>
                          <td style={{ padding: '8px', border: `1px solid ${templateType === 'color' ? '#d1fae5' : '#000'}` }}>{item.name}</td>
                          <td style={{ padding: '8px', textAlign: 'center', border: `1px solid ${templateType === 'color' ? '#d1fae5' : '#000'}` }}>{Number(item.quantity).toString()} {item.unit || ''}</td>
                          <td style={{ padding: '8px', textAlign: 'right', border: `1px solid ${templateType === 'color' ? '#d1fae5' : '#000'}` }}>{parseFloat(item.rate).toFixed(2)}</td>
                          <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600, border: `1px solid ${templateType === 'color' ? '#d1fae5' : '#000'}` }}>{item.amount > 0 ? item.amount.toFixed(2) : '0.00'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex justify-between">
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, marginBottom: '4px' }}>Amount in Words:</p>
                      <p style={{ fontSize: '0.875rem', fontStyle: 'italic', color: templateType === 'color' ? '#0d9488' : '#000' }}>{numberToWords(grandTotal)}</p>
                    </div>
                    <div style={{ width: '240px' }}>
                      <div className="flex justify-between mt-2 pt-2" style={{ borderTop: `2px solid ${templateType === 'color' ? '#0d9488' : '#000'}`, fontWeight: 700, fontSize: '1.125rem', color: templateType === 'color' ? '#0d9488' : '#000' }}>
                        <span>Grand Total:</span><span>₹ {grandTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 justify-end mt-6">
                  <button className="btn btn-secondary" onClick={() => setShowPreview(false)}>← Edit Quotation</button>
                  <button className="btn btn-primary" style={{ backgroundColor: '#0d9488' }} onClick={handleSaveQuotation} disabled={isSaving}>
                    {isSaving ? 'Saving...' : <><Save size={18} /> Confirm &amp; Save</>}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateQuotation;
