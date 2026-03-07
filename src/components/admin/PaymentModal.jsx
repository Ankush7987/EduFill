import React from 'react';
import { IndianRupee, X } from 'lucide-react';

const PaymentModal = ({ isOpen, onClose, paymentData, setPaymentData, submitPayment, savingPayment }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/70 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
        <div className="bg-emerald-600 p-5 flex justify-between items-center text-white">
          <h2 className="text-xl font-bold flex items-center gap-2"><IndianRupee size={20}/> Payment Details</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white bg-white/10 p-1.5 rounded-full transition-colors"><X size={20}/></button>
        </div>
        <form onSubmit={submitPayment} className="p-6 space-y-5">
          <div>
            <label className="text-sm font-bold text-gray-700 block mb-1">Fee Amount Received (₹)</label>
            <input 
              type="number" 
              required 
              value={paymentData.amount}
              onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
              placeholder="e.g. 500"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-emerald-500 focus:ring-0 outline-none transition-colors"
            />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-700 block mb-1">Payment Method</label>
            <select 
              required
              value={paymentData.method}
              onChange={(e) => setPaymentData({...paymentData, method: e.target.value})}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-emerald-500 focus:ring-0 outline-none transition-colors bg-white"
            >
              <option value="Online">Online (UPI / Card)</option>
              <option value="Cash">Cash</option>
            </select>
          </div>
          <button type="submit" disabled={savingPayment} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl mt-2 transition-all shadow-md">
            {savingPayment ? 'Saving...' : 'Mark as Paid'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;