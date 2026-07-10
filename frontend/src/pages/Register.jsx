// src/pages/Register.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';

export const Register = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState('student'); // 'student' or 'organizer'
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    phone_number: '',
    roll_number: '',
    department: '',
    organization_name: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Format fields match backend structure expectations exactly
    const payload = {
      username: formData.username,
      email: formData.email,
      password: formData.password,
      phone_number: formData.phone_number,
      is_student: role === 'student',
      is_organizer: role === 'organizer',
      roll_number: role === 'student' ? formData.roll_number : '',
      department: role === 'student' ? formData.department : '',
      organization_name: role === 'organizer' ? formData.organization_name : '',
    };

    try {
      await API.post('/register/', payload);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      const data = err.response?.data;
      if (typeof data === 'object') {
        // Flatten multiple error dictionary readouts from backend validation errors
        setError(Object.values(data).flat().join(' '));
      } else {
        setError('Registration failed. Please check your data fields.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-slate-100">
        <h2 className="text-3xl font-bold text-slate-900 text-center mb-2">Create Account</h2>
        <p className="text-slate-500 text-center mb-6 text-sm">Join the centralized network platform</p>

        {success && (
          <div className="bg-emerald-50 text-emerald-600 p-3 rounded-lg text-sm font-medium mb-4 border border-emerald-100">
            Registration successful! Redirecting to login...
          </div>
        )}

        {error && (
          <div className="bg-rose-50 text-rose-600 p-3 rounded-lg text-sm font-medium mb-4 border border-rose-100">
            {error}
          </div>
        )}

        {/* Role Selection Switch Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-lg mb-6">
          <button
            type="button"
            onClick={() => setRole('student')}
            className={`flex-1 text-center py-1.5 rounded-md text-sm font-semibold transition ${
              role === 'student' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Student Profile
          </button>
          <button
            type="button"
            onClick={() => setRole('organizer')}
            className={`flex-1 text-center py-1.5 rounded-md text-sm font-semibold transition ${
              role === 'organizer' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Organizer Profile
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Username</label>
            <input
              type="text"
              name="username"
              required
              value={formData.username}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              placeholder="johndoe"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Email ID</label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              placeholder="john@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Contact Number</label>
            <input
              type="text"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              placeholder="9876543210"
            />
          </div>

          {/* Conditional Profile Field Splits */}
          {role === 'student' ? (
            <>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Roll Number</label>
                <input
                  type="text"
                  name="roll_number"
                  required
                  value={formData.roll_number}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  placeholder="24CS0142"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  name="department"
                  required
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  placeholder="Computer Science"
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Organization Name</label>
              <input
                type="text"
                name="organization_name"
                required
                value={formData.organization_name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                placeholder="ACM Student Chapter"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg shadow-md transition duration-200 disabled:opacity-50 mt-2"
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-600 mt-6">
          Already registered?{' '}
          <Link to="/login" className="text-indigo-600 hover:underline font-medium">
            Sign In here
          </Link>
        </p>
      </div>
    </div>
  );
};