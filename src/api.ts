const API_URL = 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('token');

const fetchAuth = async (url: string, options: any = {}) => {
  const token = getToken();
  const headers = {
    ...options.headers,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    // Optionally trigger a logout if token is invalid/expired
    localStorage.removeItem('token');
    window.dispatchEvent(new Event('auth-expired'));
  }
  return res;
};

export const api = {
  // Auth
  login: async (data: any) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Login failed');
    return json;
  },
  signup: async (data: any) => {
    const res = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Signup failed');
    return json;
  },

  // Settings
  getSettings: async () => (await fetchAuth(`${API_URL}/settings`)).json(),
  updateSettings: async (data: any) => {
    const res = await fetchAuth(`${API_URL}/settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    return res.json();
  },

  // Dashboard
  getDashboardStats: async () => (await fetchAuth(`${API_URL}/dashboard/stats`)).json(),

  // Customers
  getCustomers: async (page?: number, limit?: number, search?: string) => {
    let url = `${API_URL}/customers`;
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    if (search) params.append('search', search);
    if (params.toString()) url += `?${params.toString()}`;
    return (await fetchAuth(url)).json();
  },
  createCustomer: async (data: any) => {
    const res = await fetchAuth(`${API_URL}/customers`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    return res.json();
  },
  updateCustomer: async (id: string, data: any) => {
    const res = await fetchAuth(`${API_URL}/customers/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    return res.json();
  },
  deleteCustomer: async (id: string) => {
    await fetchAuth(`${API_URL}/customers/${id}`, { method: 'DELETE' });
  },
  bulkDeleteCustomers: async (ids: string[]) => {
    const res = await fetchAuth(`${API_URL}/customers/bulk-delete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) });
    return res.json();
  },

  // Items
  getItems: async (page?: number, limit?: number, search?: string) => {
    let url = `${API_URL}/items`;
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    if (search) params.append('search', search);
    if (params.toString()) url += `?${params.toString()}`;
    return (await fetchAuth(url)).json();
  },
  createItem: async (data: any) => {
    const res = await fetchAuth(`${API_URL}/items`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    return res.json();
  },
  updateItem: async (id: string, data: any) => {
    const res = await fetchAuth(`${API_URL}/items/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    return res.json();
  },
  deleteItem: async (id: string) => {
    await fetchAuth(`${API_URL}/items/${id}`, { method: 'DELETE' });
  },
  bulkDeleteItems: async (ids: string[]) => {
    const res = await fetchAuth(`${API_URL}/items/bulk-delete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) });
    return res.json();
  },
  bulkCreateItems: async (items: any[]) => {
    const res = await fetchAuth(`${API_URL}/items/bulk`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items }) });
    return res.json();
  },

  // Bills
  getBills: async (page?: number, limit?: number, search?: string) => {
    let url = `${API_URL}/bills`;
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    if (search) params.append('search', search);
    if (params.toString()) url += `?${params.toString()}`;
    return (await fetchAuth(url)).json();
  },
  getBill: async (id: string) => (await fetchAuth(`${API_URL}/bills/${id}`)).json(),
  getNextBillNumber: async () => (await fetchAuth(`${API_URL}/bills/next-number`)).json(),
  createBill: async (data: any) => {
    const res = await fetchAuth(`${API_URL}/bills`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    return res.json();
  },
  updateBill: async (id: string, data: any) => {
    const res = await fetchAuth(`${API_URL}/bills/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    return res.json();
  },

  deleteBill: async (id: string) => {
    await fetchAuth(`${API_URL}/bills/${id}`, { method: 'DELETE' });
  },
  bulkDeleteBills: async (ids: string[]) => {
    const res = await fetchAuth(`${API_URL}/bills/bulk-delete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) });
    return res.json();
  },

  // Import (FormData)
  importItems: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetchAuth(`${API_URL}/import/items`, { method: 'POST', body: formData });
    return res.json();
  },
  importBill: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetchAuth(`${API_URL}/import/bill`, { method: 'POST', body: formData });
    return res.json();
  },

  // Payments
  getPayments: async (billId: string) => (await fetchAuth(`${API_URL}/payments/${billId}`)).json(),
  recordPayment: async (data: any) => {
    const res = await fetchAuth(`${API_URL}/payments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to record payment');
    return json;
  },

  // Quotations
  getQuotations: async (page?: number, limit?: number, search?: string, status?: string) => {
    let url = `${API_URL}/quotations`;
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    if (params.toString()) url += `?${params.toString()}`;
    return (await fetchAuth(url)).json();
  },
  getQuotation: async (id: string) => (await fetchAuth(`${API_URL}/quotations/${id}`)).json(),
  getNextQuotationNumber: async () => (await fetchAuth(`${API_URL}/quotations/next-number`)).json(),
  createQuotation: async (data: any) => {
    const res = await fetchAuth(`${API_URL}/quotations`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    return res.json();
  },
  updateQuotation: async (id: string, data: any) => {
    const res = await fetchAuth(`${API_URL}/quotations/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    return res.json();
  },
  deleteQuotation: async (id: string) => {
    await fetchAuth(`${API_URL}/quotations/${id}`, { method: 'DELETE' });
  },
  convertQuotationToBill: async (id: string) => {
    const res = await fetchAuth(`${API_URL}/quotations/${id}/convert`, { method: 'POST' });
    return res.json();
  },

  // Reports
  getSalesReport: async (fromDate?: string, toDate?: string) => {
    let url = `${API_URL}/reports/sales`;
    if (fromDate && toDate) url += `?fromDate=${fromDate}&toDate=${toDate}`;
    return (await fetchAuth(url)).json();
  },

  // Export URLs
  getSalesReportExcelUrl: (fromDate?: string, toDate?: string) => {
    let url = `${API_URL}/export/report/sales/excel?token=${getToken() || ''}`;
    if (fromDate && toDate) url += `&fromDate=${fromDate}&toDate=${toDate}`;
    return url;
  },
  getPdfUrl: (id: string, template?: string) => `${API_URL}/export/${id}/pdf?token=${getToken() || ''}${template ? `&template=${template}` : ''}`,
  getExcelUrl: (id: string, template?: string) => `${API_URL}/export/${id}/excel?token=${getToken() || ''}${template ? `&template=${template}` : ''}`,
  getQuotationPdfUrl: (id: string) => `${API_URL}/export/quotation/${id}/pdf?token=${getToken() || ''}`,
  getQuotationExcelUrl: (id: string) => `${API_URL}/export/quotation/${id}/excel?token=${getToken() || ''}`,
};
