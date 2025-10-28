import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";

export default function DoctorHome() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [ratings, setRatings] = useState<{ [key: number]: any }>({});
  const [ratingForm, setRatingForm] = useState({ doctorId: "", rating: "", userId: "" });

  useEffect(() => { api("/doctors").then((d: any) => setDoctors(d.doctors || [])); }, []);

  const loadDoctorRating = async (doctorId: number) => {
    try { const data = await api(`/ratings/${doctorId}`); setRatings(prev => ({ ...prev, [doctorId]: data })); } catch {}
  };

  const submitRating = async () => {
    if (!ratingForm.doctorId || !ratingForm.rating || !ratingForm.userId) { alert('Please fill in all fields'); return; }
    try {
      const res = await api(`/ratings/${ratingForm.doctorId}`, "POST", { user_id: parseInt(ratingForm.userId), rating: parseInt(ratingForm.rating) });
      if (res.status === "SUCCESS") { alert("Rating submitted successfully!"); setRatingForm({ doctorId: "", rating: "", userId: "" }); loadDoctorRating(parseInt(ratingForm.doctorId)); }
    } catch (e: any) { alert("Error: " + e.message); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white/90 backdrop-blur shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center"><Link to="/" className="text-2xl font-bold text-indigo-600">MedCare</Link></div>
          </div>
        </div>
      </nav>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Doctors & Ratings</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {doctors.map((doctor: any) => (
                <div key={doctor.id} className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{doctor.name}</h3>
                  <p className="text-gray-600 mb-4">{doctor.specialty}</p>
                  <div className="space-y-2">
                    <button onClick={() => loadDoctorRating(doctor.id)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">View Rating</button>
                    {ratings[doctor.id] && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Average Rating: {ratings[doctor.id].average_rating ? ratings[doctor.id].average_rating.toFixed(1) : 'N/A'}</p>
                        <p className="text-sm text-gray-600">Total Ratings: {ratings[doctor.id].num_ratings}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Rate a Doctor</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <select value={ratingForm.doctorId} onChange={e => setRatingForm(prev => ({ ...prev, doctorId: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Select Doctor</option>
                {doctors.map((doctor: any) => (<option key={doctor.id} value={doctor.id}>{doctor.name}</option>))}
              </select>
              <input type="number" placeholder="User ID" value={ratingForm.userId} onChange={e => setRatingForm(prev => ({ ...prev, userId: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <select value={ratingForm.rating} onChange={e => setRatingForm(prev => ({ ...prev, rating: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Select Rating</option>
                <option value="1">1 Star</option>
                <option value="2">2 Stars</option>
                <option value="3">3 Stars</option>
                <option value="4">4 Stars</option>
                <option value="5">5 Stars</option>
              </select>
            </div>
            <button onClick={submitRating} className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition">Submit Rating</button>
          </div>
        </div>
      </div>
    </div>
  );
}


