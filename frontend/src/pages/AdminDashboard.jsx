// src/pages/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import API from '../services/api';

export const AdminAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAdminAnalytics();
  }, []);

  const fetchAdminAnalytics = async () => {
    try {
      setLoading(true);
      const res = await API.get('/admin/analytics/');
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Access Denied: Admin authorization required.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-slate-500">Compiling global matrix trends...</div>;
  if (error) return <div className="p-8 text-rose-600 font-bold">⚠️ {error}</div>;

  const { metrics, recent_bookings } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h2 className="text-3xl font-extrabold text-slate-900">Platform Analytics Panel</h2>
        <p className="text-slate-500 text-sm">Centralized view of global operations and platform revenue</p>
      </div>

      {/* Metric Cards Grid Wrapper */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Gross Platform Revenue</span>
          <span className="text-3xl font-black text-emerald-600 mt-2">₹{metrics.total_revenue.toFixed(2)}</span>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Tickets Booked</span>
          <span className="text-3xl font-black text-slate-900 mt-2">{metrics.total_tickets_sold} Pass(es)</span>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Live Active Events</span>
          <span className="text-3xl font-black text-indigo-600 mt-2">{metrics.total_events} Listing(s)</span>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Active Users</span>
          <span className="text-sm text-slate-600 mt-2">
            🧑‍🎓 Students: <b>{metrics.total_students}</b> <br/>
            🏢 Organizers: <b>{metrics.total_organizers}</b>
          </span>
        </div>
      </div>

      {/* Recent Activity Data Logs Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-50">
          <h3 className="text-lg font-bold text-slate-900">Recent Platform Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
              <tr>
                <th className="p-4">Booking ID</th>
                <th className="p-4">Student User</th>
                <th className="p-4">Target Event</th>
                <th className="p-4">Amount Paid</th>
                <th className="p-4">System Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recent_bookings.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/50 transition">
                  <td className="p-4 font-mono text-xs text-slate-400">#{row.id}</td>
                  <td className="p-4 font-semibold text-slate-900">{row.student}</td>
                  <td className="p-4">{row.event}</td>
                  <td className="p-4 font-bold text-slate-900">₹{row.amount}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      row.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>{row.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};