import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { Bill, BillItem, Customer } from '../types';
import { Plus, Trash2, Save, Users, Package, Eye, X, DownloadCloud, FileText, Lock, Search, Clock } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { numberToWords } from '../utils/numberToWords';
import ImportModal from '../components/ImportModal';
import { api } from '../api';

// ─── Recently Used Items helper ──────────────────────────────────────────────
const RECENT_KEY = 'mybill_recently_used_items';
const getRecentItems = (): string[] => {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
};
const addToRecent = (itemId: string) => {
  const existing = getRecentItems().filter(id => id !== itemId);
  localStorage.setItem(RECENT_KEY, JSON.stringify([itemId, ...existing].slice(0, 5)));
};

const CreateBill: React.FC = () => {
  const { customers, items, bills, settings, refreshData } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const duplicateBillId = location.state?.duplicateBillId;
  const editBillId = location.state?.editBillId;

  const [billNumber, setBillNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [orderDate, setOrderDate] = useState('');
  const [vendorCode, setVendorCode] = useState('');
  const [woNumber, setWoNumber] = useState('');
  const [woDate, setWoDate] = useState('');

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerDetails, setCustomerDetails] = useState<Customer | undefined>();

  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [notes, setNotes] = useState(settings.defaultNotes || '');
  const [discount, setDiscount] = useState(0);
  const [templateType, setTemplateType] = useState(settings.defaultTemplate || 'classic');

  const [showPreview, setShowPreview] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedBillId, setSavedBillId] = useState<string | null>(null);

  // Quick item search
  const [itemSearch, setItemSearch] = useState('');
  const [recentItemIds, setRecentItemIds] = useState<string[]>(getRecentItems());

  // Refs for keyboard navigation (qty inputs)
  const qtyRefs = useRef<(HTMLInputElement | null)[]>([]);
  const rateRefs = useRef<(HTMLInputElement | null)[]>([]);

  const loadBillData = (oldBill: Bill, isDuplicate: boolean) => {
    setCustomerName(oldBill.customerName);
    setSelectedCustomerId(oldBill.customerId);
    setCustomerDetails(oldBill.customerSnapshot);
    setBillItems(oldBill.items.map((item: any) => ({ ...item, id: Date.now().toString() + Math.random() })));
    setNotes(oldBill.notes || '');
    setDiscount(oldBill.discount || 0);
    setOrderDate(oldBill.orderDate ? new Date(oldBill.orderDate).toISOString().split('T')[0] : '');
    setVendorCode(oldBill.vendorCode || '');
    setWoNumber(oldBill.woNumber || '');
    setWoDate(oldBill.woDate ? new Date(oldBill.woDate).toISOString().split('T')[0] : '');
    setTemplateType(oldBill.templateType || 'classic');
    if (isDuplicate) {
      setBillNumber('');
      setDate(new Date().toISOString().split('T')[0]);
    } else {
      setBillNumber(oldBill.billNumber);
      setDate(new Date(oldBill.invoiceDate).toISOString().split('T')[0]);
    }
  };

  const fetchNextBillNumber = async () => {
    try {
      const data = await api.getNextBillNumber();
      setBillNumber(data.nextBillNumber);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    const init = async () => {
      if (duplicateBillId) {
        try {
          const oldBill = await api.getBill(duplicateBillId);
          if (oldBill) { loadBillData(oldBill, true); fetchNextBillNumber(); }
        } catch(e) { console.error(e); }
      } else if (editBillId) {
        try {
          const oldBill = await api.getBill(editBillId);
          if (oldBill) loadBillData(oldBill, false);
        } catch(e) { console.error(e); }
      } else {
        setNotes(settings.defaultNotes || '');
        fetchNextBillNumber();
      }
    };
    init();
  }, [duplicateBillId, editBillId, settings]);

  const handleImportBill = (billData: any[]) => {
    if (!billData || billData.length === 0) return;
    const firstRow = billData[0];
    if (firstRow['Customer Name'] || firstRow['Customer']) {
      setCustomerName(firstRow['Customer Name'] || firstRow['Customer']);
    }
    const importedItems: BillItem[] = billData.filter(row => row['Item Name'] || row['Item']).map((row, idx) => {
      const qty = parseFloat(row['Qty'] || row['Quantity'] || 1) || 1;
      const rate = parseFloat(row['Rate'] || row['Price'] || 0) || 0;
      return { id: Date.now().toString() + idx, itemId: '', name: row['Item Name'] || row['Item'] || 'Imported Item', quantity: qty, rate, tax: parseFloat(row['Tax %'] || row['GST'] || 0) || 0, amount: qty * rate } as any;
    });
    if (importedItems.length > 0) { setBillItems(importedItems); alert('Bill items imported successfully! Please review the details.'); }
  };

  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedCustomerId(id);
    const customer = customers.find(c => c.id === id);
    if (customer) { setCustomerName(customer.name); setCustomerDetails(customer); }
    else { setCustomerName(''); setCustomerDetails(undefined); }
  };

  const addEmptyItem = useCallback(() => {
    setBillItems(prev => [...prev, {
      id: Date.now().toString(), itemId: '', name: '', quantity: '' as any,
      rate: '' as any, unit: '', tax: settings.defaultTax || 0, amount: 0
    } as any]);
  }, [settings.defaultTax]);

  const handleItemSelect = (index: number, itemId: string) => {
    const itemDef = items.find(i => i.id === itemId);
    if (!itemDef) return;
    addToRecent(itemId);
    setRecentItemIds(getRecentItems());
    const newBillItems = [...billItems];
    newBillItems[index] = {
      ...newBillItems[index],
      itemId: itemDef.id, name: itemDef.itemName, unit: itemDef.unit || '',
      rate: itemDef.rate, tax: itemDef.gst || settings.defaultTax || 0,
      quantity: '' as any, amount: 0
    } as any;
    setBillItems(newBillItems);
    // Focus qty field after selecting item
    setTimeout(() => qtyRefs.current[index]?.focus(), 50);
  };

  const insertRecentItem = (itemId: string) => {
    const itemDef = items.find(i => i.id === itemId);
    if (!itemDef) return;
    addToRecent(itemId);
    setRecentItemIds(getRecentItems());
    setBillItems(prev => [...prev, {
      id: Date.now().toString(), itemId: itemDef.id, name: itemDef.itemName,
      unit: itemDef.unit || '', rate: itemDef.rate,
      tax: itemDef.gst || settings.defaultTax || 0,
      quantity: '' as any, amount: 0
    } as any]);
  };

  const updateItemField = (index: number, field: string, value: any) => {
    const newBillItems = [...billItems];
    (newBillItems[index] as any)[field] = value;
    const qty = parseFloat(newBillItems[index].quantity);
    const rate = parseFloat(newBillItems[index].rate);
    newBillItems[index].amount = (!isNaN(qty) && !isNaN(rate) && qty > 0 && rate >= 0) ? qty * rate : 0;
    setBillItems(newBillItems);
  };

  const removeItem = (index: number) => {
    setBillItems(prev => prev.filter((_, i) => i !== index));
  };

  // Keyboard navigation: Enter in qty → focus rate; Enter in rate → add new row
  const handleQtyKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter') { e.preventDefault(); rateRefs.current[index]?.focus(); }
  };
  const handleRateKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addEmptyItem();
      setTimeout(() => qtyRefs.current[billItems.length]?.focus(), 80);
    }
  };

  const subtotal = billItems.reduce((sum, item) => sum + item.amount, 0);
  const taxTotal = billItems.reduce((sum, item) => sum + (item.amount * ((item as any).tax || 0) / 100), 0);
  const grandTotal = subtotal + taxTotal - discount;

  const handleSaveBill = async () => {
    if (!customerName && !selectedCustomerId) { alert('Please select or enter a customer.'); setShowPreview(false); return; }
    if (billItems.length === 0 || billItems.some((i: any) => !i.name)) { alert('Please add at least one valid item with a description.'); setShowPreview(false); return; }
    if (billItems.some((i: any) => isNaN(parseFloat(i.quantity)) || isNaN(parseFloat(i.rate)) || parseFloat(i.quantity) <= 0 || parseFloat(i.rate) < 0)) {
      alert('Please enter a valid quantity and rate for all items.'); setShowPreview(false); return;
    }
    setIsSaving(true);
    try {
      const payload = {
        billNumber: editBillId ? billNumber : undefined,
        invoiceDate: date, orderDate: orderDate || undefined,
        woNumber: woNumber || undefined, woDate: woDate || undefined,
        vendorCode: vendorCode || undefined,
        customerId: selectedCustomerId || undefined,
        customerName: customerName || 'Walk-in Customer',
        customerSnapshot: customerDetails || { name: customerName },
        items: billItems.map((i: any) => ({ itemId: i.itemId || undefined, itemName: i.name, unit: i.unit || '', quantity: i.quantity, rate: i.rate, amount: i.amount })),
        subtotal, taxAmount: taxTotal, discount, grandTotal,
        amountInWords: numberToWords(grandTotal), notes, templateType,
        bankDetailsSnapshot: { bankName: settings.bankName, branch: settings.branch, accountNumber: settings.accountNumber, ifscCode: settings.ifscCode }
      };
      let saved;
      if (editBillId) { saved = await api.updateBill(editBillId, payload); }
      else { saved = await api.createBill(payload); }
      setSavedBillId(saved.id);
      await refreshData();
    } catch (err) { console.error(err); alert('Failed to save bill.'); }
    finally { setIsSaving(false); }
  };

  const downloadPdf = () => { if (savedBillId) window.open(api.getPdfUrl(savedBillId), '_blank'); };
  const downloadExcel = () => { if (savedBillId) window.open(api.getExcelUrl(savedBillId), '_blank'); };

  // Filtered items for quick-search
  const filteredItems = itemSearch.trim()
    ? items.filter(i => i.itemName.toLowerCase().includes(itemSearch.toLowerCase()))
    : items;

  const recentItems = recentItemIds.map(id => items.find(i => i.id === id)).filter(Boolean) as typeof items;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{duplicateBillId ? 'Create Bill from Existing' : editBillId ? 'Edit Bill' : 'Create New Bill'}</h1>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={() => setShowImportModal(true)}><DownloadCloud size={18} /> Import Bill</button>
          <button className="btn btn-secondary" onClick={() => navigate('/bills')}>Cancel</button>
          <button className="btn btn-primary" onClick={() => setShowPreview(true)}><Eye size={18} /> Preview &amp; Save</button>
        </div>
      </div>

      {showImportModal && <ImportModal type="bill" onClose={() => setShowImportModal(false)} onImportBill={handleImportBill} />}

      {/* Basic Details */}
      <div className="card mb-4">
        <h2 style={{ fontSize: '1.125rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-color)' }}>
          <Users size={18} /> Basic Details
        </h2>
        <div className="form-row">
          <div className="form-group" style={{ maxWidth: '200px' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              Bill Number <Lock size={14} className="text-secondary" />
            </label>
            <input type="text" className="form-control" value={billNumber || 'Auto...'} readOnly
              style={{ backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 600, cursor: 'not-allowed' }} />
          </div>
          <div className="form-group">
            <label className="form-label">Date</label>
            <input type="date" className="form-control" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="form-group" style={{ flex: 2 }}>
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
        <div className="form-row">
          <div className="form-group"><label className="form-label">Order Date</label><input type="date" className="form-control" value={orderDate} onChange={e => setOrderDate(e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Vendor Code</label><input type="text" className="form-control" value={vendorCode} onChange={e => setVendorCode(e.target.value)} /></div>
          <div className="form-group"><label className="form-label">W.O Number</label><input type="text" className="form-control" value={woNumber} onChange={e => setWoNumber(e.target.value)} /></div>
          <div className="form-group"><label className="form-label">W.O Date</label><input type="date" className="form-control" value={woDate} onChange={e => setWoDate(e.target.value)} /></div>
        </div>
      </div>

      {/* Items */}
      <div className="card mb-4">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-color)', margin: 0 }}>
            <Package size={18} /> Items
          </h2>
          {/* Quick Search */}
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

        {/* Recently Used Items */}
        {recentItems.length > 0 && (
          <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
              <Clock size={13} /> Recently used:
            </span>
            {recentItems.map(item => (
              <button
                key={item.id}
                onClick={() => insertRecentItem(item.id)}
                style={{
                  fontSize: '0.75rem', padding: '3px 10px', borderRadius: '20px',
                  border: '1px solid var(--primary-color)', backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary-color)', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 500
                }}
                title={`Add ${item.itemName} — ₹${item.rate}`}
              >
                + {item.itemName}
              </button>
            ))}
          </div>
        )}

        <div className="bill-item-header" style={{ gridTemplateColumns: '2fr 3fr 1.5fr 1fr 1.5fr 1.5fr auto' }}>
          <div>Select Master Item</div>
          <div>Particulars</div>
          <div>Unit</div>
          <div>Qty</div>
          <div>Rate (₹)</div>
          <div>Amount (₹)</div>
          <div></div>
        </div>

        {billItems.map((item: any, index) => (
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
              <input type="text" list="create-bill-units" className="form-control" placeholder="Select Unit"
                value={item.unit || ''} onChange={(e) => updateItemField(index, 'unit', e.target.value)} />
              {index === 0 && (
                <datalist id="create-bill-units">
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

        {billItems.length === 0 && (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No items added. Click "+ Add Item" or use a recently used item chip above.
          </div>
        )}

        <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={addEmptyItem}><Plus size={16} /> Add Item</button>
          {billItems.length > 0 && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Tip: Press <kbd style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '3px', padding: '1px 5px', fontSize: '0.7rem' }}>Enter</kbd> in Rate field to add next item
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
            <label className="form-label">Invoice Template</label>
            <select className="form-control" value={templateType} onChange={e => setTemplateType(e.target.value)} style={{ width: '200px' }}>
              <option value="classic">Classic Black &amp; White</option>
              <option value="color">Color Letterhead</option>
              <option value="excel">Excel Invoice</option>
            </select>
          </div>
        </div>
        <div style={{ width: '350px', backgroundColor: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div className="flex justify-between mb-3">
            <span style={{ color: 'var(--text-secondary)' }}>Subtotal:</span>
            <span style={{ fontWeight: 600 }}>₹ {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between mb-3 items-center">
            <span style={{ color: 'var(--text-secondary)' }}>Tax / GST (₹):</span>
            <span style={{ fontWeight: 600 }}>₹ {taxTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between mb-4 items-center">
            <span style={{ color: 'var(--text-secondary)' }}>Discount (₹):</span>
            <input type="number" min="0" className="form-control" style={{ width: '120px', padding: '6px 12px' }} value={discount || ''} onChange={e => setDiscount(parseFloat(e.target.value) || 0)} />
          </div>
          <div style={{ borderTop: '2px dashed var(--border-color)', margin: '16px 0' }}></div>
          <div className="flex justify-between items-center mb-2">
            <span style={{ fontWeight: 700, fontSize: '1.25rem' }}>Grand Total:</span>
            <span style={{ fontWeight: 800, fontSize: '1.5rem', color: 'var(--primary-color)' }}>₹ {grandTotal.toFixed(2)}</span>
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
            <h2 style={{ fontSize: '1.5rem', marginBottom: '24px', textAlign: 'center' }}>Invoice Preview</h2>

            {savedBillId ? (
              <div className="alert" style={{ backgroundColor: '#f0fdf4', color: '#15803d', borderColor: '#bbf7d0', textAlign: 'center', padding: '32px' }}>
                <h3 style={{ marginBottom: '8px' }}>Bill Saved Successfully!</h3>
                <p style={{ marginBottom: '20px', color: '#166534' }}>Download your invoice below</p>
                <div className="flex justify-center gap-4">
                  <button className="btn btn-secondary" onClick={() => { setShowPreview(false); navigate('/bills'); }}>Go to Bills</button>
                  <button className="btn btn-primary" onClick={downloadPdf}><FileText size={18} /> Download PDF</button>
                  <button className="btn btn-primary" style={{ backgroundColor: '#10b981' }} onClick={downloadExcel}><DownloadCloud size={18} /> Download Excel</button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ border: '1px solid #e2e8f0', padding: '32px', borderRadius: '4px', backgroundColor: 'white' }}>
                  <div className="flex justify-between" style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '16px', marginBottom: '16px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-color)' }}>{settings.businessName}</h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{settings.address}</p>
                      {settings.phone && <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Phone: {settings.phone}</p>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '1px', marginBottom: '12px' }}>INVOICE</h1>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.9rem' }}>
                        <div><strong>Invoice No:</strong> <span style={{ color: 'var(--primary-color)', fontWeight: 600 }}>{billNumber || 'Auto-generated'}</span></div>
                        <div><strong>Date:</strong> {date ? new Date(date).toLocaleDateString() : '-'}</div>
                        {vendorCode && <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}><strong>Vendor Code:</strong> {vendorCode}</div>}
                        {woNumber && <div><strong>W.O NO:</strong> {woNumber}</div>}
                        {woDate && <div><strong>W.O Date:</strong> {new Date(woDate).toLocaleDateString()}</div>}
                      </div>
                    </div>
                  </div>

                  {/* Bill To */}
                  {(customerName || customerDetails) && (
                    <div style={{ marginBottom: '16px', padding: '12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#6b7280', marginBottom: '4px' }}>Bill To</div>
                      <div style={{ fontWeight: 700, fontSize: '1rem' }}>{customerDetails?.name || customerName}</div>
                      {customerDetails?.address && <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{customerDetails.address}</div>}
                      {customerDetails?.phone && <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Phone: {customerDetails.phone}</div>}
                    </div>
                  )}

                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f1f5f9', borderTop: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>
                        <th style={{ padding: '8px', textAlign: 'center', width: '60px' }}>Sr.No</th>
                        <th style={{ padding: '8px', textAlign: 'left' }}>Particulars</th>
                        <th style={{ padding: '8px', textAlign: 'center', width: '80px' }}>Qty</th>
                        <th style={{ padding: '8px', textAlign: 'right', width: '120px' }}>Rate</th>
                        <th style={{ padding: '8px', textAlign: 'right', width: '140px' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {billItems.map((item: any, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '8px', textAlign: 'center' }}>{idx + 1}</td>
                          <td style={{ padding: '8px' }}>{item.name}</td>
                          <td style={{ padding: '8px', textAlign: 'center' }}>{item.quantity} {item.unit || ''}</td>
                          <td style={{ padding: '8px', textAlign: 'right' }}>{parseFloat(item.rate).toFixed(2)}</td>
                          <td style={{ padding: '8px', textAlign: 'right', fontWeight: 500 }}>{item.amount > 0 ? item.amount.toFixed(2) : '0.00'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex justify-between">
                    <div style={{ flex: 1 }}>
                      <p><strong>Amount in Words:</strong></p>
                      <p style={{ fontSize: '0.875rem', fontStyle: 'italic', marginBottom: '16px' }}>{numberToWords(grandTotal)}</p>
                    </div>
                    <div style={{ width: '280px' }}>
                      {discount > 0 && <div className="flex justify-between mb-1 text-sm"><span>Subtotal:</span><span>₹ {subtotal.toFixed(2)}</span></div>}
                      {taxTotal > 0 && <div className="flex justify-between mb-1 text-sm"><span>Tax/GST:</span><span>₹ {taxTotal.toFixed(2)}</span></div>}
                      {discount > 0 && <div className="flex justify-between mb-1 text-sm"><span>Discount:</span><span>-₹ {discount.toFixed(2)}</span></div>}
                      <div className="flex justify-between mt-2 pt-2" style={{ borderTop: '2px solid #e2e8f0', fontWeight: 700, fontSize: '1.125rem' }}>
                        <span>Grand Total:</span><span>₹ {grandTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 justify-end mt-6">
                  <button className="btn btn-secondary" onClick={() => setShowPreview(false)}>← Edit Bill</button>
                  <button className="btn btn-primary" onClick={handleSaveBill} disabled={isSaving}>
                    {isSaving ? 'Saving...' : <><Save size={18} /> Confirm &amp; Save Bill</>}
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

export default CreateBill;
