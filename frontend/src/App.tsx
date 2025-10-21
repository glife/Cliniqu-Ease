import React, { useState, useEffect, createContext, useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from "react-router-dom";
import axios from "axios";

// API configuration
const API_BASE_URL = "http://127.0.0.1:8001";

// Configure axios
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.headers.common['Content-Type'] = 'application/json';

// API helper
async function api(path: string, method: string = "GET", body?: any) {
  try {
    const response = await axios({
      method,
      url: path,
      data: body
    });
    return response.data;
  } catch (error: any) {
    console.error('API Error:', error);
    throw new Error(error.response?.data?.detail || error.message);
  }
}

// Auth Context
const AuthContext = createContext<any>(null);

function useAuth() {
  return useContext(AuthContext);
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState(() => {
    try { 
      return JSON.parse(localStorage.getItem("mc_user") || 'null'); 
    } catch { 
      return null; 
    }
  });

  useEffect(() => { 
    localStorage.setItem("mc_user", JSON.stringify(user)); 
  }, [user]);

  const login = async (username: string, password: string) => {
    const res = await api("/login", "POST", { username, password });
    setUser({ id: res.user_id, username });
    return res;
  };

  const signup = async (username: string, password: string) => {
    const res = await api("/signup", "POST", { username, password });
    setUser({ id: res.user_id, username });
    return res;
  };

  const logout = () => { 
    setUser(null); 
    localStorage.removeItem("mc_user"); 
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Home Page
function Home() {
  return (
    <div className="container">
      <div className="header">
        <h1>MedCare - Healthcare Management System</h1>
        <p>A simple way to manage healthcare appointments and prescriptions</p>
      </div>

      <div className="nav">
        <Link to="/patient">Patient Portal</Link>
        <Link to="/doctor">Doctor Dashboard</Link>
        <Link to="/pharmacy">Pharmacy</Link>
      </div>

      <div className="grid">
        <div className="card">
          <h3>For Patients</h3>
          <p>Book appointments, consult with doctors, and order medicines online.</p>
          <Link to="/patient" className="btn">Start as Patient</Link>
        </div>
        
        <div className="card">
          <h3>For Doctors</h3>
          <p>Manage your appointments and patient consultations.</p>
          <Link to="/doctor" className="btn">Doctor Dashboard</Link>
        </div>
        
        <div className="card">
          <h3>For Pharmacy</h3>
          <p>Manage medicine inventory and fulfill orders.</p>
          <Link to="/pharmacy" className="btn">Pharmacy Portal</Link>
        </div>
      </div>
    </div>
  );
}

// Patient Layout
function PatientLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  
  return (
    <div className="container">
      <div className="header">
        <h2>Patient Portal</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Welcome, {user?.username || "Guest"}</span>
          {user ? (
            <button onClick={logout} className="btn btn-danger">Logout</button>
          ) : (
            <Link to="/auth" className="btn">Login / Signup</Link>
          )}
        </div>
      </div>
      
      <div className="nav">
        <Link to="/patient">Dashboard</Link>
        <Link to="/patient/book">Book Appointment</Link>
        <Link to="/patient/consult">Consult Doctor</Link>
        <Link to="/patient/medicines">Order Medicines</Link>
      </div>
      
      {children}
    </div>
  );
}

// Patient Dashboard
function PatientDashboard() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => { 
    api("/doctors")
      .then((d: any) => setDoctors(d.doctors || []))
      .catch(err => console.error('Error loading doctors:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PatientLayout>
      <div className="card">
        <h3>Available Doctors</h3>
        {loading ? (
          <p>Loading doctors...</p>
        ) : doctors.length === 0 ? (
          <p>No doctors available right now.</p>
        ) : (
          <div className="grid">
            {doctors.map((d: any) => (
              <div key={d.id} className="card">
                <h4>{d.name}</h4>
                <p>Specialty: {d.specialty}</p>
                <p>Available slots: {d.available_slots.join(', ')}</p>
                <Link to={`/patient/book?doctor=${d.id}`} className="btn">Book Appointment</Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </PatientLayout>
  );
}

// Book Appointment
function BookAppointment() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => { 
    api("/doctors").then((d: any) => setDoctors(d.doctors || [])); 
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
        .catch(err => console.error('Error loading slots:', err));
    }
  }, [doctorId]);

  const handleSubmit = async () => {
    if (!user) {
      setMessage("Please login first");
      return;
    }
    if (!doctorId || !selectedSlot) {
      setMessage("Please select doctor and time slot");
      return;
    }
    
    try {
      const res = await api("/book", "POST", { 
        user_id: user.id, 
        doctor_id: doctorId, 
        time_slot: selectedSlot 
      });
      
      if (res.status === "SUCCESS") {
        alert("Appointment booked successfully!");
        navigate('/patient');
      } else {
        setMessage(res.message || "Failed to book appointment");
      }
    } catch (e: any) {
      setMessage(e.message);
    }
  };

  return (
    <PatientLayout>
      <div className="card">
        <h3>Book Appointment</h3>
        
        <div className="form-group">
          <label>Select Doctor:</label>
          <select 
            value={doctorId || ""} 
            onChange={e => setDoctorId(Number(e.target.value))}
            className="form-control"
          >
            <option value="">Choose a doctor</option>
            {doctors.map((d: any) => (
              <option key={d.id} value={d.id}>
                {d.name} - {d.specialty}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Available Time Slots:</label>
          <select 
            value={selectedSlot} 
            onChange={e => setSelectedSlot(e.target.value)}
            className="form-control"
          >
            <option value="">Choose a time slot</option>
            {slots.map((slot: string) => (
              <option key={slot} value={slot}>{slot}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <button onClick={handleSubmit} className="btn btn-success">
            Book Appointment
          </button>
          <button onClick={() => navigate('/patient')} className="btn">
            Cancel
          </button>
        </div>

        {message && (
          <div style={{ color: 'red', marginTop: '10px' }}>
            {message}
          </div>
        )}
      </div>
    </PatientLayout>
  );
}

// Consult Doctor
function ConsultFlow() {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [symptoms, setSymptoms] = useState("");
  const [result, setResult] = useState<any>(null);

  useEffect(() => { 
    api("/doctors").then((d: any) => setDoctors(d.doctors || [])); 
  }, []);

  const handleSubmit = async () => {
    if (!user) {
      setResult({ error: "Please login first" });
      return;
    }
    
    const symptomList = symptoms.split(",").map(s => s.trim()).filter(Boolean);
    if (symptomList.length === 0) {
      setResult({ error: "Please enter your symptoms" });
      return;
    }
    
    try {
      const res = await api("/consult", "POST", { 
        user_id: user.id, 
        doctor_id: doctorId, 
        symptoms: symptomList 
      });
      setResult(res);
    } catch (e: any) {
      setResult({ error: e.message });
    }
  };

  return (
    <PatientLayout>
      <div className="card">
        <h3>Consult with Doctor</h3>
        
        <div className="form-group">
          <label>Select Doctor (optional):</label>
          <select 
            value={doctorId || ""} 
            onChange={e => setDoctorId(Number(e.target.value))}
            className="form-control"
          >
            <option value="">Any available doctor</option>
            {doctors.map((d: any) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Describe your symptoms (comma separated):</label>
          <textarea 
            value={symptoms} 
            onChange={e => setSymptoms(e.target.value)}
            className="form-control"
            rows={3}
            placeholder="e.g., fever, headache, cough"
          />
        </div>

        <div className="form-group">
          <button onClick={handleSubmit} className="btn btn-success">
            Start Consultation
          </button>
        </div>

        {result && (
          <div className="card mt-4">
            {result.error ? (
              <div style={{ color: 'red' }}>{result.error}</div>
            ) : (
              <div>
                <h4>Consultation Result</h4>
                <p><strong>Diagnosis:</strong> {result.diagnosis}</p>
                <p><strong>Prescription:</strong></p>
                <ul>
                  {result.prescription.map((p: any, i: number) => (
                    <li key={i}>
                      Medicine ID {p.medicine_id} - Quantity: {p.quantity}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </PatientLayout>
  );
}

// Medicines
function Medicines() {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { 
    api("/medicines")
      .then((d: any) => setMedicines(d.medicines || []))
      .catch(err => console.error('Error loading medicines:', err))
      .finally(() => setLoading(false));
  }, []);

  const addToCart = (medicine: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.medicine_id === medicine.id);
      if (existing) {
        return prev.map(item => 
          item.medicine_id === medicine.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { medicine_id: medicine.id, quantity: 1 }];
    });
  };

  const removeFromCart = (medicineId: number) => {
    setCart(prev => prev.filter(item => item.medicine_id !== medicineId));
  };

  const checkout = async () => {
    if (!user) {
      alert('Please login first');
      return;
    }
    if (cart.length === 0) {
      alert('Your cart is empty');
      return;
    }
    
    try {
      const res = await api('/buy_bulk', 'POST', { 
        user_id: user.id, 
        items: cart 
      });
      
      if (res.status === 'SUCCESS') {
        alert(`Order placed successfully! Total cost: ₹${res.total_cost}`);
        setCart([]);
      } else {
        alert(res.message || 'Failed to place order');
      }
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  return (
    <PatientLayout>
      <div className="card">
        <h3>Pharmacy - Order Medicines</h3>
        
        {loading ? (
          <p>Loading medicines...</p>
        ) : (
          <div className="grid">
            {medicines.map((medicine: any) => (
              <div key={medicine.id} className="card">
                <h4>{medicine.name}</h4>
                <p>Price: ₹{medicine.price}</p>
                <p>Stock: {medicine.stock}</p>
                <button 
                  onClick={() => addToCart(medicine)}
                  className="btn"
                  disabled={medicine.stock === 0}
                >
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="card mt-4">
          <h4>Shopping Cart</h4>
          {cart.length === 0 ? (
            <p>Your cart is empty</p>
          ) : (
            <div>
              {cart.map((item: any) => {
                const medicine = medicines.find(m => m.id === item.medicine_id);
                return (
                  <div key={item.medicine_id} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '10px',
                    border: '1px solid #ddd',
                    margin: '5px 0',
                    borderRadius: '4px'
                  }}>
                    <span>{medicine?.name || 'Unknown'} x {item.quantity}</span>
                    <button 
                      onClick={() => removeFromCart(item.medicine_id)}
                      className="btn btn-danger"
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
              <button onClick={checkout} className="btn btn-success mt-4">
                Checkout
              </button>
            </div>
          )}
        </div>
      </div>
    </PatientLayout>
  );
}

// Doctor Dashboard
function DoctorHome() {
  return (
    <div className="container">
      <div className="header">
        <h2>Doctor Dashboard</h2>
      </div>
      
      <div className="card">
        <h3>Today's Appointments</h3>
        <p>Your appointment management interface will appear here.</p>
        <p>Backend supports appointment creation and consultation management.</p>
      </div>
    </div>
  );
}

// Pharmacy Dashboard
function PharmacyHome() {
  const [medicines, setMedicines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { 
    api('/medicines')
      .then((d: any) => setMedicines(d.medicines || []))
      .catch(err => console.error('Error loading medicines:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container">
      <div className="header">
        <h2>Pharmacy Dashboard</h2>
      </div>
      
      <div className="card">
        <h3>Medicine Inventory</h3>
        {loading ? (
          <p>Loading inventory...</p>
        ) : (
          <div className="grid">
            {medicines.map((medicine: any) => (
              <div key={medicine.id} className="card">
                <h4>{medicine.name}</h4>
                <p>Price: ₹{medicine.price}</p>
                <p>Stock: {medicine.stock}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Auth Page
function AuthPage() {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === 'login') {
        await login(username, password);
      } else {
        await signup(username, password);
      }
      setMessage('Success! Redirecting...');
      setTimeout(() => window.location.href = '/patient', 1000);
    } catch (err: any) { 
      setMessage(err.message);
    }
  };

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: '400px', margin: '50px auto' }}>
        <h3>{mode === 'login' ? 'Login' : 'Sign Up'}</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input 
              type="text"
              placeholder="Username" 
              value={username} 
              onChange={e => setUsername(e.target.value)}
              className="form-control"
              required
            />
          </div>
          
          <div className="form-group">
            <input 
              type="password"
              placeholder="Password" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              className="form-control"
              required
            />
          </div>
          
          <div className="form-group">
            <button type="submit" className="btn btn-success">
              {mode === 'login' ? 'Login' : 'Sign Up'}
            </button>
            <button 
              type="button" 
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="btn"
            >
              Switch to {mode === 'login' ? 'Sign Up' : 'Login'}
            </button>
          </div>
        </form>
        
        {message && (
          <div style={{ 
            color: message.includes('Success') ? 'green' : 'red',
            marginTop: '10px'
          }}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

// Main App
export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/patient" element={<PatientDashboard />} />
          <Route path="/patient/book" element={<BookAppointment />} />
          <Route path="/patient/consult" element={<ConsultFlow />} />
          <Route path="/patient/medicines" element={<Medicines />} />
          <Route path="/doctor" element={<DoctorHome />} />
          <Route path="/pharmacy" element={<PharmacyHome />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}