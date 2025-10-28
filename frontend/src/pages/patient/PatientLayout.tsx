import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <nav className="bg-white/80 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Cliqu-Ease</Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700 hidden sm:block">Welcome, {user?.username || "Guest"}</span>
              {user ? (
                <button onClick={logout} className="bg-gradient-to-r from-red-600 to-rose-600 text-white px-4 py-2 rounded-full hover:shadow-md hover:scale-[1.02] transition-all">Logout</button>
              ) : (
                <Link to="/auth" className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-full hover:shadow-md hover:scale-[1.02] transition-all">Login</Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white/80 backdrop-blur border border-white/60 rounded-2xl shadow-sm p-3 sm:p-4 mb-6">
          <nav className="flex flex-wrap gap-2">
            <Link to="/patient" className="px-4 py-2 rounded-full text-sm font-medium text-gray-700 bg-white hover:text-indigo-700 hover:bg-indigo-50 border border-gray-200 shadow-sm transition-all">Dashboard</Link>
            <Link to="/patient/book" className="px-4 py-2 rounded-full text-sm font-medium text-gray-700 bg-white hover:text-indigo-700 hover:bg-indigo-50 border border-gray-200 shadow-sm transition-all">Book Appointment</Link>
            <Link to="/patient/consult" className="px-4 py-2 rounded-full text-sm font-medium text-gray-700 bg-white hover:text-indigo-700 hover:bg-indigo-50 border border-gray-200 shadow-sm transition-all">Consult Doctor</Link>
            <Link to="/patient/medicines" className="px-4 py-2 rounded-full text-sm font-medium text-gray-700 bg-white hover:text-indigo-700 hover:bg-indigo-50 border border-gray-200 shadow-sm transition-all">Order Medicines</Link>
            <Link to="/patient/appointments" className="px-4 py-2 rounded-full text-sm font-medium text-gray-700 bg-white hover:text-indigo-700 hover:bg-indigo-50 border border-gray-200 shadow-sm transition-all">My Appointments</Link>
            <Link to="/patient/prescriptions" className="px-4 py-2 rounded-full text-sm font-medium text-gray-700 bg-white hover:text-indigo-700 hover:bg-indigo-50 border border-gray-200 shadow-sm transition-all">My Prescriptions</Link>
          </nav>
        </div>
        {children}
      </div>
    </div>
  );
}


