import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Plus, Edit2, Trash2, DownloadCloud, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import ImportModal from '../components/ImportModal';
import { api } from '../api';
import { Table } from '../components/ui/Table';
import { formatCurrency } from '../utils/format';
import { useDebounce } from '../utils/useDebounce';

const Items: React.FC = () => {
  const { refreshData } = useAppContext();
  const [showForm, setShowForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [itemsList, setItemsList] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    itemName: '',
    itemCode: '',
    unit: '',
    rate: 0,
    gst: 0
  });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const response = await api.getItems(page, 20, debouncedSearchTerm);
      if (response.data) {
        setItemsList(response.data);
        setTotalPages(response.totalPages);
      } else {
        setItemsList(response);
        setTotalPages(1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [page, debouncedSearchTerm]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm]);

  const handleImportItems = async (newItemsData: any[]) => {
    try {
      const toCreate = [];
      
      for (const item of newItemsData) {
        if (item.status === 'Update Rate' && item.existingItem) {
          await api.updateItem(item.existingItem.id, {
            ...item.existingItem,
            rate: item.rate,
            unit: item.unit || item.existingItem.unit
          });
        } else {
          toCreate.push({
            itemName: item.name || item.itemName,
            itemCode: item.itemCode || item.code || '',
            unit: item.unit || '',
            rate: item.rate || 0,
            gst: item.tax || item.gst || 0
          });
        }
      }

      if (toCreate.length > 0) {
        await api.bulkCreateItems(toCreate);
      }
      
      await fetchItems();
      await refreshData();
      alert(`Import completed successfully!`);
    } catch (err) {
      alert("Failed to import some items.");
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingId) {
        await api.updateItem(editingId, formData);
      } else {
        await api.createItem(formData);
      }
      await fetchItems();
      await refreshData();
      setShowForm(false);
      setEditingId(null);
      setFormData({ itemName: '', itemCode: '', unit: '', rate: 0, gst: 0 });
    } catch (err) {
      alert("Failed to save item");
    } finally {
      setIsSaving(false);
    }
  };

  const editItem = (item: any) => {
    setFormData({
      itemName: item.itemName,
      itemCode: item.itemCode || '',
      unit: item.unit || '',
      rate: item.rate,
      gst: item.gst || 0
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const editItemById = (id: string) => {
    const itemObj = itemsList.find((i: any) => i.id === id);
    if (itemObj) editItem(itemObj);
  };

  const deleteItem = async (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        await api.deleteItem(id);
        setSelectedIds(selectedIds.filter(selId => selId !== id));
        await fetchItems();
        await refreshData();
      } catch (err) {
        alert("Failed to delete item");
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedIds.length} items?`)) {
      try {
        await api.bulkDeleteItems(selectedIds);
        setSelectedIds([]);
        await fetchItems();
        await refreshData();
      } catch (err) {
        alert("Failed to delete items");
      }
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === itemsList.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(itemsList.map((i: any) => i.id));
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
        <h1 className="page-title">Items / Price List</h1>
        <div className="flex gap-2" style={{ alignItems: 'center' }}>
          {selectedIds.length > 0 && (
            <button className="btn btn-secondary" onClick={handleBulkDelete} style={{ color: 'var(--danger-color)', borderColor: 'var(--danger-color)' }}>
              <Trash2 size={18} /> Delete Selected ({selectedIds.length})
            </button>
          )}
          <div style={{ position: 'relative', width: '260px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input type="text" className="form-control" placeholder="Search by name or code..."
              style={{ paddingLeft: '40px' }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <button className="btn btn-secondary" onClick={() => setShowImportModal(true)}>
            <DownloadCloud size={18} /> Import Items
          </button>
          {!showForm && (
            <button className="btn btn-primary" onClick={() => {
              setFormData({ itemName: '', itemCode: '', unit: '', rate: 0, gst: 0 });
              setEditingId(null);
              setShowForm(true);
            }}>
              <Plus size={18} /> Add New Item
            </button>
          )}
        </div>
      </div>

      {showImportModal && (
        <ImportModal type="items" onClose={() => setShowImportModal(false)} onImportItems={handleImportItems} />
      )}

      {showForm && (
        <div className="card mb-4">
          <h2 style={{ fontSize: '1.125rem', marginBottom: '16px' }}>{editingId ? 'Edit Item' : 'Add New Item'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group" style={{ flex: 2 }}>
                <label className="form-label">Item Name *</label>
                <input type="text" className="form-control" required value={formData.itemName} onChange={e => setFormData({...formData, itemName: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Item Code</label>
                <input type="text" className="form-control" value={formData.itemCode} onChange={e => setFormData({...formData, itemCode: e.target.value})} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Unit</label>
                <input type="text" list="common-units" className="form-control" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} placeholder="Select or type unit" />
                <datalist id="common-units">
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
              </div>
              <div className="form-group">
                <label className="form-label">Rate / Price (₹) *</label>
                <input type="number" step="0.01" className="form-control" required value={formData.rate} onChange={e => setFormData({...formData, rate: parseFloat(e.target.value) || 0})} />
              </div>
              <div className="form-group">
                <label className="form-label">Tax / GST (%)</label>
                <input type="number" step="0.1" className="form-control" value={formData.gst} onChange={e => setFormData({...formData, gst: parseFloat(e.target.value) || 0})} />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Item'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>Loading items...</div>
        ) : (
          <>
            <Table
              columns={[
                { header: <input type="checkbox" onChange={toggleSelectAll} checked={itemsList.length > 0 && selectedIds.length === itemsList.length} />, accessor: 'select', align: 'center' },
                { header: 'Item Name', accessor: 'itemName' },
                { header: 'Item Code', accessor: 'itemCode' },
                { header: 'Unit', accessor: 'unit' },
                { header: 'Rate (₹)', accessor: 'rate', align: 'right' },
                { header: 'GST (%)', accessor: 'gst', align: 'center' },
                { header: 'Actions', accessor: 'actions', align: 'center' }
              ]}
              data={itemsList.map((item: any) => ({
                select: item.id,
                itemName: item.itemName,
                itemCode: item.itemCode || '-',
                unit: item.unit,
                rate: formatCurrency(item.rate),
                gst: item.gst || 0,
                actions: item.id
              }))}
              renderRow={(row, idx) => (
                <tr key={row.select} style={{ backgroundColor: selectedIds.includes(row.select) ? 'var(--primary-light)' : 'transparent' }}>
                  <td style={{ textAlign: 'center' }}>
                    <input type="checkbox" checked={selectedIds.includes(row.select)} onChange={() => toggleSelect(row.select)} />
                  </td>
                  <td style={{ fontWeight: 500 }}>{row.itemName}</td>
                  <td>{row.itemCode}</td>
                  <td>{row.unit}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{row.rate}</td>
                  <td style={{ textAlign: 'center' }}>{row.gst}%</td>
                  <td>
                    <div className="flex gap-2 justify-center">
                      <button className="btn-icon" onClick={() => editItemById(row.select)}><Edit2 size={16} /></button>
                      <button className="btn-icon" onClick={() => deleteItem(row.select)} style={{ color: 'var(--danger-color)' }}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              )}
              className=""
            />
            {itemsList.length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
                {searchTerm ? 'No items match your search.' : 'No items found. Add your first item!'}
              </div>
            )}
            
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '24px', gap: '16px' }}>
                <button 
                  className="btn btn-secondary" 
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  style={{ padding: '6px 12px' }}
                >
                  <ChevronLeft size={16} /> Previous
                </button>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Page {page} of {totalPages}
                </span>
                <button 
                  className="btn btn-secondary" 
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                  style={{ padding: '6px 12px' }}
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Items;
