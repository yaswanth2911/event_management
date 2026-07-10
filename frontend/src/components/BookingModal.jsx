// src/components/BookingModal.jsx
import { useState } from 'react';
import API from '../services/api';

export const BookingModal = ({ event, onClose, onBookingSuccess }) => {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCheckout = async () => {
    setError('');
    setLoading(true);
    try {
      // 1. Create booking record on the backend
      const bookingRes = await API.post('/bookings/', {
        event: event.id,
        quantity: quantity,
      });
      const bookingId = bookingRes.data.id;

      // 2. Fetch initialized order parameters from backend
      const orderRes = await API.post('/payments/create/', { booking_id: bookingId });
      const { order_id, amount } = orderRes.data;

      // 3. Configure Razorpay overlay options with your functional test key
      const options = {
        key: "rzp_test_TBraG2wTJEkMOR", // Your active test key securely integrated
        amount: amount * 100, // Converted into paise subunits
        currency: "INR",
        name: "EVENTIFY INC",
        description: `Pass allocation for ${event.title}`,
        order_id: order_id,
        handler: async function (response) {
          try {
            const verifyRes = await API.post('/payments/verify/', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              status: 'SUCCESS'
            });
            alert(verifyRes.data.message || "Payment Confirmed!");
            onBookingSuccess();
            onClose();
          } catch (vErr) {
            setError('Payment signature verification failed.');
            setLoading(false);
          }
        },
        prefill: {
          name: localStorage.getItem('username'),
        },
        theme: { color: "#4f46e5" },
        modal: {
          ondismiss: function () {
            setLoading(false);
          }
        }
      };

      const rzpWindow = new window.Razorpay(options);
      rzpWindow.open();

    } catch (err) {
      setError(err.response?.data?.[0] || 'Booking execution failed. Check capacity limits.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-100 max-w-md w-full p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold">✕</button>

        <h3 className="text-xl font-bold text-slate-900 mb-2">Review Reservation</h3>
        <p className="text-indigo-600 font-semibold text-sm mb-4">{event.title}</p>

        {error && <div className="bg-rose-50 text-rose-600 border border-rose-100 p-3 rounded-lg text-xs font-medium mb-4">{error}</div>}

        <div className="space-y-4 text-sm text-slate-600 border-b border-slate-100 pb-4 mb-4">
          <div className="flex justify-between">
            <span>Ticket Price</span>
            <span className="font-bold text-slate-800">₹{event.price}</span>
          </div>

          <div className="flex justify-between items-center">
            <span>Select Quantity</span>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 font-bold"
              >-</button>
              <span className="font-bold text-slate-900 text-base">{quantity}</span>
              <button 
                onClick={() => setQuantity(q => Math.min(event.seats_available, q + 1))}
                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 font-bold"
              >+</button>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <span className="text-slate-500 font-medium">Total Payable Amount</span>
          <span className="text-2xl font-extrabold text-slate-900">₹{(event.price * quantity).toFixed(2)}</span>
        </div>

        <button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg shadow transition disabled:opacity-50"
        >
          {loading ? 'Opening Gateway...' : 'Pay with Razorpay Test Mode'}
        </button>
      </div>
    </div>
  );
};