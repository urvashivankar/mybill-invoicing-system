import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Save, Building2, Landmark, FileText, Upload, X } from 'lucide-react';
import { api } from '../api';

const Settings: React.FC = () => {
  const { settings, refreshData } = useAppContext();
  const [formData, setFormData] = useState({ ...settings });
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'signature' | 'letterhead') => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormData({ ...formData, [field]: event.target.result as string });
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaved(false);
    try {
      await api.updateSettings(formData);
      await refreshData();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const ImageField = ({
    label,
    field,
    hint,
  }: {
    label: string;
    field: 'logo' | 'signature' | 'letterhead';
    hint?: string;
  }) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        {(formData as any)[field] && (
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img
              src={(formData as any)[field]}
              alt={label}
              style={{ height: '56px', objectFit: 'contain', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '4px', background: '#fff' }}
            />
            <button
              className="btn-icon"
              onClick={() => setFormData({ ...formData, [field]: undefined })}
              style={{ position: 'absolute', top: '-8px', right: '-8px', color: 'var(--danger-color)', background: '#fff', borderRadius: '50%', width: '20px', height: '20px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}
              title="Remove"
            >
              <X size={12} />
            </button>
          </div>
        )}
        <label className="btn btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <Upload size={14} /> {(formData as any)[field] ? 'Change' : 'Upload'}
          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleImageUpload(e, field)} />
        </label>
      </div>
      {hint && <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{hint}</p>}
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Business Settings</h1>
        <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
          <Save size={18} />
          {isSaving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>

        {/* Business Details */}
        <div className="card">
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-color)', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            <Building2 size={18} /> Business Details
          </h2>
          <div className="form-group">
            <label className="form-label">Business Name *</label>
            <input
              type="text"
              className="form-control"
              value={formData.businessName || ''}
              onChange={e => setFormData({ ...formData, businessName: e.target.value })}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input type="text" className="form-control" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-control" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">GST Number</label>
              <input type="text" className="form-control" value={formData.gstNumber || ''} onChange={e => setFormData({ ...formData, gstNumber: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">PAN Number</label>
              <input type="text" className="form-control" value={formData.panNumber || ''} onChange={e => setFormData({ ...formData, panNumber: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Address</label>
            <textarea className="form-control" rows={3} value={formData.address || ''} onChange={e => setFormData({ ...formData, address: e.target.value })} />
          </div>
          <ImageField label="Business Logo" field="logo" hint="Used on PDF invoices and inside the app." />
          <ImageField
            label="Letterhead (Color Template)"
            field="letterhead"
            hint="Placed at the top of the PDF when using the Color Letterhead invoice template."
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Bank Details */}
          <div className="card">
            <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-color)', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <Landmark size={18} /> Bank Details
            </h2>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Bank Name</label>
                <input type="text" className="form-control" value={formData.bankName || ''} onChange={e => setFormData({ ...formData, bankName: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Branch</label>
                <input type="text" className="form-control" value={formData.branch || ''} onChange={e => setFormData({ ...formData, branch: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Account Number</label>
                <input type="text" className="form-control" value={formData.accountNumber || ''} onChange={e => setFormData({ ...formData, accountNumber: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">IFSC Code</label>
                <input type="text" className="form-control" value={formData.ifscCode || ''} onChange={e => setFormData({ ...formData, ifscCode: e.target.value })} />
              </div>
            </div>
          </div>

          {/* Invoice Defaults */}
          <div className="card">
            <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-color)', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <FileText size={18} /> Invoice Defaults &amp; Signature
            </h2>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Invoice Prefix</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.invoicePrefix || ''}
                  onChange={e => setFormData({ ...formData, invoicePrefix: e.target.value })}
                  placeholder="e.g. INV-"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Default Tax (%)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-control"
                  value={formData.defaultTax || 0}
                  onChange={e => setFormData({ ...formData, defaultTax: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Default Invoice Template</label>
              <select
                className="form-control"
                value={formData.defaultTemplate || 'classic'}
                onChange={e => setFormData({ ...formData, defaultTemplate: e.target.value })}
              >
                <option value="classic">Classic Black &amp; White</option>
                <option value="color">Color Letterhead</option>
                <option value="excel">Excel Invoice</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Default Notes / Terms</label>
              <textarea
                className="form-control"
                rows={3}
                value={formData.defaultNotes || ''}
                onChange={e => setFormData({ ...formData, defaultNotes: e.target.value })}
                placeholder="e.g. Goods once sold cannot be returned."
              />
            </div>
            <ImageField label="Authorised Signature" field="signature" hint="Appears at the bottom of the invoice." />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
