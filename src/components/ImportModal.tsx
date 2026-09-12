import React, { useState, useEffect } from 'react';
import { X, UploadCloud, AlertCircle, CheckCircle, Trash2 } from 'lucide-react';
import { api } from '../api';
import { useAppContext } from '../context/AppContext';
import { Item } from '../types';

interface ImportModalProps {
  type: 'items' | 'bill';
  onClose: () => void;
  onImportItems?: (items: any[]) => void;
  onImportBill?: (billData: any) => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ type, onClose, onImportItems, onImportBill }) => {
  const { items } = useAppContext();
  const [file, setFile] = useState<File | null>(null);
  
  // Storing mutable preview data
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const processFile = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);

    try {
      let data;
      if (type === 'items') {
        data = await api.importItems(file);
      } else {
        data = await api.importBill(file);
      }
      
      if (data && data.error) {
        setError(data.error);
      } else if (data && data.length > 0) {
        if (type === 'items') {
          // Initialize duplicate status
          const prepared = data.map((d: any) => {
            const existing = items.find(i => i.itemName.toLowerCase() === d.name.toLowerCase());
            return {
              ...d,
              _id: Math.random().toString(), // local id for rendering
              status: existing ? 'Keep Existing' : 'Valid',
              existingItem: existing || null
            };
          });
          setPreviewData(prepared);
        } else {
          setPreviewData(data); // bill preview is handled differently
        }
      } else {
        setError("Could not extract any data from this file.");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred while communicating with the server.");
    } finally {
      setIsProcessing(false);
    }
  };

  const updatePreviewField = (index: number, field: string, value: any) => {
    if (!previewData) return;
    const newData = [...previewData];
    newData[index][field] = value;
    setPreviewData(newData);
  };

  const removeRow = (index: number) => {
    if (!previewData) return;
    const newData = [...previewData];
    newData.splice(index, 1);
    setPreviewData(newData);
  };

  const handleConfirmImport = () => {
    if (!previewData) return;
    
    if (type === 'items' && onImportItems) {
      // Filter out 'Keep Existing'
      const finalItems = previewData.filter(d => d.status !== 'Keep Existing');
      
      // Validate
      for (const item of finalItems) {
        if (!item.name || item.name.trim() === '') {
          alert("All imported items must have a name.");
          return;
        }
        if (item.rate === null || item.rate === undefined || isNaN(item.rate)) {
          alert(`Item "${item.name}" has an invalid rate. Please fix it before importing.`);
          return;
        }
      }

      onImportItems(finalItems);
    } else if (type === 'bill' && onImportBill) {
      onImportBill(previewData);
    }
    onClose();
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '24px' }}>
      <div className="card" style={{ width: '100%', maxWidth: type === 'items' ? '1000px' : '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', position: 'relative', backgroundColor: 'white' }}>
        <button className="btn-icon" style={{ position: 'absolute', top: '16px', right: '16px' }} onClick={onClose}>
          <X size={24} />
        </button>
        
        <h2 style={{ fontSize: '1.5rem', marginBottom: '24px' }}>
          Import {type === 'items' ? 'Price List / Items' : 'Old Bill'}
        </h2>

        {!previewData ? (
          <div>
            <div style={{ border: '2px dashed var(--border-color)', borderRadius: '8px', padding: '48px', textAlign: 'center', backgroundColor: '#f8fafc', marginBottom: '24px' }}>
              <UploadCloud size={48} style={{ color: 'var(--primary-color)', margin: '0 auto 16px' }} />
              <p style={{ fontWeight: 600, marginBottom: '8px' }}>Select a file to import</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>Supported formats: .pdf, .jpg, .png, .xlsx, .csv</p>
              <input type="file" accept=".xlsx, .xls, .csv, .pdf, .jpg, .png, .jpeg, .webp" onChange={handleFileUpload} style={{ margin: '0 auto', display: 'block' }} />
            </div>

            {error && (
              <div className="alert" style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#fef2f2', color: '#b91c1c', borderColor: '#fca5a5', padding: '12px', borderRadius: '6px', marginBottom: '16px' }}>
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            <div className="flex justify-end">
              <button className="btn btn-primary" disabled={!file || isProcessing} onClick={processFile}>
                {isProcessing ? 'Extracting Data...' : 'Extract Data'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
            <div className="alert" style={{ backgroundColor: '#f0fdf4', color: '#15803d', borderColor: '#bbf7d0', padding: '12px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <CheckCircle size={20} />
              <span>{previewData.length} items detected! Please review and edit the data below before confirming.</span>
            </div>

            {type === 'items' ? (
              <div className="table-responsive" style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px', marginBottom: '24px' }}>
                <table style={{ fontSize: '0.875rem', width: '100%' }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                    <tr>
                      <th style={{ width: '80px' }}>Sr. No.</th>
                      <th>Item Name</th>
                      <th style={{ width: '100px' }}>Unit</th>
                      <th style={{ width: '100px' }}>Default Qty</th>
                      <th style={{ width: '120px' }}>Rate (₹)</th>
                      <th style={{ width: '160px' }}>Status</th>
                      <th style={{ width: '60px', textAlign: 'center' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, i) => {
                      const hasRateError = row.rate === null || isNaN(row.rate);
                      return (
                        <tr key={row._id} style={{ backgroundColor: row.status === 'Keep Existing' ? '#f8fafc' : 'white', opacity: row.status === 'Keep Existing' ? 0.7 : 1 }}>
                          <td style={{ padding: '8px' }}>
                            <input type="text" className="form-control" style={{ padding: '4px 8px' }} value={row.srNo || ''} onChange={(e) => updatePreviewField(i, 'srNo', e.target.value)} />
                          </td>
                          <td style={{ padding: '8px' }}>
                            <input type="text" className="form-control" style={{ padding: '4px 8px', borderColor: !row.name ? 'red' : 'var(--border-color)' }} value={row.name} onChange={(e) => updatePreviewField(i, 'name', e.target.value)} />
                          </td>
                          <td style={{ padding: '8px' }}>
                            <input type="text" list="import-common-units" className="form-control" style={{ padding: '4px 8px' }} value={row.unit || ''} onChange={(e) => updatePreviewField(i, 'unit', e.target.value)} placeholder="Select" />
                            {i === 0 && (
                              <datalist id="import-common-units">
                                <option value="Nos" />
                                <option value="Piece" />
                                <option value="Feet" />
                                <option value="Meter" />
                                <option value="Kg" />
                                <option value="Litre" />
                                <option value="Box" />
                                <option value="Set" />
                                <option value="Visit" />
                                <option value="Service" />
                                <option value="Job" />
                                <option value="Hour" />
                                <option value="Day" />
                              </datalist>
                            )}
                          </td>
                          <td style={{ padding: '8px' }}>
                            <input type="number" className="form-control" style={{ padding: '4px 8px' }} value={row.defaultQty || ''} onChange={(e) => updatePreviewField(i, 'defaultQty', parseFloat(e.target.value))} />
                          </td>
                          <td style={{ padding: '8px' }}>
                            <input type="number" className="form-control" style={{ padding: '4px 8px', borderColor: hasRateError ? 'red' : 'var(--border-color)', backgroundColor: hasRateError ? '#fef2f2' : 'white' }} value={row.rate ?? ''} onChange={(e) => updatePreviewField(i, 'rate', parseFloat(e.target.value))} placeholder={hasRateError ? '⚠ Missing' : ''} />
                          </td>
                          <td style={{ padding: '8px' }}>
                            {row.existingItem ? (
                              <select className="form-control" style={{ padding: '4px 8px', fontSize: '0.75rem', borderColor: '#d97706', color: '#d97706', backgroundColor: '#fef3c7' }} value={row.status} onChange={(e) => updatePreviewField(i, 'status', e.target.value)}>
                                <option value="Keep Existing">Skip (Duplicate)</option>
                                <option value="Update Rate">Update Existing</option>
                                <option value="Create New">Create as New</option>
                              </select>
                            ) : (
                              <span style={{ color: 'var(--success-color)', fontWeight: 500, fontSize: '0.75rem' }}>Valid (New)</span>
                            )}
                          </td>
                          <td style={{ padding: '8px', textAlign: 'center' }}>
                            <button className="btn-icon" style={{ color: 'var(--danger-color)' }} onClick={() => removeRow(i)}><Trash2 size={16} /></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="table-responsive" style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px', marginBottom: '24px' }}>
                <table style={{ fontSize: '0.875rem' }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                    <tr>
                      {Object.keys(previewData[0] || {}).map((key, i) => (
                        <th key={i}>{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, i) => (
                      <tr key={i}>
                        {Object.values(row).map((val: any, j) => (
                          <td key={j}>{String(val)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-between items-center" style={{ marginTop: 'auto' }}>
              <div>
                <button className="btn btn-secondary" onClick={() => setPreviewData(null)}>Back</button>
              </div>
              <div className="flex gap-4">
                <button className="btn btn-primary" onClick={handleConfirmImport}>Confirm & Import</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportModal;
