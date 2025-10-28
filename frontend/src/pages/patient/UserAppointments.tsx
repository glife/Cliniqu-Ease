import React, { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import PatientLayout from "./PatientLayout";

export default function UserAppointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState<any[]>([]);
  const doctorNameById = useMemo(() => {
    const map: Record<number, string> = {};
    doctors.forEach((d: any) => { map[d.id] = `${d.name} (${d.specialty})`; });
    return map;
  }, [doctors]);

  useEffect(() => {
    if (user) {
      api(`/users/${user.id}/appointments`)
        .then((data: any) => setAppointments(data.appointments || []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user]);

  useEffect(() => {
    api('/doctors').then((d: any) => setDoctors(d.doctors || []));
  }, []);

  const cancelAppointment = async (appointmentId: number) => {
    try {
      const res = await api(`/appointments/${appointmentId}`, "DELETE");
      if (res.status === "SUCCESS") {
        setAppointments(prev => prev.filter(apt => apt.id !== appointmentId));
        alert("Appointment cancelled successfully!");
      }
    } catch (e: any) { alert("Error: " + e.message); }
  };

  return (
    <PatientLayout>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">My Appointments</h2>
        {loading ? (
          <div className="flex justify-center items-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-12"><p className="text-gray-500 text-lg">No appointments found.</p></div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment: any) => (
              <div key={appointment.id} className="border border-gray-200 rounded-lg p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Appointment #{appointment.id}</h3>
                    <p className="text-gray-600">Time: {appointment.time_slot}</p>
                    <p className="text-gray-600">Doctor: {doctorNameById[appointment.doctor_id] || `ID ${appointment.doctor_id}`}</p>
                    {appointment.symptoms && appointment.symptoms.length > 0 && (
                      <p className="text-gray-600">Symptoms: {appointment.symptoms.join(", ")}</p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => cancelAppointment(appointment.id)} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition">Cancel</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PatientLayout>
  );
}


