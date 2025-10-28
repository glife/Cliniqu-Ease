import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import PatientLayout from "./PatientLayout";

export default function BookAppointment() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [message, setMessage] = useState("");
  const [doctorMap, setDoctorMap] = useState<Record<number, string>>({});

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
    const urlParams = new URLSearchParams(window.location.search);
    const doctorParam = urlParams.get("doctor");
    if (doctorParam) setDoctorId(Number(doctorParam));
  }, []);

  useEffect(() => {
    if (doctorId !== null) {
      api(`/doctors/${doctorId}/available`)
        .then((res: any) => setSlots(res.available_slots || []))
        .catch(() => {});
    }
  }, [doctorId]);

  const handleSubmit = async () => {
    if (!user) { setMessage("Please login first"); return; }
    if (!doctorId || !selectedSlot) { setMessage("Please select doctor and time slot"); return; }
    try {
      const res = await api("/book", "POST", { user_id: user.id, doctor_id: doctorId, time_slot: selectedSlot });
      if (res.status === "SUCCESS") {
        const docName = doctorId != null ? doctorMap[doctorId] : "Doctor";
        alert(`Appointment booked with ${docName}`);
        navigate("/patient");
      }
      else { setMessage(res.message || "Failed to book appointment"); }
    } catch (e: any) { setMessage(e.message); }
  };

  return (
    <PatientLayout>
      <div className="bg-white rounded-lg shadow-sm p-6 max-w-2xl">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Book Appointment</h2>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Doctor</label>
            <select
              value={doctorId ?? ""}
              onChange={e => {
                const v = e.target.value;
                setDoctorId(v === "" ? null : Number(v));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Choose a doctor</option>
              {doctors.map((d: any) => (
                <option key={d.id} value={d.id}>{d.name} - {d.specialty}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Available Time Slots</label>
            <select value={selectedSlot} onChange={e => setSelectedSlot(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Choose a time slot</option>
              {slots.map((slot: string) => (<option key={slot} value={slot}>{slot}</option>))}
            </select>
          </div>
          <div className="flex space-x-4">
            <button onClick={handleSubmit} className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition">Book Appointment</button>
            <button onClick={() => navigate('/patient')} className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition">Cancel</button>
          </div>
          {message && (<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{message}</div>)}
        </div>
      </div>
    </PatientLayout>
  );
}


