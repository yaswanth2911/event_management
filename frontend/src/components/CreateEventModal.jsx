// src/components/CreateEventModal.jsx
import { useState, useEffect } from 'react';
import API from '../services/api';

export const CreateEventModal = ({ onClose, onEventCreated, editEvent = null }) => {
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    date: '',
    location: '',
    price: '0.00',
    capacity: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await API.get('/categories/');
      setCategories(res.data);
      
      if (editEvent) {
        // If an editing record is present, pre-fill all active values
        setFormData({
          title: editEvent.title,
          description: editEvent.description,
          category: editEvent.category,
          // Format standard datetime strings cleanly for html inputs
          date: editEvent.date ? editEvent.date.substring(0, 16) : '',
          location: editEvent.location,
          price: editEvent.price,
          capacity: editEvent.capacity,
        });
      } else if (res.data.length > 0) {
        setFormData(prev => ({ ...prev, category: res.data[0].id }));
      }
    } catch (err) {
      console.error('Failed to pull categories:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        capacity: parseInt(formData.capacity, 10),
      };

      if (editEvent) {
        // Run PUT update action if modifying existing records
        await API.put(`/events/${editEvent.id}/`, payload);
      } else {
        // Otherwise fire basic POST publish creation intent
        await API.post('/events/', payload);
      }
      onEventCreated();
      onClose();
    } catch (err) {
      setError('Operation failed. Verify authorization inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-100 max-w-lg w-full p-6 relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold text-lg">✕</button>
        
        <h3 className="text-xl font-bold text-slate-900 mb-1">{editEvent ? 'Modify Event Settings' : 'Publish New Event'}</h3>
        <p className="text-sm text-slate-500 mb-4">Update event parameters to align reservation metrics</p>

        {error && <div className="bg-rose-50 text-rose-600 border border-rose-100 p-3 rounded-lg text-xs font-medium mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Event Title</label>
            <input type="text" name="title" required value={formData.title} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description</label>
            <textarea name="description" required rows="3" value={formData.description} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category</label>
              <select name="category" value={formData.category} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Date & Time</label>
              <input type="datetime-local" name="date" required value={formData.date} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Venue Location</label>
            <input type="text" name="location" required value={formData.location} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Ticket Price (INR)</label>
              <input type="number" step="0.01" name="price" required value={formData.price} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Total Capacity</label>
              <input type="number" name="capacity" required value={formData.capacity} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg shadow-md transition disabled:opacity-50 mt-2">
            {loading ? 'Saving adjustments...' : editEvent ? 'Apply Modifications' : 'Create Event'}
          </button>
        </form>
      </div>
    </div>
  );
};