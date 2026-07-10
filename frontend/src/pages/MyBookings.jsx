// src/pages/MyBookings.jsx
import { useState, useEffect } from 'react';
import API from '../services/api';

export const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await API.get('/bookings/');
      setBookings(res.data);
    } catch (err) {
      console.error("Failed to load user bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (bookingId, eventTitle) => {
    try {
      // Fetching binary blob stream instead of standard JSON JSON responses
      const response = await API.get(`/bookings/${bookingId}/download/`, {
        responseType: 'blob',
      });

      // Convert the binary stream into an executable browser download link
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Ticket_${eventTitle.replace(/\s+/g, '_')}.pdf`;
      link.click();
      window.URL.revokeObjectURL(link.href);
    } catch (err) {
      alert("Error generating download link. Ensure ticket status is CONFIRMED.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Your Booked Tickets</h2>
        <p className="text-sm text-slate-500">Access passes and review historical receipts</p>
      </div>

      {loading ? (
        <div className="text-slate-500 py-4">Loading your ledger details...</div>
      ) : bookings.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border text-center text-slate-400">
          You haven't reserved tickets for any upcoming events yet.
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div 
              key={booking.id} 
              className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between md:items-center gap-4"
            >
              <div className="space-y-1">
                <span className={`inline-block text-xs px-2.5 py-0.5 rounded-full font-bold mb-1 ${
                  booking.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                  booking.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                  'bg-rose-50 text-rose-700 border border-rose-100'
                }`}>
                  {booking.status}
                </span>
                <h3 className="text-lg font-bold text-slate-900">{booking.event_title}</h3>
                <p className="text-xs text-slate-500">📅 <b>Date:</b> {new Date(booking.event_date).toLocaleString()}</p>
                <p className="text-xs text-slate-600">🎟️ Reserved Tickets: <b>{booking.quantity}</b> | Paid: <b>₹{booking.total_amount}</b></p>
              </div>

              <div>
                {booking.status === 'CONFIRMED' && (
                  <button
                    onClick={() => handleDownloadPDF(booking.id, booking.event_title)}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-lg transition tracking-wide flex items-center gap-2 shadow-sm"
                  >
                    📥 Download PDF Pass
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};