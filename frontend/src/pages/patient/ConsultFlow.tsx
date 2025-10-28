import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import PatientLayout from "./PatientLayout";

export default function ConsultFlow() {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [symptoms, setSymptoms] = useState("");
  const [result, setResult] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [appointmentId, setAppointmentId] = useState<number | null>(null);
  const [doctorMap, setDoctorMap] = useState<Record<number, string>>({});
  const [appointmentMeds, setAppointmentMeds] = useState<any[]>([]);

  useEffect(() => {
    api("/doctors").then((d: any) => {
      const list = d.doctors || [];
      setDoctors(list);
      const map: Record<number, string> = {};
      list.forEach((doc: any) => { map[doc.id] = `${doc.name} (${doc.specialty})`; });
      setDoctorMap(map);
    });
  }, []);

  useEffect(() => {
    if (user) {
      api(`/users/${user.id}/appointments`).then((d: any) => {
        const apps = d.appointments || [];
        setAppointments(apps);
        if (apps.length > 0) setAppointmentId(apps[apps.length - 1].id);
      });
    }
  }, [user]);

  const handleSubmit = async () => {
    if (!user) { setResult({ error: "Please login first" }); return; }
    const symptomList = symptoms.split(",").map(s => s.trim()).filter(Boolean);
    if (symptomList.length === 0) { setResult({ error: "Please enter your symptoms" }); return; }
    if (!appointmentId) { setResult({ error: "Please book or select an appointment first" }); return; }
    try {
      const res = await api("/consult", "POST", { appointment_id: appointmentId, symptoms: symptomList });
      setResult(res);
      // fetch detailed medicine info for this appointment so we can show names
      const meds = await api(`/medicines?appointment_id=${appointmentId}`);
      setAppointmentMeds(meds.medicines || []);
    } catch (e: any) { setResult({ error: e.message }); }
  };

  return (
    <PatientLayout>
      <div className="bg-white rounded-lg shadow-sm p-6 max-w-2xl">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Consult with Doctor</h2>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Doctor (optional)</label>
            <select
              value={doctorId ?? ""}
              onChange={e => {
                const v = e.target.value;
                setDoctorId(v === "" ? null : Number(v));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Any available doctor</option>
              {doctors.map((d: any) => (<option key={d.id} value={d.id}>{doctorMap[d.id] || d.name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Appointment</label>
            <select
              value={appointmentId ?? ""}
              onChange={e => {
                const v = e.target.value;
                setAppointmentId(v === "" ? null : Number(v));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Choose an appointment</option>
              {appointments.map((a: any) => (
                <option key={a.id} value={a.id}>
                  #{a.id} • {a.time_slot} • {doctorMap[a.doctor_id] || `Doctor ${a.doctor_id}`}
                </option>
              ))}
            </select>
            {appointments.length === 0 && (
              <p className="mt-2 text-sm text-gray-500">No appointments found. Please book an appointment first.</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Describe your symptoms (comma separated)</label>
            <textarea value={symptoms} onChange={e => setSymptoms(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" rows={4} placeholder="e.g., fever, headache, cough" />
          </div>
          <button onClick={handleSubmit} className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition">Start Consultation</button>
        </div>
        {result && (
          <div className="mt-8 bg-gray-50 rounded-lg p-6">
            {result.error ? (
              <div className="text-red-600">{result.error}</div>
            ) : (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Consultation Result</h3>
                <div className="space-y-3">
                  <div><span className="font-medium">Diagnosis:</span> {result.diagnosis}</div>
                  <div>
                    <span className="font-medium">Prescription:</span>
                    <ul className="mt-2 space-y-1">
                      {(appointmentMeds.length > 0 ? appointmentMeds : result.prescription).map((p: any, i: number) => (
                        <li key={i} className="text-gray-600">
                          {p.name ? `${p.name}` : `Medicine ID ${p.medicine_id}`} - Quantity: {p.quantity}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </PatientLayout>
  );
}


