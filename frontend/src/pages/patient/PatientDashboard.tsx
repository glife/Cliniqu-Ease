import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import PatientLayout from "./PatientLayout";

export default function PatientDashboard() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/doctors")
      .then((d: any) => setDoctors(d.doctors || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <PatientLayout>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Doctors</h2>
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : doctors.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No doctors available right now.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((d: any) => (
              <div key={d.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-indigo-700 font-semibold">Dr</span>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">{d.name}</h3>
                    <p className="text-gray-600">{d.specialty}</p>
                  </div>
                </div>
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Available slots:</p>
                  <div className="flex flex-wrap gap-2">
                    {d.available_slots.map((slot: string, index: number) => (
                      <span key={index} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        {slot}
                      </span>
                    ))}
                  </div>
                </div>
                <Link to={`/patient/book?doctor=${d.id}`} className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition text-center block">
                  Book Appointment
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </PatientLayout>
  );
}


