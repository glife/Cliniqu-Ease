import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import PatientLayout from "./PatientLayout";

export default function Medicines() {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/medicines")
      .then((d: any) => setMedicines(d.medicines || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const addToCart = (medicine: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.medicine_id === medicine.id);
      if (existing) {
        return prev.map(item => item.medicine_id === medicine.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { medicine_id: medicine.id, quantity: 1 }];
    });
  };

  const removeFromCart = (medicineId: number) => {
    setCart(prev => prev.filter(item => item.medicine_id !== medicineId));
  };

  const checkout = async () => {
    if (!user) { alert("Please login first"); return; }
    if (cart.length === 0) { alert("Your cart is empty"); return; }
    try {
      const res = await api('/buy_bulk', 'POST', { user_id: user.id, items: cart });
      if (res.status === 'SUCCESS') { alert(`Order placed! Total: ₹${res.total_cost}`); setCart([]); }
      else { alert(res.message || 'Failed to place order'); }
    } catch (e: any) { alert('Error: ' + e.message); }
  };

  return (
    <PatientLayout>
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Pharmacy - Order Medicines</h2>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {medicines.map((medicine: any) => (
                <div key={medicine.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{medicine.name}</h3>
                  <div className="space-y-2 mb-4">
                    <p className="text-gray-600">Price: <span className="font-semibold text-green-600">₹{medicine.price}</span></p>
                    <p className="text-gray-600">Stock: <span className="font-semibold">{medicine.stock}</span></p>
                  </div>
                  <button onClick={() => addToCart(medicine)} className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed" disabled={medicine.stock === 0}>
                    {medicine.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Shopping Cart</h3>
          {cart.length === 0 ? (
            <p className="text-gray-500">Your cart is empty</p>
          ) : (
            <div className="space-y-4">
              {cart.map((item: any) => {
                const medicine = medicines.find(m => m.id === item.medicine_id);
                return (
                  <div key={item.medicine_id} className="flex justify-between items-center p-4 border border-gray-200 rounded-lg">
                    <span className="font-medium">{medicine?.name || 'Unknown'} x {item.quantity}</span>
                    <button onClick={() => removeFromCart(item.medicine_id)} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition">Remove</button>
                  </div>
                );
              })}
              <button onClick={checkout} className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition font-semibold">Checkout</button>
            </div>
          )}
        </div>
      </div>
    </PatientLayout>
  );
}


