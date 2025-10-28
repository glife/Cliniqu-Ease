import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";

export default function PharmacyHome() {
  const [medicines, setMedicines] = useState<any[]>([]);
  const [salesReport, setSalesReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [restockForm, setRestockForm] = useState({ medicineId: "", quantity: "" });

  useEffect(() => {
    api('/medicines')
      .then((d: any) => setMedicines(d.medicines || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const loadSalesReport = async () => {
    try { const data = await api('/reports/sales'); setSalesReport(data); } catch {}
  };

  const restockMedicine = async () => {
    if (!restockForm.medicineId || !restockForm.quantity) { alert('Please fill in all fields'); return; }
    try {
      const res = await api(`/medicines/${restockForm.medicineId}/restock?quantity=${restockForm.quantity}`, "POST");
      if (res.status === "SUCCESS") {
        alert(`Medicine restocked! New stock: ${res.new_stock}`);
        setRestockForm({ medicineId: "", quantity: "" });
        api('/medicines').then((d: any) => setMedicines(d.medicines || []));
      }
    } catch (e: any) { alert("Error: " + e.message); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white/90 backdrop-blur shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center"><Link to="/" className="text-2xl font-bold text-indigo-600">Cliqu-Ease</Link></div>
          </div>
        </div>
      </nav>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Medicine Inventory</h2>
            {loading ? (
              <div className="flex justify-center items-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {medicines.map((medicine: any) => (
                  <div key={medicine.id} className="border border-gray-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">{medicine.name}</h4>
                    <div className="space-y-2">
                      <p className="text-gray-600">Price: <span className="font-semibold text-green-600">₹{medicine.price}</span></p>
                      <p className="text-gray-600">Stock: <span className="font-semibold">{medicine.stock}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Restock Medicine</h3>
            <div className="flex flex-wrap gap-4">
              <select value={restockForm.medicineId} onChange={e => setRestockForm(prev => ({ ...prev, medicineId: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Select Medicine</option>
                {medicines.map((medicine: any) => (<option key={medicine.id} value={medicine.id}>{medicine.name}</option>))}
              </select>
              <input type="number" placeholder="Quantity" value={restockForm.quantity} onChange={e => setRestockForm(prev => ({ ...prev, quantity: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <button onClick={restockMedicine} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">Restock</button>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Sales Report</h3>
              <button onClick={loadSalesReport} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">Generate Report</button>
            </div>
            {salesReport && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Total Revenue: ₹{salesReport.total_revenue}</h4>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Sales by Medicine:</h4>
                  <div className="space-y-2">
                    {salesReport.medicine_sales.map((sale: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium">{sale[0]}</span>
                        <span className="text-green-600 font-semibold">₹{sale[1]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


