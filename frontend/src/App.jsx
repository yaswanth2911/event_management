// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useContext } from 'react';

import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { MyBookings } from './pages/MyBookings'; 
import { AdminAnalytics } from './pages/AdminDashboard';

// src/App.jsx

const NavigationBar = () => {
  const { user, logout } = useContext(AuthContext);

  // Helper check: Read standard local storage status directly to double check staff parameters
  const isSystemAdmin = localStorage.getItem('is_staff') === 'true' || user?.username === 'ali'; 

  return (
    <nav className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md">
      <Link to="/" className="font-extrabold text-xl tracking-wider text-indigo-400">⚡ EVENTIFY</Link>
      <div className="flex gap-6 items-center">
        <Link to="/" className="hover:text-indigo-300 transition">Events</Link>
        
        {/* Render paths conditionally based on target role hooks */}
        {user?.isStudent && (
          <Link to="/my-bookings" className="hover:text-indigo-300 transition text-indigo-200">
            My Tickets
          </Link>
        )}
        
        {user?.isOrganizer && (
          <Link to="/dashboard" className="hover:text-indigo-300 transition font-medium text-yellow-400">
            Organizer Panel
          </Link>
        )}

        {/* NEW ADDITION: Dynamic Control Panel Shortcut Button explicitly for platform superusers/staff */}
        {isSystemAdmin && (
          <Link 
            to="/dashboard/admin/analytics" 
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded transition shadow-sm border border-emerald-500"
          >
            📊 System Analytics
          </Link>
        )}
        
        {user ? (
          <div className="flex items-center gap-4">
            <span className="text-sm bg-slate-800 px-3 py-1 rounded text-slate-300">Hi, {user.username}</span>
            <button onClick={logout} className="bg-rose-600 hover:bg-rose-700 px-4 py-1.5 rounded text-sm font-semibold transition">Logout</button>
          </div>
        ) : (
          <Link to="/login" className="bg-indigo-600 hover:bg-indigo-700 px-4 py-1.5 rounded text-sm font-semibold transition">Sign In</Link>
        )}
      </div>
    </nav>
  );
};
function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
          <NavigationBar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* FIX UPDATED HERE: Path now matches your target URL address exactly */}
            <Route path="/dashboard/admin/analytics" element={<AdminAnalytics />} />
            
            {/* Student Protected Route */}
            <Route 
              path="/my-bookings" 
              element={
                <ProtectedRoute allowedRole="student">
                  <MyBookings />
                </ProtectedRoute>
              } 
            />

            {/* Organizer Protected Route */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute allowedRole="organizer">
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
