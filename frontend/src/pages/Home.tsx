import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Cliniqu-Ease
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                to="/auth" 
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-full hover:shadow-lg hover:scale-105 transition-all duration-200 font-medium"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Image */}
      <div className="relative bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div className="text-left space-y-6">
              <div className="inline-block">
                <span className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-semibold">
                  Trusted by 50,000+ patients
                </span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Compassionate Care,
                <span className="block bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Modern Medicine
                </span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Trusted doctors, thoughtful care, and seamless digital experiences. Book visits, consult online, and manage your health with confidence.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link 
                  to="/patient" 
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:shadow-xl hover:scale-105 transition-all duration-200 text-center"
                >
                  I'm a Patient
                </Link>
                <Link 
                  to="/doctor" 
                  className="bg-white text-indigo-600 px-8 py-4 rounded-full text-lg font-semibold border-2 border-indigo-200 hover:border-indigo-600 hover:shadow-lg transition-all duration-200 text-center"
                >
                  Doctor Portal
                </Link>
              </div>
            </div>

            {/* Image Container */}
            <div className="relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                {/* Replace the src with your actual image path */}
                <img 
                  src="/banner1.png" 
                  alt="Healthcare professionals" 
                  className="w-full h-full object-cover aspect-[4/3]"
                />
              </div>
              {/* Decorative elements */}
              <div className="absolute -bottom-6 -right-6 w-72 h-72 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full opacity-20 blur-3xl -z-10"></div>
              <div className="absolute -top-6 -left-6 w-72 h-72 bg-gradient-to-br from-indigo-400 to-blue-400 rounded-full opacity-20 blur-3xl -z-10"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Portal</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Access personalized healthcare services tailored to your needs
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {/* Patient Card */}
          <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100">
            <div className="p-8">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">For Patients</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Book appointments, consult doctors online, and access prescriptions with ease.
              </p>
              <Link 
                to="/patient" 
                className="inline-flex items-center text-indigo-600 font-semibold hover:text-indigo-700 group-hover:translate-x-2 transition-transform duration-300"
              >
                Start as Patient
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
            <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
          </div>

          {/* Doctor Card */}
          <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100">
            <div className="p-8">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">For Doctors</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Manage schedules, view patient history, and receive valuable feedback.
              </p>
              <Link 
                to="/doctor" 
                className="inline-flex items-center text-indigo-600 font-semibold hover:text-indigo-700 group-hover:translate-x-2 transition-transform duration-300"
              >
                Doctor Dashboard
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
            <div className="h-2 bg-gradient-to-r from-purple-500 to-pink-500"></div>
          </div>

          {/* Pharmacy Card */}
          <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100">
            <div className="p-8">
              <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-red-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Pharmacy</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Real-time inventory and easy ordering with secure checkout options.
              </p>
              <Link 
                to="/pharmacy" 
                className="inline-flex items-center text-indigo-600 font-semibold hover:text-indigo-700 group-hover:translate-x-2 transition-transform duration-300"
              >
                Pharmacy Portal
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
            <div className="h-2 bg-gradient-to-r from-pink-500 to-red-500"></div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center text-white">
            <div>
              <div className="text-4xl font-bold mb-2">50K+</div>
              <div className="text-indigo-100">Active Patients</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-indigo-100">Expert Doctors</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">100K+</div>
              <div className="text-indigo-100">Appointments</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">4.9/5</div>
              <div className="text-indigo-100">Patient Rating</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}