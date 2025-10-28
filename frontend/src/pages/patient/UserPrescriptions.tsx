import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import PatientLayout from "./PatientLayout";

export default function UserPrescriptions() {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailedMeds, setDetailedMeds] = useState<Record<number, any[]>>({});

  useEffect(() => {
    if (user) {
      api(`/users/${user.id}/prescriptions`)
        .then((data: any) => setPrescriptions(data.prescriptions || []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user]);

  useEffect(() => {
    // fetch detailed medicine info for each appointment to show names
    const load = async () => {
      try {
        const ids = prescriptions.map(p => p.appointment_id);
        const results = await Promise.all(ids.map((id: number) => api(`/medicines?appointment_id=${id}`)));
        const map: Record<number, any[]> = {};
        ids.forEach((id, idx) => { map[id] = results[idx]?.medicines || []; });
        setDetailedMeds(map);
      } catch {}
    };
    if (prescriptions.length > 0) load();
  }, [prescriptions]);

  const buyPrescription = async (appointmentId: number) => {
    try {
      const res = await api("/buy_prescription", "POST", { appointment_id: appointmentId });
      if (res.status === "SUCCESS") {
        alert(`Prescription purchased successfully! Total cost: ₹${res.total_cost}`);
      } else {
        alert(res.message || "Failed to purchase prescription");
      }
    } catch (e: any) { alert("Error: " + e.message); }
  };

  return (
    <PatientLayout>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">My Prescriptions</h2>
        {loading ? (
          <div className="flex justify-center items-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
        ) : prescriptions.length === 0 ? (
          <div className="text-center py-12"><p className="text-gray-500 text-lg">No prescriptions found.</p></div>
        ) : (
          <div className="space-y-4">
            {prescriptions.map((p: any) => (
              <div key={p.appointment_id} className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Appointment #{p.appointment_id}</h3>
                <p className="text-gray-600 mb-2">Prescription:</p>
                <ul className="list-disc list-inside space-y-1">
                  {(detailedMeds[p.appointment_id]?.length ? detailedMeds[p.appointment_id] : p.prescription).map((med: any, i: number) => (
                    <li key={i} className="text-gray-600">{med.name ? med.name : `Medicine ID ${med.medicine_id}`} - Quantity: {med.quantity}</li>
                  ))}
                </ul>
                <button onClick={() => buyPrescription(p.appointment_id)} className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">Buy Prescription</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </PatientLayout>
  );
}


