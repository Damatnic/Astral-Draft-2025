/**
 * Admin Route Component
 * Protected route for admin dashboard access with authentication
 */

import React, { useState, useEffect } from 'react';
import { adminService, AdminUser } from '../../services/adminService';
import AdminDashboard from './AdminDashboard';

interface AdminLoginProps {
  onLogin: (admin: AdminUser) => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const admin = await adminService.authenticateAdmin(credentials.username, credentials.password);
      if (admin) {
        onLogin(admin);
      } else {
        setError('Invalid credentials. Please try again.');
      }
    } catch (err) {
      console.error('Admin authentication error:', err);
      setError('Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Access</h1>
          <p className="mt-2 text-gray-600">Sign in to access the admin dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              id="username"
              type="text"
              required
              value={credentials.username}
              onChange={(e: any) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your username"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={credentials.password}
              onChange={(e: any) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-red-400">⚠️</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            }`}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            For demo purposes: username: admin, password: admin123
          </p>
        </div>
      </div>
    </div>
  );
};

const AdminRoute: React.FC = () => {
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if admin is already logged in (in a real app, this would check tokens/sessions)
    const savedAdmin = localStorage.getItem('astral_admin');
    if (savedAdmin) {
      try {
        const admin = JSON.parse(savedAdmin);
        setCurrentAdmin(admin);
      } catch (error) {
        console.error('Failed to parse saved admin data:', error);
        localStorage.removeItem('astral_admin');
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (admin: AdminUser) => {
    setCurrentAdmin(admin);
    localStorage.setItem('astral_admin', JSON.stringify(admin));
  };

  const handleLogout = () => {
    setCurrentAdmin(null);
    localStorage.removeItem('astral_admin');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-semibold text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  if (!currentAdmin) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return (
    <div>
      {/* Admin header with logout */}
      <div className="bg-blue-600 text-white px-4 py-2">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <span className="font-medium">Logged in as: {currentAdmin.username}</span>
            <span className="text-blue-200">Role: {currentAdmin.role}</span>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 rounded-md text-sm font-medium"
          >
            Logout
          </button>
        </div>
      </div>
      
      <AdminDashboard />
    </div>
  );
};

export default AdminRoute;
