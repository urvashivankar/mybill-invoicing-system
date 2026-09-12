import React, { useState } from 'react';
import { Bill } from '../types';
import { api } from '../api';
import { X, IndianRupee } from 'lucide-react';
import { formatCurrency } from '../utils/format';

interface Props {
  bill: Bill;
  onClose: () => void;
  onSuccess: () => void;
}

const RecordPaymentModal: React.FC<Props> = ({ bill, onClose, onSuccess }) => {
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const balanceDue = bill.grandTotal - (bill.amountPaid || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }
    if (amount > balanceDue) {
      alert(`Payment amount cannot exceed the balance due of ₹${balanceDue.toFixed(2)}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await api.recordPayment({
        billId: bill.id,
        amount: Number(amount),
        paymentDate,
        notes
      });
      alert('Payment recorded successfully!');
      onSuccess();
    } catch (err: any) {
      alert(err?.message || 'Failed to record payment.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '24px' }}>
      <div className="card" style={{ width: '100%', maxWidth: '450px', position: 'relative' }}>
        <button className="btn-icon" style={{ position: 'absolute', top: '16px', right: '16px' }} onClick={onClose}>
          <X size={24} />
        </button>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '8px', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IndianRupee size={20} /> Record Payment
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Invoice: <strong>{bill.billNumber}</strong> ({bill.customerSnapshot?.name || bill.customerName})
        </p>

        <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', border: '1px solid #e2e8f0' }}>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Grand Total</div>
            <div style={{ fontWeight: 600 }}>{formatCurrency(bill.grandTotal)}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Amount Paid</div>
            <div style={{ fontWeight: 600, color: '#059669' }}>{formatCurrency(bill.amountPaid || 0)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Balance Due</div>
            <div style={{ fontWeight: 700, color: '#dc2626' }}>{formatCurrency(balanceDue)}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Payment Amount (₹) *</label>
            <input 
              type="number" 
              className="form-control" 
              value={amount} 
              onChange={e => setAmount(parseFloat(e.target.value) || '')} 
              min="1"
              max={balanceDue}
              step="0.01"
              required 
              placeholder={`Max: ${formatCurrency(balanceDue)}`}
            />
          </div>
          <div className="form-group mt-4">
            <label className="form-label">Payment Date *</label>
            <input 
              type="date" 
              className="form-control" 
              value={paymentDate} 
              onChange={e => setPaymentDate(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group mt-4">
            <label className="form-label">Notes (Optional)</label>
            <textarea 
              className="form-control" 
              rows={2} 
              value={notes} 
              onChange={e => setNotes(e.target.value)} 
              placeholder="e.g., Bank Transfer Ref ID"
            ></textarea>
          </div>

          <div className="flex gap-4 justify-end mt-6">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting || balanceDue <= 0}>
              {isSubmitting ? 'Saving...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecordPaymentModal;
