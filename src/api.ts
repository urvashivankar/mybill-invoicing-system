const API_URL = 'http://localhost:5000/api';

export const api = {
  // Settings
  getSettings: async () => (await fetch(`${API_URL}/settings`)).json(),
  updateSettings: async (data: any) => {
    const res = await fetch(`${API_URL}/settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    return res.json();
  },

  // Customers
  getCustomers: async () => (await fetch(`${API_URL}/customers`)).json(),
  createCustomer: async (data: any) => {
    const res = await fetch(`${API_URL}/customers`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    return res.json();
  },
  updateCustomer: async (id: string, data: any) => {
    const res = await fetch(`${API_URL}/customers/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    return res.json();
  },
  deleteCustomer: async (id: string) => {
    await fetch(`${API_URL}/customers/${id}`, { method: 'DELETE' });
  },
  bulkDeleteCustomers: async (ids: string[]) => {
    const res = await fetch(`${API_URL}/customers/bulk-delete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) });
    return res.json();
  },

  // Items
  getItems: async () => (await fetch(`${API_URL}/items`)).json(),
  createItem: async (data: any) => {
    const res = await fetch(`${API_URL}/items`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    return res.json();
  },
  updateItem: async (id: string, data: any) => {
    const res = await fetch(`${API_URL}/items/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    return res.json();
  },
  deleteItem: async (id: string) => {
    await fetch(`${API_URL}/items/${id}`, { method: 'DELETE' });
  },
  bulkDeleteItems: async (ids: string[]) => {
    const res = await fetch(`${API_URL}/items/bulk-delete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) });
    return res.json();
  },
  bulkCreateItems: async (items: any[]) => {
    const res = await fetch(`${API_URL}/items/bulk`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items }) });
    return res.json();
  },

  // Bills
  getBills: async () => (await fetch(`${API_URL}/bills`)).json(),
  getBill: async (id: string) => (await fetch(`${API_URL}/bills/${id}`)).json(),
  getNextBillNumber: async () => (await fetch(`${API_URL}/bills/next-number`)).json(),
  createBill: async (data: any) => {
    const res = await fetch(`${API_URL}/bills`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    return res.json();
  },
  updateBill: async (id: string, data: any) => {
    const res = await fetch(`${API_URL}/bills/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    return res.json();
  },

  deleteBill: async (id: string) => {
    await fetch(`${API_URL}/bills/${id}`, { method: 'DELETE' });
  },
  bulkDeleteBills: async (ids: string[]) => {
    const res = await fetch(`${API_URL}/bills/bulk-delete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) });
    return res.json();
  },

  // Import (FormData)
  importItems: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_URL}/import/items`, { method: 'POST', body: formData });
    return res.json();
  },
  importBill: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_URL}/import/bill`, { method: 'POST', body: formData });
    return res.json();
  },

  // Payments
  getPayments: async (billId: string) => (await fetch(`${API_URL}/payments/${billId}`)).json(),
  recordPayment: async (data: any) => {
    const res = await fetch(`${API_URL}/payments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to record payment');
    return json;
  },

  // Quotations
  getQuotations: async () => (await fetch(`${API_URL}/quotations`)).json(),
  getQuotation: async (id: string) => (await fetch(`${API_URL}/quotations/${id}`)).json(),
  getNextQuotationNumber: async () => (await fetch(`${API_URL}/quotations/next-number`)).json(),
  createQuotation: async (data: any) => {
    const res = await fetch(`${API_URL}/quotations`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    return res.json();
  },
  updateQuotation: async (id: string, data: any) => {
    const res = await fetch(`${API_URL}/quotations/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    return res.json();
  },
  deleteQuotation: async (id: string) => {
    await fetch(`${API_URL}/quotations/${id}`, { method: 'DELETE' });
  },
  convertQuotationToBill: async (id: string) => {
    const res = await fetch(`${API_URL}/quotations/${id}/convert`, { method: 'POST' });
    return res.json();
  },

  // Reports
  getSalesReport: async (fromDate?: string, toDate?: string) => {
    let url = `${API_URL}/reports/sales`;
    if (fromDate && toDate) url += `?fromDate=${fromDate}&toDate=${toDate}`;
    return (await fetch(url)).json();
  },
  getSalesReportExcelUrl: (fromDate?: string, toDate?: string) => {
    let url = `${API_URL}/export/report/sales/excel`;
    if (fromDate && toDate) url += `?fromDate=${fromDate}&toDate=${toDate}`;
    return url;
  },

  // Export URLs
  getPdfUrl: (id: string, template?: string) => `${API_URL}/export/${id}/pdf${template ? `?template=${template}` : ''}`,
  getExcelUrl: (id: string, template?: string) => `${API_URL}/export/${id}/excel${template ? `?template=${template}` : ''}`,
  getQuotationPdfUrl: (id: string) => `${API_URL}/export/quotation/${id}/pdf`,
  getQuotationExcelUrl: (id: string) => `${API_URL}/export/quotation/${id}/excel`,
};
