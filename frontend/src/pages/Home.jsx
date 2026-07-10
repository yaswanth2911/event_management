// src/pages/Home.jsx
import { useState, useEffect } from 'react';
import API from '../services/api';
import { BookingModal } from '../components/BookingModal'; // <-- Import the new component

export const Home = () => {
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  
  // State variables for tracking modal view scopes
  const [activeBookingEvent, setActiveBookingEvent] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, [search, selectedCategory]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const catRes = await API.get('/categories/');
      setCategories(catRes.data);

      let url = '/events/?';
      if (search) url += `search=${search}&`;
      if (selectedCategory) url += `category=${selectedCategory}&`;

      const eventRes = await API.get(url);
      setEvents(eventRes.data);
    } catch (err) {
      console.error("Failed to load dashboard parameters:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search and Filters Strip */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-1/2">
          <input
            type="text"
            placeholder="Search by event title, venue, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>
        
        <div className="w-full md:w-1/4">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white transition"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid Display */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 font-medium">Loading events...</div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 text-slate-400 bg-white rounded-xl shadow-sm border">
          No live events found matching the criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div key={event.id} className="bg-white rounded-xl shadow-sm hover:shadow-md border border-slate-100 overflow-hidden flex flex-col transition">
              <div className="h-48 bg-slate-200 relative">
                {event.banner ? (
                  <img src={event.banner} alt={event.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 bg-linear-to-br from-indigo-50 to-slate-200 font-bold">
                    📢 {event.category_name || 'Event Banner'}
                  </div>
                )}
                <span className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-sm text-white px-2.5 py-1 text-xs font-bold rounded-md">
                  ₹{parseFloat(event.price) === 0 ? 'FREE' : event.price}
                </span>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-1">{event.title}</h3>
                  <p className="text-slate-500 text-sm mb-4 line-clamp-2">{event.description}</p>
                </div>

                <div className="space-y-2 border-t border-slate-50 pt-3 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>📅 <b>Date:</b> {new Date(event.date).toLocaleDateString()}</span>
                    <span>📍 <b>Venue:</b> {event.location}</span>
                  </div>
                  
                  <div className="flex justify-between items-center pt-2">
                    <span className={`px-2 py-0.5 rounded font-semibold ${event.seats_available > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                      {event.seats_available > 0 ? `${event.seats_available} Seats Left` : 'House Full'}
                    </span>
                    <button 
                      onClick={() => setActiveBookingEvent(event)}
                      disabled={event.seats_available <= 0}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white disabled:text-slate-400 font-bold px-4 py-1.5 rounded transition shadow-sm"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Render overlay checkouts modal when requested */}
      {activeBookingEvent && (
        <BookingModal 
          event={activeBookingEvent}
          onClose={() => setActiveBookingEvent(null)}
          onBookingSuccess={fetchInitialData}
        />
      )}
    </div>
  );
};