// src/pages/Dashboard.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import API from '../services/api';
import { CreateEventModal } from '../components/CreateEventModal';

export const Dashboard = () => {
  const navigate = useNavigate();
  const scannerRef = useRef(null);
  const [events, setEvents] = useState([]);
  const [qrInput, setQrInput] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Custom operational modals toggles hooks
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEditEvent, setSelectedEditEvent] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);

  const isSystemAdmin = localStorage.getItem('is_staff') === 'true' || localStorage.getItem('username') === 'ali';

  useEffect(() => {
    fetchOrganizerEvents();
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error("Scanner clear fail", err));
      }
    };
  }, []);

  const fetchOrganizerEvents = async () => {
    try {
      setLoading(true);
      const res = await API.get('/events/');
      setEvents(res.data);
    } catch (err) {
      console.error('Failed to load metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId, title) => {
    if (!window.confirm(`Are you absolutely sure you want to delete "${title}"? This actions drops all registration history.`)) return;
    try {
      await API.delete(`/events/${eventId}/`);
      alert("Event removed successfully.");
      fetchOrganizerEvents();
    } catch (err) {
      alert("Delete rejected. Records with ticket locks cannot be deleted.");
    }
  };

  const openEditModal = (eventObj) => {
    setSelectedEditEvent(eventObj);
    setShowCreateModal(true);
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    setSelectedEditEvent(null);
  };

  const processVerification = async (ticketKey) => {
    setScanResult(null);
    setScanError('');
    try {
      const res = await API.post('/scan-ticket/', { qr_code_key: ticketKey });
      setScanResult(res.data);
      fetchOrganizerEvents();
      return true;
    } catch (err) {
      setScanError(err.response?.data?.error || 'Verification rejected.');
      return false;
    }
  };

  const handleManualVerify = async (e) => {
    e.preventDefault();
    if (!qrInput.trim()) return;
    const success = await processVerification(qrInput.trim());
    if (success) setQrInput('');
  };

  const startCameraScanner = () => {
    setCameraActive(true);
    setScanResult(null);
    setScanError('');

    setTimeout(() => {
      const scanner = new Html5QrcodeScanner("reader", {
        fps: 10,
        qrbox: { width: 250, height: 250 },
      }, false);

      scanner.render(
        async (decodedText) => {
          const success = await processVerification(decodedText);
          if (success) {
            scanner.clear();
            setCameraActive(false);
          }
        },
        (error) => {}
      );
      scannerRef.current = scanner;
    }, 100);
  };

  const stopCameraScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().then(() => setCameraActive(false)).catch(err => console.error(err));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Managed Events Section */}
        <div className="lg:col-span-2 space-y-6 order-2 lg:order-1">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Your Managed Events</h2>
              <p className="text-sm text-slate-500">Track registration analytics and attendance pools</p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {isSystemAdmin && (
                <button 
                  onClick={() => navigate('/dashboard/admin/analytics')}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-4 py-2.5 rounded-lg transition border border-slate-700 shadow-sm"
                >
                  📊 Global Analytics
                </button>
              )}
              
              <button 
                onClick={() => { setSelectedEditEvent(null); setShowCreateModal(true); }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition shadow-sm"
              >
                ＋ New Event
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-slate-500 text-center py-6">Loading metrics...</div>
          ) : events.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border text-center text-slate-400">
              You haven't posted any live events yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {events.map((event) => (
                <div key={event.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-slate-900">{event.title}</h3>
                    <p className="text-xs text-slate-500">📍 {event.location} | 📅 {new Date(event.date).toLocaleDateString()}</p>
                    <div className="flex gap-4 text-xs pt-1">
                      <span className="text-indigo-600 font-semibold">Tickets Sold: {event.tickets_sold}</span>
                      <span className="text-slate-500">Total Capacity: {event.capacity}</span>
                    </div>
                  </div>
                  
                  {/* Action row adjustments wrapper */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 mt-2 sm:mt-0">
                    <span className="inline-block bg-indigo-50 text-indigo-700 text-xs px-3 py-1 rounded-full font-bold">
                      ₹{event.price}
                    </span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => openEditModal(event)}
                        className="text-xs bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 font-semibold px-2.5 py-1 rounded transition"
                      >
                        ✏️ Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteEvent(event.id, event.title)}
                        className="text-xs bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-semibold px-2.5 py-1 rounded transition"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Check-in Desk Section */}
        <div className="space-y-6 order-1 lg:order-2">
          <div className="bg-slate-900 text-white p-6 rounded-xl shadow-md border border-slate-800">
            <h3 className="text-xl font-bold mb-1 tracking-wide">🎟️ Gate Check-in Desk</h3>
            <p className="text-xs text-slate-400 mb-4">Scan using camera stream hardware, or manually verify via unique hash token</p>

            <div className="mb-6 pb-6 border-b border-slate-800">
              {!cameraActive ? (
                <button
                  onClick={startCameraScanner}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold py-2.5 rounded-lg shadow transition flex items-center justify-center gap-2"
                >
                  📷 Open Live Camera Scanner
                </button>
              ) : (
                <div className="space-y-4">
                  <div id="reader" className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700"></div>
                  <button
                    onClick={stopCameraScanner}
                    className="w-full bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold py-2 rounded-lg transition"
                  >
                    Close Camera View
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Manual Fallback Input</label>
              <form onSubmit={handleManualVerify} className="space-y-3">
                <input
                  type="text"
                  placeholder="Paste UUID verification key..."
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  className="w-full bg-slate-800 text-white placeholder-slate-500 border border-slate-700 px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
                <button 
                  type="submit" 
                  disabled={!qrInput.trim()}
                  className="w-full bg-slate-800 border border-slate-700 hover:bg-slate-700 disabled:opacity-40 text-white text-sm font-bold py-2 rounded-lg transition"
                >
                  Verify Hash Code
                </button>
              </form>
            </div>

            {scanResult && (
              <div className="mt-5 p-4 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-lg space-y-1 text-xs">
                <p className="text-emerald-400 font-bold text-sm">✅ Verified Successfully!</p>
                <p><b>Event:</b> {scanResult.event_title}</p>
                <p><b>Seats Checked-in:</b> {scanResult.tickets_checked_in}</p>
              </div>
            )}

            {scanError && (
              <div className="mt-5 p-4 bg-rose-950/60 border border-rose-800 text-rose-400 font-medium text-sm rounded-lg">
                ❌ {scanError}
              </div>
            )}
          </div>
        </div>

      </div>

      {showCreateModal && (
        <CreateEventModal 
          onClose={handleModalClose}
          onEventCreated={fetchOrganizerEvents}
          editEvent={selectedEditEvent} // Safely inject target parameters
        />
      )}
    </div>
  );
};